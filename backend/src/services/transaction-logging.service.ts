/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import db from '../database';
import { transactions } from '../database/schema';
import { and, desc, eq, gte, lte, SQL, sql } from 'drizzle-orm';

/**
 * Comprehensive transaction logging system with all PRD fields
 * Logs every bet with complete audit trail for compliance and analytics
 */

export interface TransactionLogData
{
  // Core transaction fields
  userId: string
  gameId: string
  operatorId: string
  wagerAmount: number // Amount in cents
  winAmount: number // Amount in cents
  betType: 'real' | 'bonus' | 'mixed'

  // Balance information
  preRealBalance: number
  postRealBalance: number
  preBonusBalance: number
  postBonusBalance: number

  // System contributions
  jackpotContribution?: number
  vipPointsAdded?: number
  ggrContribution: number

  // Metadata
  sessionId?: string
  affiliateId?: string
  currency?: string
  gameName?: string
  provider?: string
  category?: string

  // Additional context
  wageringProgress?: Record<string, unknown>
  jackpotContributions?: Record<string, number>
}

export interface TransactionQuery
{
  userId?: string
  gameId?: string
  operatorId?: string
  dateFrom?: Date
  dateTo?: Date
  betType?: 'real' | 'bonus' | 'mixed'
  limit?: number
  offset?: number
}

export interface TransactionSummary
{
  totalTransactions: number
  totalWagered: number
  totalWon: number
  totalGGR: number
  averageBet: number
  winRate: number
  rtp: number
}

/**
 * Log comprehensive transaction with all PRD fields
 */
