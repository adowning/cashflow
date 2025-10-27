/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import db from '@@/database';
import { withdrawals } from '@@/database/schema';
import { eq, SQL, sql } from 'drizzle-orm';
import { notifyError } from '@/shared/notifications.service';
import { wageringManager } from '@/wagering.manager'; // Import the unified manager
import { TWithdrawals } from '@@/database/schema/other.schema';

/**
 * Enhanced withdrawal service implementing PRD requirements
 * Handles withdrawal requests, admin approval workflow, and balance validation
 * USES THE UNIFIED WAGERING MANAGER
 */

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export const PayoutMethodValues = {
  BANK_TRANSFER: 'BANK_TRANSFER',
  CASHAPP: 'CASHAPP',
  CRYPTO: 'CRYPTO',
  CHECK: 'CHECK',
} as const;

export type PayoutMethod = (typeof PayoutMethodValues)[keyof typeof PayoutMethodValues];

export interface WithdrawalRequest {
  userId: string;
  amount: number; // Amount in cents
  payoutMethod: PayoutMethod;
  payoutDetails: {
    accountNumber?: string;
    routingNumber?: string;
    cashappTag?: string;
    cryptoAddress?: string;
    walletType?: string;
  };
  currency?: string;
  note?: string;
}

export interface WithdrawalResponse {
  success: boolean;
  withdrawalId?: string;
  status: WithdrawalStatus;
  error?: string;
  validationErrors?: string[];
}

export interface WithdrawalApprovalRequest {
  withdrawalId: string;
  adminId: string;
  approved: boolean;
  reason?: string;
  adminNote?: string;
}

export interface AdminWithdrawalAction {
  withdrawalId: string;
  action: 'approve' | 'reject' | 'cancel';
  adminId: string;
  reason?: string;
  adminNote?: string;
}

/**
 * Request a new withdrawal
 */
