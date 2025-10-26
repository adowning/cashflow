/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import db, { type Deposit } from '@@/database';
import { deposits } from '../../database/schema';
import { getUserWallets } from '../wallet.service';
import { and, eq, sql } from 'drizzle-orm';
import { notifyBalanceChange } from '../realtime-notifications.service.js';
import { logTransaction } from '../transaction-logging.service.js';
import { addXpToUser } from '../vip.service.js';
import { creditToWallet } from '../wallet.service.js';
import { nanoid } from 'nanoid';

/**
 * Enhanced deposit service implementing PRD requirements
 * Handles deposit initiation, webhook confirmation, and bonus processing
 */

export enum DepositStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentMethod {
  CASHAPP = 'CASHAPP',
  INSTORE_CASH = 'INSTORE_CASH',
  INSTORE_CARD = 'INSTORE_CARD',
}

export interface DepositRequest {
  userId: string;
  amount: number; // Amount in cents
  paymentMethod: PaymentMethod;
  currency?: string;
  note?: string;
  metadata?: Record<string, unknown>;
}

export interface DepositResponse {
  success: boolean;
  depositId?: string;
  status: DepositStatus;
  instructions?: string;
  referenceId?: string;
  error?: string;
}

export interface WebhookConfirmation {
  transactionId: string;
  amount: number;
  senderInfo?: string;
  timestamp: Date;
  providerData?: Record<string, unknown>;
}

export interface DepositCompletionResult {
  success: boolean;
  depositId: string;
  amount: number;
  bonusApplied?: {
    xpGained: number;
    freeSpinsAwarded: number;
  };
  error?: string;
}

/**
 * Initiate a new deposit request
 */
