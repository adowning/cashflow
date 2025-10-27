import { and, asc, eq, sql, sum } from 'drizzle-orm';
import db from '@@/database/index.js';
import { playerBonuses, bonuses, type Settings } from '@@/database/schema';
import {
  playerBalances,
  TPlayerBalancess,
  type TPlayerBalances,
} from '@@/database/schema/gameplay.schema.js';
import { configurationManager } from '@/config/config';
import { z } from 'zod';

const PositiveInt = z.number().int().positive('Amount must be a positive integer (cents).');
const NonNegativeInt = z.number().int().min(0, 'Amount must be a non-negative integer (cents).');
/**
 * Balance management system for real vs bonus balance handling
 *
 */
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
export const DepositSchema = z.object({
  playerId: z.string().min(1),
  amount: PositiveInt, // in cents
});
export type DepositInput = z.infer<typeof DepositSchema>;

export const WithdrawSchema = z.object({
  playerId: z.string().min(1),
  amount: PositiveInt, // in cents
});
export type WithdrawInput = z.infer<typeof WithdrawSchema>;

export interface BonusInfo {
  id: string;
  awardedAmount: number;
  wageringRequirement: number;
  wageredAmount: number;
  remainingAmount: number;
  expiryDate?: Date;
  gameRestrictions?: string[];
}

export interface BalanceDeductionRequest {
  playerId: string;
  amount: number; // Amount in cents
  gameId: string;
  preferredBalanceType?: 'real' | 'bonus' | 'auto';
}

export interface BalanceDeductionResult {
  success: boolean;
  balanceType: 'real' | 'bonus' | 'mixed';
  deductedFrom: {
    real: number;
    bonuses: Array<{
      bonusId: string;
      amount: number;
      remainingWagering: number;
    }>;
  };
  wageringProgress: Array<{
    bonusId: string;
    progressBefore: number;
    progressAfter: number;
    completed: boolean;
  }>;
  error?: string;
}

export interface BalanceAdditionRequest {
  playerId: string;
  amount: number; // Amount in cents
  balanceType: 'real' | 'bonus';
  reason: string;
  gameId?: string;
}

export interface BalanceOperation {
  userId: string;
  amount: number; // Amount in cents
  reason: string;
  gameId?: string;
  operatorId?: string;
}

export interface BalanceCheck {
  playerId: string;
  amount: number; // Amount in cents
}

export interface PlayerBalance {
  playerId: string;
  realBalance: number;
  bonusBalance: number;
  totalBalance: number;
}

/**
 * Applies wagering to all active requirements and checks for bonus conversion.
 * This is a core private method.
 */
function _applyWagering(balance: TPlayerBalances, wagerAmount: number): TPlayerBalances {
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
  }

  return balance;
}

