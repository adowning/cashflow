import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { 
  playerBalances, 
  platformSettings, 
  TPlayerBalances 
} from '@@/database/schema/gameplay.schema.js';
import type { Settings } from '@@/database/schema/other.schema.js';
import { configurationManager } from '@/config/config';
import { logTransaction, LogTransactionRequest } from '@/shared/transaction.service';
import db from '@@/database/index.js'; // Assuming db instance is exported from here

// Define the DB schema type for the constructor
// This is a bit of a guess, adjust as needed for your db instance
type DbInstance = PostgresJsDatabase<typeof import('@@/database/schema')>;

// Input validation schemas
const PositiveInt = z.number().int().positive('Amount must be a positive integer (cents).');
const NonNegativeInt = z.number().int().min(0, 'Amount must be a non-negative integer (cents).');

export const DepositSchema = z.object({
  playerId: z.string().min(1),
  amount: PositiveInt, // in cents
});
export type DepositInput = z.infer<typeof DepositSchema>;

export const GrantBonusSchema = z.object({
  playerId: z.string().min(1),
  amount: PositiveInt, // in cents
});
export type GrantBonusInput = z.infer<typeof GrantBonusSchema>;

export const GrantFreeSpinsSchema = z.object({
  playerId: z.string().min(1),
  count: PositiveInt,
});
export type GrantFreeSpinsInput = z.infer<typeof GrantFreeSpinsSchema>;

export const BetSchema = z.object({
  playerId: z.string().min(1),
  betAmount: NonNegativeInt, // 0 for a free spin
  isFreeSpin: z.boolean().default(false),
});
export type BetInput = z.infer<typeof BetSchema>;

export const WinSchema = z.object({
  playerId: z.string().min(1),
  winAmount: NonNegativeInt, // 0 for a losing spin
  isFreeSpinWin: z.boolean().default(false),
});
export type WinInput = z.infer<typeof WinSchema>;

export const WithdrawSchema = z.object({
  playerId: z.string().min(1),
  amount: PositiveInt, // in cents
});
export type WithdrawInput = z.infer<typeof WithdrawSchema>;

export const RefundSchema = z.object({
  playerId: z.string().min(1),
  amount: PositiveInt,
  reason: z.string(),
});
export type RefundInput = z.infer<typeof RefundSchema>;


export interface PlayerStatistics {
  playerId: string;
  totalWagered: number;
  totalWon: number;
  totalLoss: number;
  rtp: number; // Return to Player, as a percentage (e.g., 95.5)
  totalDeposited: number;
  totalWithdrawn: number;
  netDeposits: number;

  // Liability Metrics
  currentBonusBalance: number;
  outstandingFreeSpins: number;
  estimatedFreeSpinLiability: number; // freeSpins * avgWinValue
  totalBonusGranted: number;
  totalFreeSpinWins: number;
}


export class WageringManager {
  private db: DbInstance;
  private settings: Settings; // Using the type from other.schema

  constructor(db: DbInstance) {
    this.db = db;
    // In a real app, you might fetch this from the db or a config service
    this.settings = configurationManager.getConfiguration();
  }

  /**
   * Retrieves a player's balance, creating one if it doesn't exist.
   */
  private async getOrCreateBalance(playerId: string): Promise<TPlayerBalances> {
    const balances = await this.db
      .select()
      .from(playerBalances)
      .where(eq(playerBalances.playerId, playerId))
      .limit(1);

    if (balances.length > 0) {
      return balances[0];
    }

    // Create a new balance
    const newBalance = { playerId };
    const insertedBalances = await this.db.insert(playerBalances).values(newBalance).returning();

    return insertedBalances[0];
  }