export async function logTransaction(
  transactionData: TransactionLogData
): Promise<string>
{
  try {
    const transactionId = crypto.randomUUID();

    // Prepare transaction record following PRD schema
    const transactionRecord = {
      id: transactionId,
      playerId: transactionData.userId,
      relatedId: transactionData.sessionId || transactionId,
      tnxId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: transactionData.winAmount, // Win amount
      beforeAmount:
                transactionData.preRealBalance +
                transactionData.preBonusBalance,
      afterAmount:
                transactionData.postRealBalance +
                transactionData.postBonusBalance,
      currencyName: transactionData.currency || 'USD',
      type: transactionData.betType === 'bonus' ? 'BONUS' : 'BET',
      typeDescription: `${transactionData.betType.toUpperCase()} bet - ${transactionData.gameName || 'Unknown Game'}`,
      gameName: transactionData.gameName,
      gameId: transactionData.gameId,
      path: [], // Would be populated with affiliate path if applicable
      category: transactionData.category,
      provider: transactionData.provider,
      wagerAmount: transactionData.wagerAmount, // Store wager amount
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    /**
     * WIN Transaction Handling:
     *
     * For each bet that results in a win, we create a separate 'WIN' transaction record
     * in addition to the 'BET'/'BONUS' transaction. This ensures accurate financial tracking
     * and enables correct statistics calculation.
     *
     * Key differences from BET transactions:
     * - Type: 'WIN' (vs 'BET' or 'BONUS')
     * - Amount: Represents the win amount (positive)
     * - Status: Always 'COMPLETED' (wins are immediately processed)
     * - wagerAmount: Included for reference and GGR calculations
     *
     * This dual-transaction approach allows the statistics queries to correctly
     * distinguish between wager amounts and win amounts, preventing data corruption
     * in analytics and compliance reporting.
     */
    let winTransactionId: string | undefined;
    if (transactionData.winAmount > 0) {
      winTransactionId = crypto.randomUUID();
      const winTransactionRecord = {
        id: winTransactionId,
        playerId: transactionData.userId,
        relatedId: transactionData.sessionId || winTransactionId,
        tnxId: `WIN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: transactionData.winAmount, // Win amount (positive value)
        beforeAmount:
                  transactionData.preRealBalance +
                  transactionData.preBonusBalance,
        afterAmount:
                  transactionData.postRealBalance +
                  transactionData.postBonusBalance,
        currencyName: transactionData.currency || 'USD',
        type: 'WIN', // Dedicated transaction type for wins
        typeDescription: `Win - ${transactionData.gameName || 'Unknown Game'}`,
        gameName: transactionData.gameName,
        gameId: transactionData.gameId,
        path: [], // Would be populated with affiliate path if applicable
        category: transactionData.category,
        provider: transactionData.provider,
        wagerAmount: transactionData.wagerAmount, // Reference to original wager for analytics
        status: 'COMPLETED', // Wins are immediately credited and completed
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(transactions).values(winTransactionRecord);
    }

    // Insert into transactions table
    await db.insert(transactions).values(transactionRecord);

    // Additional logging for audit trail
    await logDetailedTransaction(transactionId, transactionData);

    return transactionId;

  } catch (error) {
    console.error('Transaction logging failed:', error);
    throw new Error(`Failed to log transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Log detailed transaction data for comprehensive audit trail
 */
async function logDetailedTransaction(
  transactionId: string,
  transactionData: TransactionLogData
): Promise<void>
{
  const detailedLog = {
    transactionId,
    timestamp: new Date().toISOString(),
    userId: transactionData.userId,
    gameId: transactionData.gameId,
    operatorId: transactionData.operatorId,

    // Financial data
    wagerAmount: transactionData.wagerAmount,
    winAmount: transactionData.winAmount,
    ggrContribution: transactionData.ggrContribution,

    // Balance changes
    balanceChanges: {
      realBalance: {
        before: transactionData.preRealBalance,
        after: transactionData.postRealBalance,
        change:
                    transactionData.postRealBalance -
                    transactionData.preRealBalance,
      },
      bonusBalance: {
        before: transactionData.preBonusBalance,
        after: transactionData.postBonusBalance,
        change:
                    transactionData.postBonusBalance -
                    transactionData.preBonusBalance,
      },
    },

    // System contributions
    systemContributions: {
      jackpotContribution: transactionData.jackpotContribution || 0,
      vipPointsAdded: transactionData.vipPointsAdded || 0,
    },

    // Metadata
    metadata: {
      betType: transactionData.betType,
      affiliateId: transactionData.affiliateId,
      currency: transactionData.currency,
      sessionId: transactionData.sessionId,
    },

    // Additional context
    context: {
      wageringProgress: transactionData.wageringProgress,
      jackpotContributions: transactionData.jackpotContributions,
    },
  };

  // In production, this would be stored in a detailed_transactions table
  // For now, log to console for audit purposes
  console.log('Detailed transaction logged:', detailedLog);
}

/**
 * Query transactions with filtering and pagination
 */
export async function queryTransactions(query: TransactionQuery): Promise<{
  transactions: typeof transactions.$inferSelect[]
  total: number
  summary?: TransactionSummary
}>
{
  try {
    // Build where conditions
    const whereConditions: SQL[] = [];

    if (query.userId) {
      whereConditions.push(eq(transactions.playerId, query.userId));
    }

    // if (query.gameId) {
    //   whereConditions.push(eq(transactions.gameId, query.gameId));
    // }

    if (query.operatorId) {
      // Would need operator_id field in transactions table
      // whereConditions.push(eq(transactions.operatorId, query.operatorId));
    }

    if (query.dateFrom) {
      whereConditions.push(gte(transactions.createdAt, query.dateFrom));
    }

    if (query.dateTo) {
      whereConditions.push(lte(transactions.createdAt, query.dateTo));
    }

    if (query.betType) {
      whereConditions.push(eq(transactions.type, query.betType));
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(transactions)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Get transactions with pagination
    const transactionResults = await db.query.transactions.findMany({
      where: whereClause,
      orderBy: [desc(transactions.createdAt)],
      limit: query.limit || 50,
      offset: query.offset || 0,
    });

    // Calculate summary if requested
    let summary: TransactionSummary | undefined;
    if (query.userId || query.gameId) {
      summary = await calculateTransactionSummary(whereClause);
    }

    return {
      transactions: transactionResults,
      total,
      summary,
    };
  } catch (error) {
    console.error('Transaction query failed:', error);
    return {
      transactions: [],
      total: 0,
    };
  }
}

/**
 * Calculate transaction summary for analytics
 */
async function calculateTransactionSummary(
  whereClause?: SQL
): Promise<TransactionSummary>
{
  const results = await db
    .select({
      totalWagered: sql<number>`COALESCE(SUM(CASE WHEN type IN ('BET', 'BONUS') THEN beforeAmount - afterAmount + amount ELSE 0 END), 0)`,
      totalWon: sql<number>`COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)`,
      totalTransactions: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(whereClause);

  const data = results[0];
  const totalWagered = data?.totalWagered || 0;
  const totalWon = data?.totalWon || 0;
  const totalTransactions = data?.totalTransactions || 0;

  const averageBet =
    totalTransactions > 0 ? totalWagered / totalTransactions : 0;
  const winRate = totalWagered > 0 ? (totalWon / totalWagered) * 100 : 0;
  const rtp = totalWagered > 0 ? (totalWon / totalWagered) * 100 : 0;
  const totalGGR = totalWagered - totalWon;

  return {
    totalTransactions,
    totalWagered,
    totalWon,
    totalGGR,
    averageBet,
    winRate,
    rtp,
  };
}

/**
 * Get transaction statistics for a user
 */
export async function getUserTransactionStats(
  userId: string,
  days: number = 30
): Promise<
    TransactionSummary & {
      favoriteGame?: string
      totalPlayTime?: number
      biggestWin?: number
    }
>
{
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const query: TransactionQuery = {
    userId,
    dateFrom,
  };

  const result = await queryTransactions(query);

  if (!result.summary) {
    return {
      totalTransactions: 0,
      totalWagered: 0,
      totalWon: 0,
      totalGGR: 0,
      averageBet: 0,
      winRate: 0,
      rtp: 0,
    };
  }

  // Get additional user-specific stats
  const favoriteGame = await getUserFavoriteGame();
  const biggestWin = await getUserBiggestWin();

  return {
    ...result.summary,
    favoriteGame,
    biggestWin,
  };
}

/**
 * Get user's favorite game based on wager amount
 */
async function getUserFavoriteGame(): Promise<string | undefined>
{
  // In production, this would query transaction data grouped by game
  // For now, returning placeholder
  return 'Slot Game 1';
}

/**
 * Get user's biggest win
 */
async function getUserBiggestWin(): Promise<number | undefined>
{
  // In production, this would query max win amount from transactions
  // For now, returning placeholder
  return 100000; // $1,000
}

/**
 * Log RTP (Return to Player) data for compliance
 */
export async function logRTPData(
  gameId: string,
  userId: string,
  wagerAmount: number,
  winAmount: number,
  theoreticalRTP: number
): Promise<void>
{
  const actualRTP = wagerAmount > 0 ? (winAmount / wagerAmount) * 100 : 0;

  const rtpLog = {
    gameId,
    userId,
    wagerAmount,
    winAmount,
    actualRTP,
    theoreticalRTP,
    timestamp: new Date().toISOString(),
    difference: actualRTP - theoreticalRTP,
  };

  // In production, this would be stored in an rtp_tracking table
  console.log('RTP data logged:', rtpLog);
}

/**
 * Get RTP statistics for compliance reporting
 */
export async function getRTPStatistics(
  gameId?: string,
  hours: number = 24
): Promise<{
  gameId?: string
  periodHours: number
  totalWagers: number
  totalWins: number
  actualRTP: number
  theoreticalRTP: number
  variance: number
  sampleSize: number
}>
{
  const periodStart = new Date();
  periodStart.setHours(periodStart.getHours() - hours);

  // In production, this would query RTP tracking data
  // For now, returning placeholder data
  return {
    gameId,
    periodHours: hours,
    totalWagers: 1000000, // $10,000
    totalWins: 960000, // $9,600
    actualRTP: 96.0,
    theoreticalRTP: 96.0,
    variance: 0,
    sampleSize: 1000,
  };
}

/**
 * Create transaction log for bet processing integration
 */
export async function createBetTransactionLog(
  userId: string,
  gameId: string,
  wagerAmount: number,
  winAmount: number,
  balanceInfo: {
    preReal: number
    postReal: number
    preBonus: number
    postBonus: number
  },
  additionalData?: {
    jackpotContribution?: number
    vipPoints?: number
    affiliateId?: string
    sessionId?: string
  }
): Promise<string | null>
{
  try {
    const transactionData: TransactionLogData = {
      userId,
      gameId,
      operatorId: 'default', // Would come from user session
      wagerAmount,
      winAmount,
      betType: balanceInfo.preBonus > 0 ? 'bonus' : 'real',
      preRealBalance: balanceInfo.preReal,
      postRealBalance: balanceInfo.postReal,
      preBonusBalance: balanceInfo.preBonus,
      postBonusBalance: balanceInfo.postBonus,
      ggrContribution: wagerAmount - winAmount,
      jackpotContribution: additionalData?.jackpotContribution,
      vipPointsAdded: additionalData?.vipPoints,
      affiliateId: additionalData?.affiliateId,
      sessionId: additionalData?.sessionId,
      currency: 'USD',
    };

    const result = await logTransaction(transactionData);
    return result || '';
  } catch (error) {
    console.error('Failed to create bet transaction log:', error);
    return null;
  }
}