async function deductFromBonusBalance(
  tx: any,
  playerId: string,
  amount: number,
  gameId: string,
): Promise<{
  success: boolean;
  wageringProgress: BalanceDeductionResult['wageringProgress'];
  error?: string;
}> {
  // Get active bonuses ordered by creation date
  const activeBonuses = await tx.query.playerBonuses.findMany({
    where: and(eq(playerBonuses.playerId, playerId), eq(playerBonuses.status, 'PENDING')),
    with: {
      bonus: true,
    },
    orderBy: [asc(playerBonuses.createdAt)],
  });

  let remainingAmount = amount;
  const wageringProgress: BalanceDeductionResult['wageringProgress'] = [];

  for (const playerBonus of activeBonuses) {
    if (remainingAmount <= 0) break;

    const bonusInfo = playerBonus.bonus;
    const currentAmount = Number(playerBonus.amount);
    const currentWagered = Number(playerBonus.processAmount);
    const goalAmount = Number(playerBonus.goalAmount);

    // Check if game is allowed for this bonus
    if (bonusInfo.slot === false && gameId) {
      // This is a simplified check - should be more sophisticated
      continue; // Skip this bonus if game not allowed
    }

    const amountFromThisBonus = Math.min(remainingAmount, currentAmount);
    const newAmount = currentAmount - amountFromThisBonus;
    const newWagered = currentWagered + amountFromThisBonus;

    // Update player bonus
    await tx
      .update(playerBonuses)
      .set({
        amount: newAmount,
        processAmount: newWagered,
        updatedAt: new Date(),
      })
      .where(eq(playerBonuses.id, playerBonus.id));

    // Calculate progress
    const progressBefore = currentWagered / goalAmount;
    const progressAfter = newWagered / goalAmount;
    const completed = newWagered >= goalAmount;

    wageringProgress.push({
      bonusId: playerBonus.id,
      progressBefore,
      progressAfter,
      completed,
    });

    // Convert bonus to real balance if wagering complete
    if (completed) {
      await convertBonusToReal(tx, playerId, newAmount);
    }

    // Delete bonus task if balance depleted
    if (newAmount <= 0) {
      await tx.delete(playerBonuses).where(eq(playerBonuses.id, playerBonus.id));
    }

    remainingAmount -= amountFromThisBonus;
  }

  if (remainingAmount > 0) {
    return {
      success: false,
      wageringProgress: [],
      error: 'Insufficient bonus balance across all active bonuses',
    };
  }

  return {
    success: true,
    wageringProgress,
  };
}
async function getActiveBonusTotals(playerIdToFind: string) {
  // This query groups all matching records into one result row
  // and calculates the sum for each specified column.
  const totals = await db
    .select({
      totalAwarded: sum(playerBonuses.awardedAmount),
      totalWageringRequired: sum(playerBonuses.wageringRequired),
      totalWageringProgress: sum(playerBonuses.wageringProgress),
    })
    .from(playerBonuses)
    .where(and(eq(playerBonuses.playerId, playerIdToFind), eq(playerBonuses.status, 'ACTIVE')));

  // The result is an array with one object, e.g.:
  // [{
  //   totalAwarded: '50000',
  //   totalWageringRequired: '1500000',
  //   totalWageringProgress: '25000'
  // }]
  const result = totals[0];

  if (!result || result.totalAwarded === null) {
    console.log('No active bonuses found for this player.');
    return {
      totalAwarded: 0,
      totalWageringRequired: 0,
      totalWageringProgress: 0,
    };
  }
  if (result.totalWageringProgress == null) result.totalWageringProgress = '0';
  if (result.totalWageringRequired == null) result.totalWageringRequired = '0';
  // IMPORTANT: sum() returns a string. You must parse it.
  return {
    totalAwarded: parseInt(result.totalAwarded, 10),
    totalWageringRequired: parseInt(result.totalWageringRequired, 10),
    totalWageringProgress: parseInt(result.totalWageringProgress, 10),
  };
}