  /**
   * Applies wagering to all active requirements and checks for bonus conversion.
   * This is a core private method.
   */
  private _applyWagering(balance: TPlayerBalances, wagerAmount: number): TPlayerBalances {
    // 1. Reduce all active wagering requirements
    balance.depositWRRemaining = Math.max(0, balance.depositWRRemaining - wagerAmount);
    balance.bonusWRRemaining = Math.max(0, balance.bonusWRRemaining - wagerAmount);

    // 2. Check for Bonus Conversion
    // If bonus WR is now 0 and there is a bonus balance, convert it to real money.
    if (balance.bonusWRRemaining === 0 && balance.bonusBalance > 0) {
      console.log(
        `[WageringManager] CONVERSION: Player ${balance.playerId} converted ${balance.bonusBalance} bonus to real.`,
      );
      balance.realBalance += balance.bonusBalance;
      balance.bonusBalance = 0;

      // Log this conversion as a transaction
      logTransaction({
        playerId: balance.playerId,
        type: 'BONUS_CONVERT',
        status: 'COMPLETED',
        amount: balance.bonusBalance, // The amount that was converted
        realBalanceBefore: balance.realBalance - balance.bonusBalance,
        realBalanceAfter: balance.realBalance,
        bonusBalanceBefore: balance.bonusBalance, // 0 (it was just set)
        bonusBalanceAfter: 0,
      }).catch(console.error);
    }

    return balance;
  }

  // --- PUBLIC API METHODS ---

  /**
   * Handles a player deposit.
   * Credits real balance and adds a 1x (or platform-defined) deposit wagering requirement.
   */
  public async handleDeposit(input: DepositInput): Promise<TPlayerBalances> {
    const { playerId, amount } = DepositSchema.parse(input);
    const balance = await this.getOrCreateBalance(playerId);

    const depositWROwed = amount * (this.settings.depositWRMultiplier || 1);

    const updatedBalances = await this.db
      .update(playerBalances)
      .set({
        realBalance: sql`${playerBalances.realBalance} + ${amount}`,
        totalDeposited: sql`${playerBalances.totalDeposited} + ${amount}`,
        depositWRRemaining: sql`${playerBalances.depositWRRemaining} + ${depositWROwed}`,
        updatedAt: new Date(),
      })
      .where(eq(playerBalances.playerId, playerId))
      .returning();
    
    // Log transaction
    logTransaction({
        playerId: playerId,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        amount: amount,
        realBalanceBefore: balance.realBalance,
        realBalanceAfter: updatedBalances[0].realBalance,
        bonusBalanceBefore: balance.bonusBalance,
        bonusBalanceAfter: updatedBalances[0].bonusBalance,
      }).catch(console.error);

    return updatedBalances[0];
  }

  /**
   * Grants a cash bonus to a player.
   * Credits bonus balance and adds a 30x (or platform-defined) bonus wagering requirement.
   */
  public async grantBonus(input: GrantBonusInput): Promise<TPlayerBalances> {
    const { playerId, amount } = GrantBonusSchema.parse(input);
    const balance = await this.getOrCreateBalance(playerId);

    const bonusWROwed = amount * (this.settings.bonusWRMultiplier || 30);

    const updatedBalances = await this.db
      .update(playerBalances)
      .set({
        bonusBalance: sql`${playerBalances.bonusBalance} + ${amount}`,
        totalBonusGranted: sql`${playerBalances.totalBonusGranted} + ${amount}`,
        bonusWRRemaining: sql`${playerBalances.bonusWRRemaining} + ${bonusWROwed}`,
        updatedAt: new Date(),
      })
      .where(eq(playerBalances.playerId, playerId))
      .returning();

    // Log transaction
    logTransaction({
        playerId: playerId,
        type: 'BONUS_AWARD',
        status: 'COMPLETED',
        amount: amount,
        realBalanceBefore: balance.realBalance,
        realBalanceAfter: updatedBalances[0].realBalance,
        bonusBalanceBefore: balance.bonusBalance,
        bonusBalanceAfter: updatedBalances[0].bonusBalance,
      }).catch(console.error);

    return updatedBalances[0];
  }

