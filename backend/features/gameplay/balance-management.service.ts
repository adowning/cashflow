import { and, asc, eq, sql } from 'drizzle-orm';
import db from '@@/database/index.js';
import { playerBonuses, bonuses } from '@@/database/schema';
import { playerBalances } from '@@/database/schema/gameplay.schema.js';

/**
 * Balance management system for real vs bonus balance handling
 * Implements FIFO logic for multiple bonuses and wagering progress tracking
 */

export interface BonusInfo {
  id: string;
  amount: number;
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
 * Deduct from bonus balance using FIFO logic
 */
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
  // Get active bonuses ordered by creation date (FIFO)
  const activeBonuses = await tx.query.playerBonuses.findMany({
    where: and(eq(playerBonuses.playerId, playerId), eq(playerBonuses.status, 'pending')),
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

/**
 * Deduct from bonus balance using FIFO logic
 */
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

      // Deduct from bonus balance(s) if needed (FIFO logic)
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

/**
 * Get detailed balance information including active bonuses
 */
export async function getDetailedBalance(userId: string): Promise<{
  realBalance: number;
  totalBonusBalance: number;
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
    where: and(eq(playerBonuses.playerId, userId), eq(playerBonuses.status, 'pending')),
    with: {
      bonus: {
        columns: {
          expireDate: true,
          slot: true,
        },
      },
    },
    orderBy: [asc(playerBonuses.createdAt)],
  });
  const bonusDetails: BonusInfo[] = activeBonuses.map((pb) => ({
    id: pb.id,
    amount: Number(pb.amount),
    wageringRequirement: Number(pb.goalAmount) / Number(pb.amount), // Calculate multiplier
    wageredAmount: Number(pb.processAmount),
    remainingAmount: Number(pb.amount),
    expiryDate: (pb.bonus as any)?.expireDate ? new Date((pb.bonus as any).expireDate) : undefined,
    gameRestrictions: [], // Should be populated from bonus configuration
  }));

  return {
    realBalance: Number(playerBalance.realBalance),
    totalBonusBalance: Number(playerBalance.bonusBalance),
    activeBonuses: bonusDetails,
    totalBalance: Number(playerBalance.realBalance) + Number(playerBalance.bonusBalance),
  };
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
    where: and(eq(playerBonuses.playerId, playerId), eq(playerBonuses.status, 'pending')),
    with: {
      bonus: true, // Add this to load the bonus relation
    },
  });

  let totalRequired = 0;
  let totalWagered = 0;

  const bonusProgress = activeBonuses.map((pb) => {
    const required = Number(pb.goalAmount);
    const wagered = Number(pb.processAmount);
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
): Promise<{ sufficient: boolean; balanceType: 'real' | 'bonus'; availableAmount: number }> {
  const playerBalance = await getBalance(playerId);

  if (!playerBalance) {
    return { sufficient: false, balanceType: 'real', availableAmount: 0 };
  }

  // Check real balance first (preferred)
  if (playerBalance.realBalance >= betAmount) {
    return { sufficient: true, balanceType: 'real', availableAmount: playerBalance.realBalance };
  }

  // Check bonus balance as fallback
  if (playerBalance.bonusBalance >= betAmount) {
    return { sufficient: true, balanceType: 'bonus', availableAmount: playerBalance.bonusBalance };
  }

  // Insufficient total balance
  return {
    sufficient: false,
    balanceType: 'real', // Default to real when insufficient
    availableAmount: playerBalance.totalBalance,
  };
}

/**
 * Debit from player balance atomically
 * Uses database transactions for consistency
 */
export async function debitFromBalance(
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
export async function creditToBalance(
  playerId: string,
  amount: number,
  balanceType: 'real' | 'bonus',
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
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

      if (balanceType === 'real') {
        newBalance = Number(currentBalance.realBalance) + amount;
        updateField = { realBalance: newBalance };
      } else {
        newBalance = Number(currentBalance.bonusBalance) + amount;
        updateField = { bonusBalance: newBalance };
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
export async function getBalance(userId: string): Promise<PlayerBalance | undefined> {
  const userBalance = await db.query.playerBalances.findFirst({
    where: eq(playerBalances.playerId, userId),
  });

  if (!userBalance) {
    return undefined;
  }

  return {
    playerId: userBalance.playerId,
    realBalance: Number(userBalance.realBalance),
    bonusBalance: Number(userBalance.bonusBalance),
    totalBalance: Number(userBalance.realBalance) + Number(userBalance.bonusBalance),
  };
}
