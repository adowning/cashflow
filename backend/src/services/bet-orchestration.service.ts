/** biome-ignore-all lint/suspicious/noExplicitAny: <> */


import { validateBet } from './bet-validation.service';
import { getUserWallets } from './wallet.service';
import { deductBetAmount, addWinnings } from './balance-management.service';
import { logGGRContribution } from './ggr.service';
import { getJackpotPools, processJackpotContribution } from './jackpot.service';
import
{
  notifyError,
  sendPostBetNotifications,
} from './realtime-notifications.service';
import { logTransaction } from './transaction-logging.service';
import { addXpToUser, calculateXpForWagerAndWins, getVIPLevels } from './vip.service';
import { updateWageringProgress } from './wagering.service';
import db from '@backend/database';
import { transactions } from '@backend/database/schema';
import { sql } from 'drizzle-orm';

/**
 * Bet processing orchestration service
 * Coordinates all systems for complete bet processing following PRD
 */

export interface BetRequest
{
  userId: string
  gameId: string
  wagerAmount: number // Amount in cents
  operatorId?: string
  sessionId?: string
  affiliateId?: string
}

export interface BetOutcome
{
  userId: string
  gameId: string
  wagerAmount: number
  winAmount: number
  balanceType: 'real' | 'bonus' | 'mixed'
  newBalance: number

  // System contributions
  jackpotContribution: number
  vipPointsEarned: number
  ggrContribution: number

  // Status
  success: boolean
  error?: string

  // Metadata
  transactionId?: string
  processingTime: number
}

export interface GameOutcome
{
  winAmount: number
  gameData?: Record<string, unknown>  // Game-specific outcome data
  jackpotWin?: {
    group: string
    amount: number
  }
}

/**
 * Process complete bet flow from wager to outcome
 */