  /**
   * Grants free spins to a player.
   * This increases the free spins counter. Liability is tracked separately.
   */
  public async grantFreeSpins(input: GrantFreeSpinsInput): Promise<TPlayerBalances> {
    const { playerId, count } = GrantFreeSpinsSchema.parse(input);
    
    const updatedBalances = await this.db
      .update(playerBalances)
      .set({
        freeSpinsRemaining: sql`${playerBalances.freeSpinsRemaining} + ${count}`,
        updatedAt: new Date(),
      })
      .where(eq(playerBalances.playerId, playerId))
      .returning();

    return updatedBalances[0];
  }

  /**
   * Handles a single bet (spin) from a player.
   * This deducts from balances and applies wagering.
   */
  public async handleBet(input: BetInput): Promise<TPlayerBalances> {
    const { playerId, betAmount, isFreeSpin } = BetSchema.parse(input);
    let balance = await this.getOrCreateBalance(playerId);

    let deductedFromReal = 0;
    let deductedFromBonus = 0;

    if (isFreeSpin) {
      if (balance.freeSpinsRemaining <= 0) {
        throw new Error(`Insufficient free spins for player ${playerId}.`);
      }
      // Using a free spin. No balance change, no wagering applied.
      balance.freeSpinsRemaining -= 1;
    } else {
      // This is a cash bet.
      if (betAmount <= 0) {
        throw new Error('Cash bet amount must be positive.');
      }
      if (balance.realBalance + balance.bonusBalance < betAmount) {
        throw new Error(`Insufficient total balance for player ${playerId}.`);
      }

      // Standard Rule: Deduct from Real balance first, then Bonus.
      deductedFromReal = Math.min(balance.realBalance, betAmount);
      deductedFromBonus = betAmount - deductedFromReal;

      balance.realBalance -= deductedFromReal;
      balance.bonusBalance -= deductedFromBonus;

      // Apply wagering for the full bet amount
      balance.totalWagered += betAmount;
      balance = this._applyWagering(balance, betAmount);
    }

    // Save all changes
    const updatedBalances = await this.db
      .update(playerBalances)
      .set({
        realBalance: balance.realBalance,
        bonusBalance: balance.bonusBalance,
        freeSpinsRemaining: balance.freeSpinsRemaining,
        totalWagered: balance.totalWagered,
        depositWRRemaining: balance.depositWRRemaining,
        bonusWRRemaining: balance.bonusWRRemaining,
        updatedAt: new Date(),
      })
      .where(eq(playerBalances.playerId, balance.playerId))
      .returning();

    // Log transaction
    if (!isFreeSpin) {
         logTransaction({
            playerId: playerId,
            type: 'BET',
            status: 'COMPLETED',
            amount: -betAmount,
            wagerAmount: betAmount,
            realBalanceBefore: balance.realBalance + deductedFromReal,
            realBalanceAfter: balance.realBalance,
            bonusBalanceBefore: balance.bonusBalance + deductedFromBonus,
            bonusBalanceAfter: balance.bonusBalance,
        }).catch(console.error);
    }

    return updatedBalances[0];
  }

  /**
   * Handles a win from a bet.
   * This credits balances and, if it's a free spin win, adds a new wagering requirement.
   */
  public async handleWin(input: WinInput): Promise<TPlayerBalances> {
    const { playerId, winAmount, isFreeSpinWin } = WinSchema.parse(input);
    if (winAmount === 0) return this.getOrCreateBalance(playerId); // No changes on a 0 win

    const balance = await this.getOrCreateBalance(playerId);

    const realBalanceBefore = balance.realBalance;
    const bonusBalanceBefore = balance.bonusBalance;

    balance.totalWon += winAmount;

    if (isFreeSpinWin) {
      // Free spin wins go to BONUS balance
      balance.bonusBalance += winAmount;
      balance.totalFreeSpinWins += winAmount;

      // Add new wagering requirement based on the win
      const newWROwed = winAmount * (this.settings.freeSpinWRMultiplier || 30);
      balance.bonusWRRemaining += newWROwed;
    } else {
      // Standard cash bet win.
      // Standard "Sticky" Rule: If a bonus is active, wins go to bonus.
      if (balance.bonusWRRemaining > 0 || balance.bonusBalance > 0) {
        balance.bonusBalance += winAmount;
      } else {
        // No bonus active, wins go to real.
        balance.realBalance += winAmount;
      }
    }

    // Save changes
    const updatedBalances = await this.db
      .update(playerBalances)
      .set({
        totalWon: balance.totalWon,
        bonusBalance: balance.bonusBalance,
        realBalance: balance.realBalance,
        totalFreeSpinWins: balance.totalFreeSpinWins,
        bonusWRRemaining: balance.bonusWRRemaining,
        updatedAt: new Date(),
      })
      .where(eq(playerBalances.playerId, playerId))
      .returning();

    // Log transaction
    logTransaction({
        playerId: playerId,
        type: 'WIN',
        status: 'COMPLETED',
        amount: winAmount,
        realBalanceBefore: realBalanceBefore,
        realBalanceAfter: updatedBalances[0].realBalance,
        bonusBalanceBefore: bonusBalanceBefore,
        bonusBalanceAfter: updatedBalances[0].bonusBalance,
    }).catch(console.error);

    return updatedBalances[0];
  }