export async function initiateDeposit(request: DepositRequest): Promise<DepositResponse> {
  try {
    // Validate user exists and has active wallet
    const userWallets = await getUserWallets(request.userId);
    const user = userWallets[0];
    if (!user) {
      return {
        success: false,
        status: DepositStatus.FAILED,
        error: 'User wallet not found',
      };
    }

    // Generate unique reference ID for tracking
    const referenceId = `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create deposit record
    const depositId = await db.transaction(async (tx) => {
      const deposit = await tx
        .insert(deposits)
        .values({
          id: nanoid(),
          playerId: request.userId,
          amount: request.amount,
          status: DepositStatus.PENDING,
          currency: request.currency || 'USD',
          note: request.note || referenceId,
        })
        .returning({ id: deposits.id });
      if (!deposit[0]) throw new Error('no deposits');

      return deposit[0].id;
    });

    // Get payment instructions based on method
    const instructions = await getPaymentInstructions(
      request.paymentMethod,
      referenceId,
      request.amount,
    );

    return {
      success: true,
      depositId,
      status: DepositStatus.PENDING,
      instructions,
      referenceId,
    };
  } catch (error) {
    console.error('Deposit initiation failed:', error);
    return {
      success: false,
      status: DepositStatus.FAILED,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process webhook confirmation for completed deposit
 */
export async function processDepositConfirmation(
  confirmation: WebhookConfirmation,
): Promise<DepositCompletionResult> {
  try {
    // Find pending deposit by transaction ID
    const pendingDeposit = await db.query.deposits.findFirst({
      where: and(
        eq(deposits.status, DepositStatus.PENDING),
        sql`metadata->>'referenceId' = ${confirmation.transactionId}`,
      ),
    });

    if (!pendingDeposit) {
      return {
        success: false,
        depositId: '',
        amount: 0,
        error: 'No pending deposit found for this transaction',
      };
    }

    const result = await db.transaction(async (tx) => {
      // Update deposit status to completed
      await tx
        .update(deposits)
        .set({
          status: DepositStatus.COMPLETED,
          updatedAt: new Date(),
        })
        .where(eq(deposits.id, pendingDeposit.id));

      if (pendingDeposit.playerId == null) throw new Error('this shouldnt jhappen');
      // Credit user wallet
      const userWallets = await getUserWallets(pendingDeposit.playerId);
      const user = userWallets[0];
      if (!user) {
        throw new Error('User wallet not found');
      }

      const walletBalance = user;
      if (!walletBalance) {
        throw new Error('Wallet balance not found');
      }

      const creditResult = await creditToWallet(
        walletBalance.walletId,
        confirmation.amount,
        'real',
      );

      if (!creditResult.success) {
        throw new Error(`Failed to credit wallet: ${creditResult.error}`);
      }

      // Log transaction
      console.log('DEBUG: pendingDeposit details:', {
        id: pendingDeposit.id,
        userId: pendingDeposit.playerId,
        userIdType: typeof pendingDeposit.playerId,
        isUserIdNull: pendingDeposit.playerId === null,
        isUserIdUndefined: pendingDeposit.playerId === undefined,
        amount: pendingDeposit.amount,
        status: pendingDeposit.status,
      });

      if (!pendingDeposit.playerId) {
        console.error('CRITICAL: pendingDeposit.playerId is null or undefined!', {
          depositId: pendingDeposit.id,
          transactionId: confirmation.transactionId,
          amount: confirmation.amount,
        });
        throw new Error('Cannot log transaction: userId is null');
      }

      await logTransaction({
        userId: pendingDeposit.playerId,
        gameId: 'DEPOSIT',
        operatorId: 'system',
        wagerAmount: 0,
        winAmount: confirmation.amount,
        betType: 'real',
        preRealBalance: Number(walletBalance.realBalance),
        postRealBalance: creditResult.newBalance,
        preBonusBalance: Number(walletBalance.bonusBalance),
        postBonusBalance: Number(walletBalance.bonusBalance),
        ggrContribution: 0,
        jackpotContribution: 0,
        vipPointsAdded: 0,
        currency: pendingDeposit.currency || 'USD',
      });

      // Apply deposit bonuses
      const bonusResult = await applyDepositBonuses(pendingDeposit.playerId, confirmation.amount);

      return {
        success: true,
        depositId: pendingDeposit.id,
        amount: confirmation.amount,
        bonusApplied: bonusResult,
      };
    });
    if (!pendingDeposit.playerId) {
      throw new Error('Failed to credit wallet: ');
    }

    // Send real-time balance notification
    await notifyBalanceChange(pendingDeposit.playerId, {
      realBalance: result.amount,
      bonusBalance: 0,
      totalBalance: result.amount,
      changeAmount: result.amount,
      changeType: 'bonus',
    });

    return result;
  } catch (error) {
    console.error('Deposit confirmation processing failed:', error);
    return {
      success: false,
      depositId: '',
      amount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get payment instructions for different payment methods
 */
async function getPaymentInstructions(
  method: PaymentMethod,
  referenceId: string,
  amount: number,
): Promise<string> {
  const amountInDollars = (amount / 100).toFixed(2);

  switch (method) {
    case PaymentMethod.CASHAPP:
      return `Send $${amountInDollars} via CashApp to $CASHAPP_TAG. Include reference: ${referenceId}`;

    case PaymentMethod.INSTORE_CASH:
      return `Visit any participating store location and provide reference: ${referenceId}. Pay $${amountInDollars} in cash.`;

    case PaymentMethod.INSTORE_CARD:
      return `Visit any participating store location and provide reference: ${referenceId}. Pay $${amountInDollars} by card.`;

    default:
      return `Complete payment of $${amountInDollars} using reference: ${referenceId}`;
  }
}

/**
 * Apply deposit bonuses (XP and free spins)
 */
async function applyDepositBonuses(
  userId: string,
  amount: number,
): Promise<{ xpGained: number; freeSpinsAwarded: number }> {
  let xpGained = 0;
  let freeSpinsAwarded = 0;

  try {
    // Calculate XP bonus (1 XP per $1 deposited)
    const xpAmount = Math.floor(amount / 100);
    if (xpAmount > 0) {
      const vipResult = await addXpToUser(userId, xpAmount);
      if (vipResult.success) {
        xpGained = xpAmount;
      }
    }

    // Award free spins based on deposit amount
    if (amount >= 10000) {
      // $100+ deposit
      freeSpinsAwarded = 10;
      // TODO: Implement free spins awarding logic
      console.log(`Awarding ${freeSpinsAwarded} free spins to user ${userId}`);
    }

    // First-time deposit bonus
    const isFirstDeposit = await checkFirstTimeDeposit(userId);
    if (isFirstDeposit) {
      freeSpinsAwarded += 20; // Extra 20 free spins for first deposit
      console.log(`First-time deposit bonus: Additional ${freeSpinsAwarded} free spins`);
    }

    return { xpGained, freeSpinsAwarded };
  } catch (error) {
    console.error('Failed to apply deposit bonuses:', error);
    return { xpGained: 0, freeSpinsAwarded: 0 };
  }
}

/**
 * Check if this is user's first deposit
 */
async function checkFirstTimeDeposit(userId: string): Promise<boolean> {
  const existingDeposits = await db.query.deposits.findMany({
    where: and(eq(deposits.playerId, userId), eq(deposits.status, DepositStatus.COMPLETED)),
  });

  return existingDeposits.length === 0;
}

/**
 * Get deposit status and details
 */
export async function getDepositStatus(depositId: string): Promise<{
  deposit?: Deposit;
  status: DepositStatus;
  error?: string;
} | null> {
  try {
    const deposit = (await db.query.deposits.findFirst({
      where: eq(deposits.id, depositId),
    })) as Deposit | undefined;

    if (!deposit) {
      return {
        status: DepositStatus.FAILED,
        error: 'Deposit not found',
      };
    }

    return {
      deposit,
      status: deposit.status as DepositStatus,
    };
  } catch (error) {
    console.error('Failed to get deposit status:', error);
    return {
      status: DepositStatus.FAILED,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user's deposit history
 */
export async function getUserDepositHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<{
  deposits: Deposit[];
  total: number;
  error?: string;
}> {
  try {
    const depositsList = await db.query.deposits.findMany({
      where: eq(deposits.playerId, userId),
      orderBy: [sql`${deposits.createdAt} DESC`],
      limit,
      offset,
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(deposits)
      .where(eq(deposits.playerId, userId));

    if (!total[0]) throw new Error('no total');

    return {
      deposits: depositsList,
      total: total[0].count,
    };
  } catch (error) {
    console.error('Failed to get deposit history:', error);
    return {
      deposits: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel expired pending deposits
 */
export async function cleanupExpiredDeposits(): Promise<{
  cancelled: number;
  error?: string;
}> {
  try {
    const expiryHours = 24; // Deposits expire after 24 hours
    const expiryDate = new Date(Date.now() - expiryHours * 60 * 60 * 1000);

    const result: Deposit[] = await db
      .update(deposits)
      .set({
        status: DepositStatus.EXPIRED,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(deposits.status, DepositStatus.PENDING),
          sql`${deposits.createdAt} < ${expiryDate.toISOString()}`,
        ),
      );

    if (!result) throw new Error('no result');

    return { cancelled: result.length || 0 };
  } catch (error) {
    console.error('Failed to cleanup expired deposits:', error);
    return {
      cancelled: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