export async function deductBetAmount(
  request: BalanceDeductionRequest,
): Promise<BalanceDeductionResult> {
  try {
    const result = await db.transaction(async (tx) => {
      // Get current player balance
      const playerBalance = await tx.query.playerBalances.findFirst({
        where: eq(playerBalances.playerId, request.playerId),
      });

      if (!playerBalance) {
        throw new Error('Player balance not found');
      }

      const realBalance = Number(playerBalance.realBalance);
      const totalBonusBalance = Number(playerBalance.bonusBalance);

      // Determine balance type to use
      let balanceType: 'real' | 'bonus' | 'mixed' = 'real';
      let amountToDeductFromReal = 0;
      let amountToDeductFromBonus = 0;

      if (request.preferredBalanceType === 'real' && realBalance >= request.amount) {
        // Use real balance only
        amountToDeductFromReal = request.amount;
        balanceType = 'real';
      } else if (request.preferredBalanceType === 'bonus' && totalBonusBalance >= request.amount) {
        // Use bonus balance only
        amountToDeductFromBonus = request.amount;
        balanceType = 'bonus';
      } else {
        // Auto mode: use real first, then bonus
        if (realBalance > 0) {
          amountToDeductFromReal = Math.min(realBalance, request.amount);
          const remainingAmount = request.amount - amountToDeductFromReal;

          if (remainingAmount > 0 && totalBonusBalance >= remainingAmount) {
            amountToDeductFromBonus = remainingAmount;
            balanceType = 'mixed';
          } else if (remainingAmount > 0) {
            throw new Error('Insufficient total balance');
          }
        } else if (totalBonusBalance >= request.amount) {
          amountToDeductFromBonus = request.amount;
          balanceType = 'bonus';
        } else {
          throw new Error('Insufficient total balance');
        }
      }

      const wageringProgress: BalanceDeductionResult['wageringProgress'] = [];

      // Deduct from real balance if needed
      if (amountToDeductFromReal > 0) {
        await tx
          .update(playerBalances)
          .set({
            realBalance: sql`${playerBalances.realBalance} - ${amountToDeductFromReal}`,
            updatedAt: new Date(),
          })
          .where(eq(playerBalances.playerId, request.playerId));
      }

      // Deduct from bonus balance(s) if needed
      if (amountToDeductFromBonus > 0) {
        const bonusDeductionResult = await deductFromBonusBalance(
          tx,
          request.playerId,
          amountToDeductFromBonus,
          request.gameId,
        );

        if (!bonusDeductionResult.success) {
          throw new Error(bonusDeductionResult.error || 'Bonus deduction failed');
        }

        wageringProgress.push(...bonusDeductionResult.wageringProgress);
      }

      return {
        success: true,
        balanceType,
        deductedFrom: {
          real: amountToDeductFromReal,
          bonuses:
            amountToDeductFromBonus > 0
              ? [
                  {
                    bonusId: 'multiple',
                    amount: amountToDeductFromBonus,
                    remainingWagering: 0, // Will be calculated properly
                  },
                ]
              : [],
        },
        wageringProgress,
      };
    });

    return result;
  } catch (error) {
    console.error('Balance deduction failed:', error);
    return {
      success: false,
      balanceType: 'real',
      deductedFrom: { real: 0, bonuses: [] },
      wageringProgress: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convert completed bonus to real balance
 */
async function convertBonusToReal(tx: any, playerId: string, bonusAmount: number): Promise<void> {
  // Credit to real balance
  await tx
    .update(playerBalances)
    .set({
      realBalance: sql`${playerBalances.realBalance} + ${bonusAmount}`,
      bonusBalance: sql`${playerBalances.bonusBalance} - ${bonusAmount}`,
      updatedAt: new Date(),
    })
    .where(eq(playerBalances.playerId, playerId));
}

/**
 * Add winnings to appropriate balance
 */
export async function addWinnings(
  request: BalanceAdditionRequest,
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    const creditResult = await creditToBalance(
      request.playerId,
      request.amount,
      request.balanceType,
      'bet',
    );

    return creditResult;
  } catch (error) {
    console.error('Add winnings failed:', error);
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleDeposit(input: DepositInput): Promise<TPlayerBalances> {
  const settings = configurationManager.getConfiguration();

  const { playerId, amount } = DepositSchema.parse(input);
  const balance = await getOrCreateBalance(playerId);

  const depositWROwed = amount * settings.depositWRMultiplier;

  const updatedBalances = await db
    .update(playerBalances)
    .set({
      realBalance: balance.realBalance + amount,
      totalDeposited: balance.totalDeposited + amount,
      depositWRRemaining: balance.depositWRRemaining + depositWROwed,
      updatedAt: new Date(),
    })
    .where(eq(TPlayerBalancess.playerId, playerId))
    .returning();

  return updatedBalances[0];
}

/**
 * Get detailed balance information including active bonuses
 */
export async function getDetailedBalance(userId: string): Promise<{
  realBalance: number;
  bonusBalance: number;
  activeBonuses: BonusInfo[];
  totalBalance: number;
} | null> {
  const playerBalance = await db.query.playerBalances.findFirst({
    where: eq(playerBalances.playerId, userId),
  });

  if (!playerBalance) {
    return null;
  }

  // Get active bonuses with details
  const activeBonuses = await db.query.playerBonuses.findMany({
    where: and(eq(playerBonuses.playerId, userId), eq(playerBonuses.status, 'PENDING')),
    // with: {
    //   bonus: {
    //     columns: {
    //       expiryDays: true,
    //       slot: true,
    //     },
    //   },
    // },
    orderBy: [asc(playerBonuses.createdAt)],
  });

  const bonusDetails: BonusInfo[] = activeBonuses.map((pb) => ({
    id: pb.id,
    awardedAmount: Number(pb.awardedAmount),
    wageringRequirement: Number(pb.wageringRequired), /// Number(pb.amount), // Calculate multiplier
    wageredAmount: Number(pb.wageringProgress),
    remainingAmount: Number(pb.wageringRequired - pb.wageringProgress),
    expiryDate: pb.expiresAt || undefined, //(pb.expiresAt)?.expiresAt
    // ? new Date((pb.expiresAt as any).expireDate)
    // : undefined,
    gameRestrictions: [], // Should be populated from bonus configuration
  }));

  return {
    realBalance: Number(playerBalance.realBalance),
    bonusBalance: Number(playerBalance.bonusBalance),
    activeBonuses: bonusDetails,
    totalBalance: Number(playerBalance.realBalance) + Number(playerBalance.bonusBalance),
  };
}

export async function getOrCreateBalance(playerId: string): Promise<TPlayerBalances> {
  const balances = await db
    .select()
    .from(TPlayerBalancess)
    .where(eq(TPlayerBalancess.playerId, playerId))
    .limit(1);

  if (balances.length > 0) {
    return balances[0];
  }

  // Create a new balance
  const newBalance = { playerId };
  const insertedBalances = await db.insert(TPlayerBalancess).values(newBalance).returning();

  return insertedBalances[0];
}

/**
 * Check if game is allowed for bonus wagering
 */
export async function isGameAllowedForBonus(
  // gameId: string,
  bonusId: string,
): Promise<boolean> {
  const bonus = await db.query.bonuses.findFirst({
    where: eq(bonuses.id, bonusId),
  });

  if (!bonus) {
    return false;
  }

  // This is a simplified check - should be more sophisticated based on game type
  // For now, assuming slot games are generally allowed for bonus wagering
  return bonus.slot === true; // Simplified logic
}

/**
 * Calculate total wagering progress across all bonuses
 */
export async function getWageringProgress(playerId: string): Promise<{
  totalRequired: number;
  totalWagered: number;
  overallProgress: number;
  bonuses: Array<{
    id: string;
    required: number;
    wagered: number;
    progress: number;
    completed: boolean;
  }>;
}> {
  const activeBonuses = await db.query.playerBonuses.findMany({
    where: and(eq(playerBonuses.playerId, playerId), eq(playerBonuses.status, 'PENDING')),
    with: {
      bonus: true, // Add this to load the bonus relation
    },
  });

  let totalRequired = 0;
  let totalWagered = 0;

  const bonusProgress = activeBonuses.map((pb) => {
    const required = Number(pb.wageringRequired);
    const wagered = Number(pb.wageringProgress);
    const progress = required > 0 ? wagered / required : 0;
    const completed = wagered >= required;

    totalRequired += required;
    totalWagered += wagered;

    return {
      id: pb.id,
      required,
      wagered,
      progress,
      completed,
    };
  });

  return {
    totalRequired,
    totalWagered,
    overallProgress: totalRequired > 0 ? totalWagered / totalRequired : 0,
    bonuses: bonusProgress,
  };
}

/**
 * Create a balance record for a new user
 */
export async function createBalanceForNewUser(playerId: string): Promise<void> {
  //   player_id
  // // text

  // real_balance
  // integer

  // bonus_balance
  // integer

  // free_spins_remaining
  // integer

  // deposit_wr_remaining
  // integer

  // bonus_wr_remaining
  // integer

  // total_deposited
  // integer

  // total_withdrawn
  // integer

  // total_wagered
  // integer

  // total_won
  // integer

  // total_bonus_granted
  // integer

  // total_free_spin_wins
  // integer

  await db.insert(playerBalances).values({
    playerId: playerId,
  });
}

/**
 * Check if player has sufficient balance for bet
 * Prioritizes real balance over bonus balance
 */
export async function checkBalance(
  playerId: string,
  betAmount: number,
): Promise<{
  sufficient: boolean;
  balanceType: 'real' | 'bonus';
  availableAmount: number;
}> {
  const playerBalance = await getOrCreateBalance(playerId);

  if (!playerBalance) {
    return { sufficient: false, balanceType: 'real', availableAmount: 0 };
  }

  // Check real balance first (preferred)
  console.log(
    'playerBalance.realBalance + playerBalance.bonusBalance: ',
    playerBalance.realBalance + playerBalance.bonusBalance,
  );
  console.log('betAmount: ', betAmount);
  if (playerBalance.realBalance + playerBalance.bonusBalance >= betAmount) {
    return {
      sufficient: true,
      balanceType: 'real',
      availableAmount: playerBalance.realBalance + playerBalance.bonusBalance,
    };
  }

  // Check bonus balance as fallback
  // if (playerBalance.bonusBalance >= betAmount) {
  //   return {
  //     sufficient: true,
  //     balanceType: "bonus",
  //     availableAmount: playerBalance.bonusBalance,
  //   };
  // }

  // Insufficient total balance
  return {
    sufficient: false,
    balanceType: 'real', // Default to real when insufficient
    availableAmount: playerBalance.realBalance + playerBalance.bonusBalance,
  };
}

/**
 * Debit from player balance atomically
 * Uses database transactions for consistency
 */
async function debitFromBalance(
  playerId: string,
  amount: number,
  balanceType: 'real' | 'bonus',
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    const result = await db.transaction(async (tx) => {
      // Get current balance
      const currentBalance = await tx.query.playerBalances.findFirst({
        where: eq(playerBalances.playerId, playerId),
      });

      if (!currentBalance) {
        throw new Error(`Player ${playerId} not found`);
      }

      let newBalance: number;
      let updateField: any;

      if (balanceType === 'real') {
        if (Number(currentBalance.realBalance) < amount) {
          throw new Error('Insufficient real balance');
        }
        newBalance = Number(currentBalance.realBalance) - amount;
        updateField = { realBalance: newBalance };
      } else {
        if (Number(currentBalance.bonusBalance) < amount) {
          throw new Error('Insufficient bonus balance');
        }
        newBalance = Number(currentBalance.bonusBalance) - amount;
        updateField = { bonusBalance: newBalance };
      }

      // Update balance
      await tx
        .update(playerBalances)
        .set({
          ...updateField,
          updatedAt: new Date(),
        })
        .where(eq(playerBalances.playerId, playerId));

      return { success: true, newBalance };
    });

    return result;
  } catch (error) {
    console.error('Debit operation failed:', error);
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Credit to player balance atomically
 */
async function creditToBalance(
  playerId: string,
  amount: number,
  balanceType: 'real' | 'bonus',
  creditToBalanceType: 'deposit' | 'bet',
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    const settings = configurationManager.getConfiguration();

    // Get current balance outside transaction (better performance and typing)
    const currentBalance = await db.query.playerBalances.findFirst({
      where: eq(playerBalances.playerId, playerId),
    });

    if (!currentBalance) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Use transaction only for the write operation
    const result = await db.transaction(async (tx) => {
      let newBalance: number;
      let updateField: any;
      let wrOwed: number;
      if (balanceType === 'real') {
        newBalance = Math.floor(Math.floor(Number(currentBalance.realBalance) + amount));
        wrOwed = Math.floor(Number(currentBalance.depositWRRemaining) + amount);
        updateField = { realBalance: newBalance, depositWRRemaining: wrOwed };
      } else {
        newBalance = Math.floor(Number(currentBalance.bonusBalance) + amount);
        wrOwed = Math.floor(
          Number(currentBalance.bonusWRRemaining) +
            amount * settings.wageringConfig.defaultWageringMultiplier,
        );
        updateField = { bonusBalance: newBalance, bonusWRRemaining: wrOwed };
      }
      console.log('total_wagered', Number(playerBalances.totalWagered));
      if (creditToBalanceType == 'deposit') {
        const totalDeposited = Math.floor(Number(playerBalances.totalDeposited) + amount);
        updateField.totalDeposited = totalDeposited;
      }
      if (creditToBalanceType == 'bet') {
        const totalWagered = Math.floor(Number(playerBalances.totalWagered) + amount);
        updateField.totalWagered = totalWagered;
      }
      // Update balance atomically
      await tx
        .update(playerBalances)
        .set({
          ...updateField,

          updatedAt: new Date(),
        })
        .where(eq(playerBalances.playerId, playerId));

      return { success: true, newBalance };
    });

    return result;
  } catch (error) {
    console.error('Credit operation failed:', error);
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all balances for a user across different operators
 */
// export async function getOrCreateBalance(playerId: string): Promise<PlayerBalance> {
//   let userBalance;
//   userBalance = await db.query.playerBalances.findFirst({
//     where: eq(playerBalances.playerId, playerId),
//   });

//   if (!userBalance) {
//     const _userBalance = await db
//       .insert(playerBalances)
//       .values({
//         playerId,
//       })
//       .returning();
//     if (_userBalance != undefined) userBalance = _userBalance;
//   }
//   return userBalance;
//   // return {
//   //   playerId: userBalance.playerId,
//   //   realBalance: Number(userBalance.realBalance),
//   //   bonusBalance: Number(userBalance.bonusBalance),
//   //   totalBalance:
//   //     Number(userBalance.realBalance) + Number(userBalance.bonusBalance),
//   // };
// }