  /**
   * Handles a player withdrawal request.
   * Enforces wagering requirements and bonus forfeiture.
   */
  public async handleWithdraw(input: WithdrawSchema): Promise<TPlayerBalances> {
    const { playerId, amount } = WithdrawSchema.parse(input);
    const balance = await this.getOrCreateBalance(playerId);

    // 1. Check Wagering (moved to canUserWithdraw)
    const eligibility = this.checkWagering(balance);
    if (!eligibility.canWithdraw) {
         throw new Error(eligibility.reason);
    }

    // 2. Check Real Balance
    if (balance.realBalance < amount) {
      throw new Error(
        `Insufficient real balance for player ${playerId}. Requested ${amount}, has ${balance.realBalance}.`,
      );
    }
    
    const realBalanceBefore = balance.realBalance;
    const bonusBalanceBefore = balance.bonusBalance;

    // 3. Process Withdrawal & Forfeiture
    balance.realBalance -= amount;
    balance.totalWithdrawn += amount;

    let forfeitedBonus = 0;
    // Standard Rule: Withdrawing forfeits any active bonus.
    if (balance.bonusBalance > 0 || balance.bonusWRRemaining > 0) {
      console.log(
        `[WageringManager] FORFEITURE: Player ${playerId} forfeited ${balance.bonusBalance} bonus on withdrawal.`,
      );
      forfeitedBonus = balance.bonusBalance;
      balance.bonusBalance = 0;
      balance.bonusWRRemaining = 0;
    }

    // Save changes
    const updatedBalances = await this.db
      .update(playerBalances)
      .set({
        realBalance: balance.realBalance,
        totalWithdrawn: balance.totalWithdrawn,
        bonusBalance: balance.bonusBalance,
        bonusWRRemaining: balance.bonusWRRemaining,
        updatedAt: new Date(),
      })
      .where(eq(playerBalances.playerId, playerId))
      .returning();

    // Log transaction
    logTransaction({
        playerId: playerId,
        type: 'WITHDRAWAL',
        status: 'COMPLETED', // This service assumes the withdrawal is *processed*, not just requested
        amount: -amount,
        realBalanceBefore: realBalanceBefore,
        realBalanceAfter: updatedBalances[0].realBalance,
        bonusBalanceBefore: bonusBalanceBefore,
        bonusBalanceAfter: updatedBalances[0].bonusBalance,
        metadata: {
            forfeitedBonus: forfeitedBonus
        }
    }).catch(console.error);

    return updatedBalances[0];
  }