export async function requestWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResponse> {
  try {
    // Validate user and get balance from Wagering Manager
    const balance = await wageringManager.getPlayerBalances(request.userId);
    if (!balance) {
      return {
        success: false,
        status: WithdrawalStatus.FAILED,
        error: 'User balance not found',
      };
    }

    // Check if user can withdraw (wagering requirements met)
    const withdrawalEligibility = await wageringManager.canUserWithdraw(request.userId);

    if (!withdrawalEligibility.canWithdraw) {
      const errorMessage =
        withdrawalEligibility.reason || 'Withdrawal not allowed. Please complete wagering requirements.';

      // Send error notification to user
      await notifyError(request.userId, errorMessage);

      return {
        success: false,
        status: WithdrawalStatus.REJECTED,
        error: errorMessage,
        validationErrors: withdrawalEligibility.blockingRequirements.map(
          (req: any) =>
            `Requirement ${req.id}: ${req.remaining / 100} more wagering needed`,
        ),
      };
    }

    // Validate withdrawal amount against REAL balance
    if (request.amount > balance.realBalance) {
      return {
        success: false,
        status: WithdrawalStatus.FAILED,
        error: `Insufficient real balance. Available: ${balance.realBalance / 100}`,
      };
    }
    
    // Minimum withdrawal amount
    if (request.amount < 1000) { // e.g., $10 minimum
         return {
            success: false,
            status: WithdrawalStatus.FAILED,
            error: 'Minimum withdrawal amount is $10.00',
         };
    }


    // Validate payout details based on method
    const validationErrors = await validatePayoutDetails(
      request.payoutMethod,
      request.payoutDetails,
    );
    if (validationErrors.length > 0) {
      return {
        success: false,
        status: WithdrawalStatus.FAILED,
        error: 'Invalid payout details',
        validationErrors,
      };
    }

    // Create withdrawal record AND debit from balance using Wagering Manager
    const withdrawalId = await db.transaction(async (tx) => {
        
      // 1. Debit from balance using Wagering Manager
      // This will throw an error if it fails, rolling back the transaction.
      // It also handles bonus forfeiture.
      await wageringManager.handleWithdraw({
          playerId: request.userId,
          amount: request.amount
      });
      
      // 2. Get the transaction log for this withdrawal
      const withdrawalTx = await tx.query.transactions.findFirst({
          where: (transactions, { eq, and }) => and(
              eq(transactions.playerId, request.userId),
              eq(transactions.type, 'WITHDRAWAL')
          ),
          orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
          limit: 1
      });

      // 3. Create the withdrawal record
      const withdrawal = await tx
        .insert(withdrawals)
        .values({
          playerId: request.userId,
          amount: request.amount,
          status: WithdrawalStatus.PENDING, // Pending admin approval
          currency: request.currency || 'USD',
          note: request.note,
          payoutMethod: request.payoutMethod,
          transactionId: withdrawalTx?.id, // Link to the transaction
          metadata: {
              payoutDetails: request.payoutDetails,
              requestedAt: new Date().toISOString(),
          },
        })
        .returning({ id: withdrawals.id });

      if (!withdrawal[0]) throw new Error('Failed to create withdrawal record');
      return withdrawal[0].id;
    });

    return {
      success: true,
      withdrawalId,
      status: WithdrawalStatus.PENDING,
    };
  } catch (error) {
    console.error('Withdrawal request failed:', error);
    return {
      success: false,
      status: WithdrawalStatus.FAILED,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Admin approval/rejection of withdrawal
 */
export async function processWithdrawalAction(action: AdminWithdrawalAction): Promise<{
  success: boolean;
  withdrawalId: string;
  newStatus: WithdrawalStatus;
  error?: string;
}> {
  try {
    const result = await db.transaction(async (tx) => {
      // Get withdrawal details
      const withdrawal = await tx.query.withdrawals.findFirst({
        where: eq(withdrawals.id, action.withdrawalId),
      });

      if (!withdrawal) {
        throw new Error('Withdrawal not found');
      }
      
      if (withdrawal.status !== WithdrawalStatus.PENDING) {
          throw new Error(`Withdrawal is not PENDING, status is ${withdrawal.status}`);
      }

      let newStatus: WithdrawalStatus;
      let shouldRefund = false;

      switch (action.action) {
        case 'approve':
          newStatus = WithdrawalStatus.PROCESSING; // Approved, now pending external payout
          break;
        case 'reject':
          newStatus = WithdrawalStatus.REJECTED;
          shouldRefund = true;
          break;
        case 'cancel': // e.g., Player cancelled
          newStatus = WithdrawalStatus.CANCELLED;
          shouldRefund = true;
          break;
        default:
          throw new Error('Invalid action');
      }

      // Update withdrawal status
      const existingMetadata = withdrawal.metadata ? (withdrawal.metadata as any) : {};
      await tx
        .update(withdrawals)
        .set({
          status: newStatus,
          updatedAt: new Date(),
          metadata: {
              ...existingMetadata,
              adminAction: {
                adminId: action.adminId,
                action: action.action,
                reason: action.reason,
                adminNote: action.adminNote,
                processedAt: new Date().toISOString(),
              },
          },
        })
        .where(eq(withdrawals.id, action.withdrawalId));

      // Refund to wallet if rejected/cancelled
      if (shouldRefund && withdrawal.playerId) {
          await wageringManager.handleRefund({
              playerId: withdrawal.playerId,
              amount: withdrawal.amount,
              reason: `Withdrawal ${action.action}: ${action.reason || 'N/A'}`
          });
      }

      return {
        success: true,
        withdrawalId: action.withdrawalId,
        newStatus,
      };
    });

    return result;
  } catch (error) {
    console.error('Withdrawal action processing failed:', error);
    return {
      success: false,
      withdrawalId: action.withdrawalId,
      newStatus: WithdrawalStatus.FAILED, // Keep original status on failure?
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Complete withdrawal after external processing
 */
export async function completeWithdrawal(
  withdrawalId: string,
  externalTransactionId?: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await db.transaction(async (tx) => {
      const withdrawal = await tx.query.withdrawals.findFirst({
        where: eq(withdrawals.id, withdrawalId),
      });

      if (!withdrawal) {
        throw new Error('Withdrawal not found');
      }
      
      if (withdrawal.status !== WithdrawalStatus.PROCESSING) {
          throw new Error(`Withdrawal is not PROCESSING, status is ${withdrawal.status}`);
      }


      const existingMetadata = withdrawal.metadata ? (withdrawal.metadata as any) : {};
      await tx
        .update(withdrawals)
        .set({
          status: WithdrawalStatus.COMPLETED,
          updatedAt: new Date(),
          metadata: {
              ...existingMetadata,
              completedAt: new Date().toISOString(),
              externalTransactionId,
          },
        })
        .where(eq(withdrawals.id, withdrawalId));
    });

    return { success: true };
  } catch (error) {
    console.error('Withdrawal completion failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate payout details based on method
 */
async function validatePayoutDetails(
  method: PayoutMethod,
  details: WithdrawalRequest['payoutDetails'],
): Promise<string[]> {
  const errors: string[] = [];

  switch (method) {
    case PayoutMethodValues.BANK_TRANSFER:
      if (!details.accountNumber || details.accountNumber.length < 8) {
        errors.push('Valid account number is required');
      }
      if (!details.routingNumber || details.routingNumber.length !== 9) {
        errors.push('Valid routing number is required');
      }
      break;

    case PayoutMethodValues.CASHAPP:
      if (!details.cashappTag || !details.cashappTag.startsWith('$') || details.cashappTag.length < 3) {
        errors.push('Valid CashApp tag is required (must start with $)');
      }
      break;

    case PayoutMethodValues.CRYPTO:
      if (!details.cryptoAddress || details.cryptoAddress.length < 20) {
        errors.push('Valid crypto address is required');
      }
      if (!details.walletType) {
        errors.push('Wallet type (e.g., BTC, ETH) is required for crypto withdrawals');
      }
      break;

    case PayoutMethodValues.CHECK:
      // Check method might not need additional validation, or maybe address validation
      break;
  }

  return errors;
}

/**
 * Get withdrawal status and details
 */
export async function getWithdrawalStatus(withdrawalId: string): Promise<{
  withdrawal?: TWithdrawals;
  status: WithdrawalStatus;
  error?: string;
} | null> {
  try {
    const withdrawal = await db.query.withdrawals.findFirst({
      where: eq(withdrawals.id, withdrawalId),
    });

    if (!withdrawal) {
      return {
        status: WithdrawalStatus.FAILED,
        error: 'Withdrawal not found',
      };
    }

    return {
      withdrawal,
      status: withdrawal.status as WithdrawalStatus,
    };
  } catch (error) {
    console.error('Failed to get withdrawal status:', error);
    return {
      status: WithdrawalStatus.FAILED,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user's withdrawal history
 */
export async function getUserWithdrawalHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<{
  withdrawals: TWithdrawals[];
  total: number;
  error?: string;
}> {
  try {
    const withdrawalsList = await db.query.withdrawals.findMany({
      where: eq(withdrawals.playerId, userId),
      orderBy: (withdrawals, { desc }) => [desc(withdrawals.createdAt)],
      limit,
      offset,
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(withdrawals)
      .where(eq(withdrawals.playerId, userId));

    if (!total[0]) throw new Error('no total');
    return {
      withdrawals: withdrawalsList,
      total: total[0].count,
    };
  } catch (error) {
    console.error('Failed to get withdrawal history:', error);
    return {
      withdrawals: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get pending withdrawals for admin review
 */
export async function getPendingWithdrawals(
  limit: number = 100,
  offset: number = 0,
): Promise<{
  withdrawals: TWithdrawals[];
  total: number;
  error?: string;
}> {
  try {
    const pendingWithdrawals = await db.query.withdrawals.findMany({
      where: eq(withdrawals.status, WithdrawalStatus.PENDING),
      orderBy: (withdrawals, { asc }) => [asc(withdrawals.createdAt)], // Oldest first for FIFO processing
      limit,
      offset,
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(withdrawals)
      .where(eq(withdrawals.status, WithdrawalStatus.PENDING));

    if (!total[0]) throw new Error('no total');

    return {
      withdrawals: pendingWithdrawals,
      total: total[0].count,
    };
  } catch (error) {
    console.error('Failed to get pending withdrawals:', error);
    return {
      withdrawals: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get withdrawal statistics for admin dashboard
 */
export async function getWithdrawalStatistics(days: number = 30): Promise<{
  totalWithdrawals: number;
  totalAmount: number;
  pendingWithdrawals: number;
  pendingAmount: number;
  completedWithdrawals: number;
  completedAmount: number;
  averageProcessingTime: number; // In seconds
  error?: string;
}> {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stats: {
        status: string,
        amount: number,
        count: number,
        avgProcessingTime: number | null
    }[] = await db
      .select({
        status: withdrawals.status,
        amount: sql<number>`SUM(${withdrawals.amount})`.mapWith(Number),
        count: sql<number>`COUNT(*)`.mapWith(Number),
        // Calculate processing time only for completed
        avgProcessingTime: sql<number>`AVG(CASE WHEN ${withdrawals.status} = ${WithdrawalStatus.COMPLETED} THEN EXTRACT(EPOCH FROM (updated_at - created_at)) ELSE NULL END)`.mapWith(Number),
      })
      .from(withdrawals)
      .where(sql`${withdrawals.createdAt} >= ${startDate.toISOString()}`)
      .groupBy(withdrawals.status);

    let totalWithdrawals = 0;
    let totalAmount = 0;
    let pendingWithdrawals = 0;
    let pendingAmount = 0;
    let completedWithdrawals = 0;
    let completedAmount = 0;
    let avgProcessingTime = 0;
    
    for (const stat of stats) {
        totalWithdrawals += stat.count;
        totalAmount += stat.amount;
        if (stat.status === WithdrawalStatus.PENDING) {
            pendingWithdrawals = stat.count;
            pendingAmount = stat.amount;
        } else if (stat.status === WithdrawalStatus.COMPLETED) {
            completedWithdrawals = stat.count;
            completedAmount = stat.amount;
            avgProcessingTime = stat.avgProcessingTime || 0;
        }
    }

    return {
      totalWithdrawals,
      totalAmount,
      pendingWithdrawals,
      pendingAmount,
      completedWithdrawals,
      completedAmount,
      averageProcessingTime: avgProcessingTime,
    };
  } catch (error) {
    console.error('Failed to get withdrawal statistics:', error);
    return {
      totalWithdrawals: 0,
      totalAmount: 0,
      pendingWithdrawals: 0,
      pendingAmount: 0,
      completedWithdrawals: 0,
      completedAmount: 0,
      averageProcessingTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