export async function processBet(
  betRequest: BetRequest,
  gameOutcome: GameOutcome
): Promise<BetOutcome>
{
  const startTime = Date.now();

  try {
    console.log(
      `🎰 Processing bet for user ${betRequest.userId}, game ${betRequest.gameId}`
    );

    // 1. Pre-bet validation
    const validation = await validateBet({
      userId: betRequest.userId,
      gameId: betRequest.gameId,
      wagerAmount: betRequest.wagerAmount,
      operatorId: betRequest.operatorId,
    });

    if (!validation.valid) {
      await notifyError(betRequest.userId, validation.reason || 'Bet validation failed');
      return {
        userId: betRequest.userId,
        gameId: betRequest.gameId,
        wagerAmount: betRequest.wagerAmount,
        winAmount: 0,
        balanceType: 'real',
        newBalance: 0,
        jackpotContribution: 0,
        vipPointsEarned: 0,
        ggrContribution: 0,
        success: false,
        error: validation.reason,
        processingTime: Date.now() - startTime,
      };
    }

    // 2. Get user's active wallet

    const userWallets = await getUserWallets(betRequest.userId);
    const usersWallet = userWallets[0];
    const runningBalance = usersWallet.totalBalance;
    if (!usersWallet) {
      throw new Error('User wallet not found');
    }

    // 3. Process jackpot contribution
    const jackpotResult = await processJackpotContribution(
      betRequest.gameId,
      betRequest.wagerAmount
    ).catch(error =>
    {
      console.error('Jackpot contribution failed:', error);
      return { contributions: { minor: 0, major: 0, mega: 0 }, totalContribution: 0 };
    });
    const totalJackpotContribution = Object.values(
      jackpotResult.contributions
    ).reduce((sum, contrib) => sum + contrib, 0);

    // 4. Deduct wager amount from balance
    const balanceDeduction = await deductBetAmount({
      walletId: usersWallet.walletId,
      amount: betRequest.wagerAmount,
      gameId: betRequest.gameId,
      preferredBalanceType: 'auto', // Use real first, then bonus
    }).catch(error =>
    {
      console.error('Balance deduction failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    });

    if (!balanceDeduction.success) {
      await notifyError(betRequest.userId, balanceDeduction.error || 'Balance deduction failed');
      throw new Error(balanceDeduction.error);
    }

    // 5. Add winnings to balance
    /**
     * Mixed Balance Winnings Distribution Logic:
     *
     * When a bet uses mixed balance types (real + bonus), winnings must be distributed
     * proportionally based on how much was deducted from each balance type during wagering.
     *
     * Algorithm:
     * 1. Calculate total amount deducted from all balance types
     * 2. Determine the ratio of real vs bonus deductions
     * 3. Apply same ratios to winnings distribution
     * 4. Credit real and bonus portions separately
     *
     * This ensures fair distribution and prevents bonus exploitation while maintaining
     * accurate balance tracking for compliance and auditing.
     */
    let winningsAddition: { success: boolean; newBalance: number; error?: string } = { success: true, newBalance: 0 };
    let finalBalance = runningBalance;
    let realWinnings = 0;
    let bonusWinnings = 0;

    if (gameOutcome.winAmount > 0) {
      if (balanceDeduction.balanceType === 'mixed') {
        // Calculate total deducted from all balance types for ratio computation
        const totalDeducted = balanceDeduction.deductedFrom.real +
          balanceDeduction.deductedFrom.bonuses.reduce((sum, b) => sum + b.amount, 0);

        if (totalDeducted === 0) {
          // Edge case: no deduction occurred (shouldn't happen in normal flow)
          // Default to real balance for safety
          realWinnings = gameOutcome.winAmount;
          bonusWinnings = 0;
          winningsAddition = await addWinnings({
            walletId: usersWallet.walletId,
            amount: gameOutcome.winAmount,
            balanceType: 'real',
            reason: `Game win - ${betRequest.gameId}`,
            gameId: betRequest.gameId,
          });
        } else {
          // Proportional distribution based on wager deduction ratios
          const realDeducted = balanceDeduction.deductedFrom.real;
          const bonusDeducted = balanceDeduction.deductedFrom.bonuses.reduce((sum, b) => sum + b.amount, 0);

          // Calculate ratios: how much of the wager came from each balance type
          const realRatio = realDeducted / totalDeducted;
          const _bonusRatio = bonusDeducted / totalDeducted; // Calculated but not directly used (implied by realRatio)

          // Apply same ratios to winnings distribution
          realWinnings = Math.round(gameOutcome.winAmount * realRatio);
          bonusWinnings = gameOutcome.winAmount - realWinnings; // Ensure no rounding loss

          // Credit real portion
          const realAddition = await addWinnings({
            walletId: usersWallet.walletId,
            amount: realWinnings,
            balanceType: 'real',
            reason: `Game win - ${betRequest.gameId} (real portion)`,
            gameId: betRequest.gameId,
          });

          // Credit bonus portion
          const bonusAddition = await addWinnings({
            walletId: usersWallet.walletId,
            amount: bonusWinnings,
            balanceType: 'bonus',
            reason: `Game win - ${betRequest.gameId} (bonus portion)`,
            gameId: betRequest.gameId,
          });

          // Aggregate results - both must succeed for overall success
          winningsAddition = {
            success: realAddition.success && bonusAddition.success,
            newBalance: bonusAddition.newBalance, // Use bonus addition as final balance reference
            error: realAddition.error || bonusAddition.error
          };
        }
      } else {
        // Single balance type - direct crediting
        const balanceType = balanceDeduction.balanceType === 'bonus' ? 'bonus' : 'real';
        winningsAddition = await addWinnings({
          walletId: usersWallet.walletId,
          amount: gameOutcome.winAmount,
          balanceType,
          reason: `Game win - ${betRequest.gameId}`,
          gameId: betRequest.gameId,
        });

        // Track winnings by type for transaction logging
        if (balanceType === 'real') {
          realWinnings = gameOutcome.winAmount;
        } else {
          bonusWinnings = gameOutcome.winAmount;
        }
      }

      if (!winningsAddition.success) {
        console.error('Failed to add winnings:', winningsAddition.error);
        // Continue processing but log error
      }

      finalBalance = winningsAddition.newBalance;
    } else {
      // For losses, calculate balance after wager deduction
      const totalDeducted = balanceDeduction.deductedFrom.real +
        balanceDeduction.deductedFrom.bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
      finalBalance = runningBalance - totalDeducted;
    }

    // 6. Calculate new balance
    const newBalance = finalBalance;

    // 7. Calculate VIP points (awarded for wagering, regardless of win/loss)
    const vipCalculation = calculateXpForWagerAndWins(betRequest.wagerAmount);

    // 8. Update VIP progress
    const vipUpdate = await addXpToUser(
      betRequest.userId,
      vipCalculation.totalPoints
    ).catch(error =>
    {
      console.error('VIP update failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    });

    // 9. Update wagering progress
    const wageringUpdate = await updateWageringProgress({
      userId: betRequest.userId,
      wagerAmount: betRequest.wagerAmount,
      balanceType: balanceDeduction.balanceType,
      gameId: betRequest.gameId,
    }).catch(error =>
    {
      console.error('Wagering progress update failed:', error);
      return { success: false, completedRequirements: [], newProgress: { depositRequirements: [], bonusRequirements: [], overallProgress: 0, totalRequired: 0, totalWagered: 0 }, error: error instanceof Error ? error.message : 'Unknown error' };
    });

    // 10. Log GGR contribution
    const ggrResult = await logGGRContribution({
      betId: `bet_${Date.now()}`,
      userId: betRequest.userId,
      affiliateId: betRequest.affiliateId,
      operatorId: betRequest.operatorId || 'default',
      gameId: betRequest.gameId,
      wagerAmount: betRequest.wagerAmount,
      winAmount: gameOutcome.winAmount,
      currency: 'USD',
    }).catch(error =>
    {
      console.error('GGR contribution logging failed:', error);
      return { ggrAmount: 0 };
    });

    // 11. Log comprehensive transaction
    // Calculate accurate pre/post balances using actual balance deduction data
    const preRealBalance = usersWallet.realBalance;
    const preBonusBalance = usersWallet.bonusBalance;

    // Calculate total amounts deducted from each balance type
    const totalRealDeducted = balanceDeduction.deductedFrom.real;
    const totalBonusDeducted = balanceDeduction.deductedFrom.bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);

    // Calculate post balances: pre - deducted + winnings
    const postRealBalance = preRealBalance - totalRealDeducted + realWinnings;
    const postBonusBalance = preBonusBalance - totalBonusDeducted + bonusWinnings;

    const transactionId = await logTransaction({
      userId: betRequest.userId,
      gameId: betRequest.gameId,
      operatorId: betRequest.operatorId || 'default',
      wagerAmount: betRequest.wagerAmount,
      winAmount: gameOutcome.winAmount,
      betType: balanceDeduction.balanceType,
      preRealBalance,
      postRealBalance,
      preBonusBalance,
      postBonusBalance,
      ggrContribution: ggrResult.ggrAmount,
      jackpotContribution: totalJackpotContribution,
      vipPointsAdded: vipCalculation.totalPoints,
      affiliateId: betRequest.affiliateId,
      sessionId: betRequest.sessionId,
      currency: 'USD',
    }).catch(error =>
    {
      console.error('Transaction logging failed:', error);
      return '';
    });

    // 12. Send realtime notifications
    let realBalanceChange = 0;
    let bonusBalanceChange = 0;
    if (balanceDeduction.balanceType === 'mixed') {
      realBalanceChange = realWinnings - balanceDeduction.deductedFrom.real;
      bonusBalanceChange = bonusWinnings - balanceDeduction.deductedFrom.bonuses.reduce((sum, b) => sum + b.amount, 0);
    } else if (balanceDeduction.balanceType === 'real') {
      realBalanceChange = (gameOutcome.winAmount > 0 ? gameOutcome.winAmount : 0) - balanceDeduction.deductedFrom.real;
    } else if (balanceDeduction.balanceType === 'bonus') {
      bonusBalanceChange = (gameOutcome.winAmount > 0 ? gameOutcome.winAmount : 0) - balanceDeduction.deductedFrom.bonuses.reduce((sum, b) => sum + b.amount, 0);
    }
    await sendPostBetNotifications(betRequest.userId, {
      balanceChange: {
        realBalance: realBalanceChange,
        bonusBalance: bonusBalanceChange,
        totalBalance: newBalance,
        changeAmount: gameOutcome.winAmount - betRequest.wagerAmount,
        changeType: gameOutcome.winAmount > 0 ? 'win' : 'bet',
      },
      vipUpdate: vipUpdate.success,
      wageringUpdate: wageringUpdate.success,
      jackpotContribution: totalJackpotContribution,
    }).catch(error =>
    {
      console.error('Realtime notifications failed:', error);
    });

    const processingTime = Date.now() - startTime;

    // Performance check for sub-300ms requirement
    if (processingTime > 300) {
      console.warn(
        `⚠️ Bet processing exceeded 300ms target: ${processingTime}ms`
      );
    }

    return {
      userId: betRequest.userId,
      gameId: betRequest.gameId,
      wagerAmount: betRequest.wagerAmount,
      winAmount: gameOutcome.winAmount,
      balanceType: balanceDeduction.balanceType,
      newBalance,
      jackpotContribution: totalJackpotContribution,
      vipPointsEarned: vipCalculation.totalPoints,
      ggrContribution: ggrResult.ggrAmount,
      success: true,
      transactionId,
      processingTime,
    };
  } catch (error) {
    console.error('Bet processing failed:', error);

    // Send error notification to user
    await notifyError(
      betRequest.userId,
      error instanceof Error ? error.message : 'Bet processing failed'
    );

    return {
      userId: betRequest.userId,
      gameId: betRequest.gameId,
      wagerAmount: betRequest.wagerAmount,
      winAmount: 0,
      balanceType: 'real',
      newBalance: 0,
      jackpotContribution: 0,
      vipPointsEarned: 0,
      ggrContribution: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Process bet outcome (called after game provider returns result)
 */
export async function processBetOutcome(
  betRequest: BetRequest,
  gameOutcome: GameOutcome
): Promise<BetOutcome>
{
  return processBet(betRequest, gameOutcome);
}


/**
 * Validate bet before processing (quick pre-check)
 */
export async function preValidateBet(
  userId: string,
  gameId: string,
  wagerAmount: number
): Promise<{ valid: boolean; reason?: string }>
{
  try {
    const validation = await validateBet({
      userId,
      gameId,
      wagerAmount,
    });

    return {
      valid: validation.valid,
      reason: validation.valid ? undefined : validation.reason,
    };
  } catch (e) {
    console.error(e);
    return {
      valid: false,
      reason: 'Validation system error',
    };
  }
}

// services/bet-orchestration.service.ts

/**
 * Get bet processing statistics from the last 24 hours.
 *
 * Corrected SQL Query Logic:
 * - totalBets: Count 'BET' and 'BONUS' transactions (wager transactions only)
 * - successfulBets: Count completed wager transactions with status = 'COMPLETED'
 * - totalWagered: Sum wager_amount from 'BET'/'BONUS' transactions (not win amounts)
 * - totalWon: Sum amount from 'WIN' transactions (win amounts only)
 * - averageProcessingTime: Average from logged processing_time field (filtered for validity)
 *
 * Key Corrections:
 * - Separated wager amounts (BET/BONUS.type.wager_amount) from win amounts (WIN.type.amount)
 * - Added status filtering for success rate calculation
 * - Used proper field mappings to prevent data corruption in analytics
 */
export async function getBetProcessingStats(): Promise<{
  totalBets: number
  averageProcessingTime: number // Calculated from actual logged processing_time data
  successRate: number
  totalWagered: number
  totalGGR: number
}>
{
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const results = await db
      .select({
        totalBets: sql`count(CASE WHEN type IN ('BET', 'BONUS') THEN 1 END)`, // Count wager transactions only
        successfulBets: sql`count(CASE WHEN type IN ('BET', 'BONUS') AND status = 'COMPLETED' THEN 1 END)`, // Completed wagers
        totalWagered: sql`coalesce(sum(CASE WHEN type IN ('BET', 'BONUS') THEN wager_amount ELSE 0 END), 0)`, // Sum wager amounts
        totalWon: sql`coalesce(sum(CASE WHEN type = 'WIN' THEN amount ELSE 0 END), 0)`, // Sum win amounts from WIN transactions
        averageProcessingTime: sql`coalesce(avg(CASE WHEN processing_time > 0 AND processing_time < 10000 THEN processing_time ELSE NULL END), 0)`, // Filter valid processing times (0-10s range)
      })
      .from(transactions)
      .where(sql`${transactions.createdAt} >= ${twentyFourHoursAgo}`);
    
    const stats = results[0];
    if (!stats) {
      return {
        totalBets: 0,
        averageProcessingTime: 0,
        successRate: 100,
        totalWagered: 0,
        totalGGR: 0,
      };
    }

    const totalBets = Number(stats.totalBets);
    const successfulBets = Number(stats.successfulBets);
    const totalWagered = Number(stats.totalWagered);
    const totalWon = Number(stats.totalWon);
    const averageProcessingTime = Number(stats.averageProcessingTime); // Now from DB

    const successRate = totalBets > 0 ? (successfulBets / totalBets) * 100 : 100;
    const totalGGR = totalWagered - totalWon;

    return {
      totalBets,
      averageProcessingTime,
      successRate,
      totalWagered,
      totalGGR,
    };

  } catch (error) {
    console.error('Failed to get bet processing stats:', error);
    return {
      totalBets: 0,
      averageProcessingTime: 0,
      successRate: 100,
      totalWagered: 0,
      totalGGR: 0,
    };
  }
}
/**
 * Health check for bet processing system
 */
export async function healthCheck(): Promise<{
  healthy: boolean
  checks: Record<string, boolean>
  responseTime: number
}>
{
  const startTime = Date.now();

  const checks = {
    database: await checkDatabaseConnection(),
    walletService: await checkWalletService(),
    jackpotService: await checkJackpotService(),
    vipService: await checkVIPService(),
  };

  const allHealthy = Object.values(checks).every((check) => check);

  return {
    healthy: allHealthy,
    checks,
    responseTime: Date.now() - startTime,
  };
}

/**
 * Individual health checks
 */
async function checkDatabaseConnection(): Promise<boolean>
{
  try {
    // Test database connectivity with a simple query
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}
async function checkWalletService(): Promise<boolean>
{
  try {
    // Test wallet service by attempting to get balances for a test user
    // Using a non-existent user ID to avoid real data issues
    const testUserId = 'health-check-test-user';
    const wallets = await getUserWallets(testUserId);

    // Validate that wallets were returned (service should respond with data)
    if (!wallets || wallets.length === 0) {
      console.error('Wallet service check failed: No wallets returned for test user (possible service or data issue)');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Wallet service check failed: Exception during call -', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}
async function checkJackpotService(): Promise<boolean>
{
  try {
    // Test jackpot service by attempting to get current pools
    const pools = await getJackpotPools();

    // Verify we got a valid response with expected structure
    if (!pools || typeof pools !== 'object') {
      return false;
    }

    // Check that all expected jackpot groups exist
    const requiredGroups = ['minor', 'major', 'mega'];
    for (const group of requiredGroups) {
      if (!pools[group as keyof typeof pools]) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Jackpot service check failed:', error);
    return false;
  }
}

async function checkVIPService(): Promise<boolean>
{
  try {
    // Test VIP service by attempting to get VIP levels configuration
    const levels = getVIPLevels();

    // Verify we got a valid levels array with expected structure
    if (!Array.isArray(levels) || levels.length === 0) {
      return false;
    }

    // Check that we have at least the basic levels
    const hasBasicLevels = levels.some(level => level.level === 1) &&
      levels.some(level => level.level === 2);

    if (!hasBasicLevels) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('VIP service check failed:', error);
    return false;
  }
}