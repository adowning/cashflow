/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import { balances, playerBonuses, players, bonuses } from '@@/database/schema';
import db from '@@/database';
import { and, desc, eq, sql } from 'drizzle-orm';

/**
 * Wagering progress tracking system
 * Handles 1x deposit requirements and bonus wagering requirements
 */

export interface WageringRequirement {
  id: string;
  type: 'deposit' | 'bonus';
  userId: string;
  amount: number; // Original amount in cents
  requiredWagering: number; // Required wagering amount in cents
  currentWagering: number; // Current wagered amount in cents
  progress: number; // Progress as percentage (0-100)
  completed: boolean;
  expiryDate?: Date;
  gameRestrictions?: string[];
}

export interface WageringUpdate {
  userId: string;
  wagerAmount: number; // Amount in cents
  balanceType: 'real' | 'bonus' | 'mixed';
  gameId: string;
}

export interface WageringProgress {
  depositRequirements: WageringRequirement[];
  bonusRequirements: WageringRequirement[];
  overallProgress: number;
  totalRequired: number;
  totalWagered: number;
}

/**
 * Update wagering progress after a bet
 * Handles both deposit 1x requirements and bonus wagering requirements
 */
export async function updateWageringProgress(update: WageringUpdate): Promise<{
  success: boolean;
  completedRequirements: string[];
  newProgress: WageringProgress;
  error?: string;
}> {
  try {
    const result = await db.transaction(async (tx) => {
      const completedRequirements: string[] = [];

      // Update deposit wagering (1x requirement for withdrawals)
      if (update.balanceType === 'real') {
        const depositProgress = await updateDepositWagering(tx, update);
        completedRequirements.push(...depositProgress.completedRequirements);
      }

      // Update bonus wagering (if using bonus balance)
      if (update.balanceType === 'bonus') {
        const bonusProgress = await updateBonusWagering(tx, update);
        completedRequirements.push(...bonusProgress.completedRequirements);
      }

      // Get updated progress summary
      const newProgress = await getWageringProgress(update.userId);

      return {
        success: true,
        completedRequirements,
        newProgress,
      };
    });

    return result;
  } catch (error) {
    console.error('Wagering progress update failed:', error);
    return {
      success: false,
      completedRequirements: [],
      newProgress: await getWageringProgress(update.userId),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update deposit wagering progress (1x requirement for withdrawals)
 */
async function updateDepositWagering(
  tx: any,
  update: WageringUpdate,
): Promise<{ completedRequirements: string[] }> {
  const completedRequirements: string[] = [];

  // Get user's active wallet
  const user = await tx.query.players.findFirst({
    where: eq(players.id, update.userId),
    with: {
      wallets: {
        with: {
          balances: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User wallet not found');
  }

  // Get recent deposits that need 1x wagering
  // const recentDeposits = await tx.query.deposits.findMany({
  //   where: and(
  //     eq(deposits.userId, update.userId),
  //     eq(deposits.status, 'completed'),
  //     gte(deposits.createdAt, sql`NOW() - INTERVAL '30 days'`), // 30-day window
  //   ),
  //   orderBy: [desc(deposits.createdAt)],
  // })

  // for (const deposit of recentDeposits) {
  //   const depositAmount = Number(deposit.amount)
  //   const requiredWagering = depositAmount // 1x requirement

  //   // Check if this deposit's wagering requirement is already met
  //   // In a full implementation, you'd track this per deposit
  //   // For now, using a simplified approach based on total real balance wagered

  //   // This is a placeholder - in production, you'd have a deposit_wagering table
  //   // to track progress per deposit
  // }

  return { completedRequirements };
}

/**
 * Update bonus wagering progress using FIFO logic
 */
async function updateBonusWagering(
  tx: any,
  update: WageringUpdate,
): Promise<{ completedRequirements: string[] }> {
  const completedRequirements: string[] = [];

  // Get active bonuses ordered by creation date (FIFO)
  const activeBonuses = await tx.query.playerBonuses.findMany({
    where: and(eq(playerBonuses.playerId, update.userId), eq(playerBonuses.status, 'pending')),
    with: {
      bonus: true, // Add this to load the bonus relation
    },
    orderBy: [playerBonuses.createdAt], // FIFO - oldest first (should be asc, not desc)
  });

  for (const playerBonus of activeBonuses) {
    const bonusAmount = Number(playerBonus.amount);
    const currentWagered = Number(playerBonus.processAmount);
    const goalAmount = Number(playerBonus.goalAmount);

    // Check if game is allowed for this bonus
    const gameAllowed = await isGameAllowedForBonus(playerBonus.bonusId);
    if (!gameAllowed) {
      continue; // Skip this bonus if game not allowed
    }

    // Update wagering progress
    const newWagered = currentWagered + update.wagerAmount;
    const completed = newWagered >= goalAmount;

    // Update player bonus record
    await tx
      .update(playerBonuses)
      .set({
        processAmount: newWagered,
        status: completed ? 'completed' : 'pending',
        updatedAt: new Date(),
      })
      .where(eq(playerBonuses.id, playerBonus.id));

    if (completed) {
      completedRequirements.push(playerBonus.id);

      // Convert bonus to real balance
      await convertBonusToRealBalance(tx, update.userId, bonusAmount);

      // Mark bonus as completed
      await tx
        .update(playerBonuses)
        .set({
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(playerBonuses.id, playerBonus.id));
    }
  }

  return { completedRequirements };
}

/**
 * Convert completed bonus to real balance
 */
async function convertBonusToRealBalance(
  tx: any,
  userId: string,
  bonusAmount: number,
): Promise<void> {
  Math.min(10, 20);

  // Get user's wallet
  const user = await tx.query.players.findFirst({
    where: eq(players.id, userId),
    with: {
      // wallets: {
      //   with: {
      //     balances: true,
      //   },
      // },
    },
  });

  if (!user) {
    throw new Error('User wallet not found');
  }

  // Get user's wallet balance manually
  const walletBalance = await tx.query.balances.findFirst({
    where: eq(balances.playerId, userId),
  });

  if (!walletBalance) {
    throw new Error('User wallet not found');
  }

  // Convert bonus to real balance
  await tx
    .update(balances)
    .set({
      amount: sql`${balances.amount} + ${bonusAmount}`,
      bonus: sql`${balances.bonus} - ${bonusAmount}`,
      updatedAt: new Date(),
    })
    .where(eq(balances.id, walletBalance.id));
}

/**
 * Check if game is allowed for bonus wagering
 */
async function isGameAllowedForBonus(bonusId: string): Promise<boolean> {
  const _bonus = await db.query.bonuses.findFirst({
    where: eq(bonuses.id, bonusId),
  });

  if (!_bonus) {
    return false;
  }

  // Check game restrictions
  // This is a simplified check - in production, you'd have more sophisticated logic
  // based on game categories, RTP, or specific game IDs

  if (_bonus.slot === false) {
    // Bonus doesn't allow slot games
    // You'd check if the game is a slot game here
    return false;
  }

  return true;
}

/**
 * Get comprehensive wagering progress for a user
 */
export async function getWageringProgress(userId: string): Promise<WageringProgress> {
  // Get deposit wagering requirements (simplified)
  const depositRequirements: WageringRequirement[] = [];

  // Get bonus wagering requirements
  const activeBonuses = await db.query.playerBonuses.findMany({
    where: and(eq(playerBonuses.playerId, userId), eq(playerBonuses.status, 'pending')),
    with: {
      bonus: true, // Add this to load the bonus relation
    },
  });

  const bonusRequirements: WageringRequirement[] = activeBonuses.map((pb) => {
    const amount = Number(pb.amount);
    const requiredWagering = Number(pb.goalAmount);
    const currentWagering = Number(pb.processAmount);
    const progress = requiredWagering > 0 ? (currentWagering / requiredWagering) * 100 : 0;

    return {
      id: pb.id,
      type: 'bonus' as const,
      userId,
      amount,
      requiredWagering,
      currentWagering,
      progress: Math.min(progress, 100),
      completed: currentWagering >= requiredWagering,
      expiryDate: (pb.bonus as any).expireDate ? new Date((pb.bonus as any).expireDate) : undefined,
      gameRestrictions: [], // Should be populated from bonus configuration
    };
  });

  // Calculate overall progress
  const totalRequired = bonusRequirements.reduce((sum, req) => sum + req.requiredWagering, 0);
  const totalWagered = bonusRequirements.reduce((sum, req) => sum + req.currentWagering, 0);
  const overallProgress = totalRequired > 0 ? (totalWagered / totalRequired) * 100 : 0;

  return {
    depositRequirements,
    bonusRequirements,
    overallProgress: Math.min(overallProgress, 100),
    totalRequired,
    totalWagered,
  };
}

/**
 * Check if user can withdraw (all wagering requirements met)
 */
export async function canUserWithdraw(userId: string): Promise<{
  canWithdraw: boolean;
  blockingRequirements: WageringRequirement[];
  reason?: string;
}> {
  const progress = await getWageringProgress(userId);

  // Check if any bonus requirements are incomplete
  const incompleteBonuses = progress.bonusRequirements.filter((req) => !req.completed);

  if (incompleteBonuses.length > 0) {
    return {
      canWithdraw: false,
      blockingRequirements: incompleteBonuses,
      reason: 'Active bonus wagering requirements must be completed before withdrawal',
    };
  }

  // Check deposit wagering requirements (simplified)
  // In a full implementation, you'd check if recent deposits have met 1x requirement

  return {
    canWithdraw: true,
    blockingRequirements: [],
  };
}

/**
 * Get wagering requirement details for a specific bonus
 */
export async function getBonusWageringDetails(
  bonusId: string,
): Promise<WageringRequirement | null> {
  const playerBonus = await db.query.playerBonuses.findFirst({
    where: eq(playerBonuses.id, bonusId),
  });

  if (!playerBonus) {
    return null;
  }

  const amount = Number(playerBonus.amount);
  const requiredWagering = Number(playerBonus.goalAmount);
  const currentWagering = Number(playerBonus.processAmount);
  const progress = requiredWagering > 0 ? (currentWagering / requiredWagering) * 100 : 0;

  return {
    id: playerBonus.id,
    type: 'bonus',
    userId: playerBonus.playerId,
    amount,
    requiredWagering,
    currentWagering,
    progress: Math.min(progress, 100),
    completed: currentWagering >= requiredWagering,
    expiryDate: (playerBonus.bonus as any).expireDate
      ? new Date((playerBonus.bonus as any).expireDate)
      : undefined,
    gameRestrictions: [], // Should be populated from bonus configuration
  };
}

/**
 * Calculate remaining wagering requirement for withdrawal eligibility
 */
export async function getWithdrawalEligibility(userId: string): Promise<{
  eligible: boolean;
  totalRemainingWagering: number;
  breakdown: {
    depositWagering: number;
    bonusWagering: number;
  };
}> {
  const progress = await getWageringProgress(userId);

  const totalRemainingWagering = progress.bonusRequirements.reduce((sum, req) => {
    return sum + Math.max(0, req.requiredWagering - req.currentWagering);
  }, 0);

  return {
    eligible: totalRemainingWagering === 0,
    totalRemainingWagering,
    breakdown: {
      depositWagering: 0, // Simplified for now
      bonusWagering: totalRemainingWagering,
    },
  };
}