  /**
   * Handles a refund to a player (e.g., cancelled withdrawal).
   * Credits REAL balance and does NOT add any wagering requirement.
   */
  public async handleRefund(input: RefundInput): Promise<TPlayerBalances> {
    const { playerId, amount, reason } = RefundSchema.parse(input);
    const balance = await this.getOrCreateBalance(playerId);

    const updatedBalances = await this.db
      .update(playerBalances)
      .set({
        realBalance: sql`${playerBalances.realBalance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(playerBalances.playerId, playerId))
      .returning();
    
    // Log transaction
    logTransaction({
        playerId: playerId,
        type: 'ADJUSTMENT', // Use 'ADJUSTMENT' for refunds
        status: 'COMPLETED',
        amount: amount,
        realBalanceBefore: balance.realBalance,
        realBalanceAfter: updatedBalances[0].realBalance,
        bonusBalanceBefore: balance.bonusBalance,
        bonusBalanceAfter: updatedBalances[0].bonusBalance,
        metadata: {
            reason: reason || 'Refund'
        }
    }).catch(console.error);

    return updatedBalances[0];
  }


  // --- STATISTICS & QUERY METHODS ---

  private checkWagering(balance: TPlayerBalances): { canWithdraw: boolean; reason: string; blockingRequirements: any[] } {
     // 1. Check Deposit Wagering
    if (balance.depositWRRemaining > 0) {
      return {
        canWithdraw: false,
        reason: `Player ${balance.playerId} must complete deposit wagering. $${balance.depositWRRemaining / 100} remaining.`,
        blockingRequirements: [{
            id: 'deposit_wagering',
            requiredWagering: 'N/A',
            currentWagering: 'N/A',
            remaining: balance.depositWRRemaining
        }]
      }
    }

    // 2. Check Bonus Wagering
    // If bonus WR is not met, they can withdraw, but they forfeit the bonus.
    // The `handleWithdraw` method handles this forfeiture.
    // However, some platforms might block withdrawal if *any* bonus WR is active.
    // Let's assume for now that if deposit WR is clear, they can withdraw (and forfeit bonus).
    //
    // If the rule is "you CANNOT withdraw if bonus WR is active", uncomment this:
    /*
    if (balance.bonusWRRemaining > 0) {
       return {
        canWithdraw: false,
        reason: `Player ${balance.playerId} must complete bonus wagering or forfeit bonus. $${balance.bonusWRRemaining / 100} remaining.`,
        blockingRequirements: [{
            id: 'bonus_wagering',
            requiredWagering: 'N/A',
            currentWagering: 'N/A',
            remaining: balance.bonusWRRemaining
        }]
      }
    }
    */

    return {
        canWithdraw: true,
        reason: 'Eligible for withdrawal.',
        blockingRequirements: []
    };
  }

  /**
   * Checks if a player is eligible to withdraw.
   */
  public async canUserWithdraw(playerId: string): Promise<{ canWithdraw: boolean; reason: string; blockingRequirements: any[] }> {
    const balance = await this.getOrCreateBalance(playerId);
    return this.checkWagering(balance);
  }

  /**
   * Gets the current balances and WR status for a player.
   */
  public async getPlayerBalances(playerId: string): Promise<TPlayerBalances> {
    const balance = await this.getOrCreateBalance(playerId);
    return balance;
  }

  /**
   * Gets a full statistical report for a player.
   */
  public async getPlayerStatistics(playerId: string): Promise<PlayerStatistics> {
    const balance = await this.getOrCreateBalance(playerId);

    const totalLoss = balance.totalWagered - balance.totalWon;
    const rtp = balance.totalWagered > 0 ? (balance.totalWon / balance.totalWagered) * 100 : 0;
    const netDeposits = balance.totalDeposited - balance.totalWithdrawn;
    const estimatedFreeSpinLiability =
      balance.freeSpinsRemaining * (this.settings.avgFreeSpinWinValue || 15);

    return {
      playerId: balance.playerId,
      totalWagered: balance.totalWagered,
      totalWon: balance.totalWon,
      totalLoss,
      rtp,
      totalDeposited: balance.totalDeposited,
      totalWithdrawn: balance.totalWithdrawn,
      netDeposits,

      // Liability Metrics
      currentBonusBalance: balance.bonusBalance,
      outstandingFreeSpins: balance.freeSpinsRemaining,
      estimatedFreeSpinLiability,
      totalBonusGranted: balance.totalBonusGranted,
      totalFreeSpinWins: balance.totalFreeSpinWins,
    };
  }
}

// Export a singleton instance
export const wageringManager = new WageringManager(db as DbInstance);
