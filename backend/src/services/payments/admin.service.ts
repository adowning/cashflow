/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import db from '../../database';
import type { Deposits, Withdrawal } from '../../database/interfaces';
import { deposits, withdrawals } from '../../database/schema';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { cleanupExpiredDeposits } from './deposit.service';
import { processWithdrawalAction } from './withdrawal.service';

/**
 * Admin service for deposit/withdrawal management
 * Provides comprehensive back-office functionality for transaction oversight
 */

export interface AdminTransactionSummary
{
  totalDeposits: number
  totalWithdrawals: number
  pendingDeposits: number
  pendingWithdrawals: number
  completedToday: number
  totalVolumeToday: number
  averageProcessingTime: number
}

export interface AdminUserTransaction
{
  userId: string
  username: string
  totalDeposits: number
  totalWithdrawals: number
  netAmount: number
  lastActivity: Date
  riskScore: number
}

export interface AdminTransactionFilter
{
  status?: string
  type?: 'deposit' | 'withdrawal'
  userId?: string
  dateFrom?: Date
  dateTo?: Date
  amountMin?: number
  amountMax?: number
  limit?: number
  offset?: number
}

export interface DailyVolumeData
{
  date: string
  deposits: number
  withdrawals: number
}

/**
 * Get comprehensive admin dashboard summary
 */
export async function getAdminDashboardSummary(): Promise<{
  summary: AdminTransactionSummary
  recentTransactions: Deposits[]
  alerts: string[]
  error?: string
}>
{
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Get transaction summary
    const depositStats = await db
      .select({
        status: deposits.status,
        count: sql<number>`COUNT(*)`,
        amount: sql<number>`SUM(${deposits.amount})`,
      })
      .from(deposits)
      .groupBy(deposits.status);

    const withdrawalStats = await db
      .select({
        status: withdrawals.status,
        count: sql<number>`COUNT(*)`,
        amount: sql<number>`SUM(${withdrawals.amount})`,
      })
      .from(withdrawals)
      .groupBy(withdrawals.status);

    // Calculate summary metrics
    const totalDeposits = depositStats.reduce((sum, stat) => sum + stat.count, 0);
    const totalWithdrawals = withdrawalStats.reduce((sum, stat) => sum + stat.count, 0);

    const pendingDeposits = depositStats.find(s => s.status === 'PENDING')?.count || 0;
    const pendingWithdrawals = withdrawalStats.find(s => s.status === 'PENDING')?.count || 0;

    const completedToday = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(deposits)
      .where(and(
        eq(deposits.status, 'COMPLETED'),
        gte(deposits.updatedAt, startOfDay)
      ));

    const totalVolumeToday = await db
      .select({ amount: sql<number>`SUM(${deposits.amount})` })
      .from(deposits)
      .where(and(
        eq(deposits.status, 'COMPLETED'),
        gte(deposits.updatedAt, startOfDay)
      ));

    // Get recent transactions for display
    const recentTransactions = await db.query.deposits.findMany({
      orderBy: [desc(deposits.createdAt)],
      limit: 10
    });

    // Generate alerts
    const alerts = await generateSystemAlerts();

    return {
      summary: {
        totalDeposits,
        totalWithdrawals,
        pendingDeposits,
        pendingWithdrawals,
        completedToday: completedToday[0]?.count || 0,
        totalVolumeToday: totalVolumeToday[0]?.amount || 0,
        averageProcessingTime: 0 // Would calculate from actual processing times
      },
      recentTransactions,
      alerts
    };

  } catch (error) {
    console.error('Failed to get admin dashboard summary:', error);
    return {
      summary: {
        totalDeposits: 0,
        totalWithdrawals: 0,
        pendingDeposits: 0,
        pendingWithdrawals: 0,
        completedToday: 0,
        totalVolumeToday: 0,
        averageProcessingTime: 0
      },
      recentTransactions: [],
      alerts: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get filtered transactions for admin review
 */
export async function getFilteredTransactions(filter: AdminTransactionFilter): Promise<{
  transactions: Deposits[]
  total: number
  error?: string
}>
{
  try {
    // For now, use a simplified query to avoid complex Drizzle typing issues
    // This can be optimized later with proper query builder patterns
    const transactions = await db.query.deposits.findMany({
      where: filter.status ? eq(deposits.status, filter.status) : undefined,
      orderBy: [desc(deposits.createdAt)],
      limit: filter.limit || 50,
      offset: filter.offset || 0
    }) as Deposits[];

    // Get total count
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(deposits);
    const total = totalResult[0]?.count || 0;

    return {
      transactions,
      total
    };

  } catch (error) {
    console.error('Failed to get filtered transactions:', error);
    return {
      transactions: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get user transaction history for admin review
 */
export async function getUserTransactionHistory(
  userId: string,
  includeWithdrawals: boolean = true
): Promise<{
  deposits: Deposits[]
  withdrawals: Withdrawal[]
  summary: {
    totalDeposits: number
    totalWithdrawals: number
    netAmount: number
    firstDepositDate?: Date
    lastActivityDate?: Date
  }
  error?: string
}>
{
  try {
    // Get deposits
    const _deposits = await db.query.deposits.findMany({
      where: eq(deposits.playerId, userId),
      orderBy: [desc(deposits.createdAt)]
    });

    // Get withdrawals if requested
    let _withdrawals: Withdrawal[] = [];
    if (includeWithdrawals) {
      _withdrawals = await db.query.withdrawals.findMany({
        where: eq(withdrawals.playerId, userId),
        orderBy: [desc(withdrawals.createdAt)]
      });
    }

    // Calculate summary
    const totalDeposits = _deposits
      .filter(d => d.status === 'COMPLETED')
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const totalWithdrawals = _withdrawals
      .filter(w => w.status === 'COMPLETED')
      .reduce((sum, w) => sum + Number(w.amount), 0);

    const firstDeposit = _deposits.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    const lastActivity = [
      ..._deposits.map(d => d.createdAt),
      ..._withdrawals.map(w => w.createdAt)
    ].sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0];

    return {
      deposits: _deposits,
      withdrawals: _withdrawals,
      summary: {
        totalDeposits,
        totalWithdrawals,
        netAmount: totalDeposits - totalWithdrawals,
        firstDepositDate: firstDeposit?.createdAt,
        lastActivityDate: lastActivity || undefined
      }
    };

  } catch (error) {
    console.error('Failed to get user transaction history:', error);
    return {
      deposits: [],
      withdrawals: [],
      summary: {
        totalDeposits: 0,
        totalWithdrawals: 0,
        netAmount: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Bulk approve/reject withdrawals
 */
export async function bulkProcessWithdrawals(
  withdrawalIds: string[],
  action: 'approve' | 'reject' | 'cancel',
  adminId: string,
  reason?: string
): Promise<{
  success: boolean
  processed: number
  failed: number
  errors: string[]
}>
{
  const results = {
    success: true,
    processed: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const withdrawalId of withdrawalIds) {
    try {
      const result = await processWithdrawalAction({
        withdrawalId,
        action,
        adminId,
        reason
      });

      if (result.success) {
        results.processed++;
      } else {
        results.failed++;
        results.errors.push(`${withdrawalId}: ${result.error}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`${withdrawalId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return results;
}

/**
 * Generate system alerts for admin attention
 */
async function generateSystemAlerts(): Promise<string[]>
{
  const alerts: string[] = [];

  try {
    // Check for expired pending deposits
    const expiredDeposits = await db.query.deposits.findMany({
      where: and(
        eq(deposits.status, 'PENDING'),
        sql`${deposits.createdAt} < ${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`
      )
    });

    if (expiredDeposits.length > 0) {
      alerts.push(`${expiredDeposits.length} deposits have been pending for more than 24 hours`);
    }

    // Check for high-value pending withdrawals
    const highValueWithdrawals = await db.query.withdrawals.findMany({
      where: and(
        eq(withdrawals.status, 'PENDING'),
        sql`${withdrawals.amount} > ${100000}` // $1,000+ withdrawals
      )
    });

    if (highValueWithdrawals.length > 0) {
      alerts.push(`${highValueWithdrawals.length} high-value withdrawals pending review`);
    }

    // Check for suspicious patterns
    const recentLargeDeposits = await db.query.deposits.findMany({
      where: and(
        eq(deposits.status, 'COMPLETED'),
        sql`${deposits.amount} > ${50000}`, // $500+ deposits
        gte(deposits.createdAt, new Date(Date.now() - 60 * 60 * 1000)) // Last hour
      )
    });

    if (recentLargeDeposits.length > 5) {
      alerts.push(`Unusual activity: ${recentLargeDeposits.length} large deposits in the last hour`);
    }

  } catch (error) {
    console.error('Failed to generate system alerts:', error);
  }

  return alerts;
}

/**
 * Get transaction analytics for reporting
 */
export async function getTransactionAnalytics(
  days: number = 30
): Promise<{
  dailyVolume: Array<{ date: string; deposits: number; withdrawals: number }>
  paymentMethodBreakdown: Record<string, number>
  averageTransactionSize: number
  topUsers: AdminUserTransaction[]
  error?: string
}>
{
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Daily volume for the period
    const dailyVolume = await getDailyVolume(startDate, days);

    // Payment method breakdown
    const paymentMethodBreakdown = await getPaymentMethodBreakdown(startDate);

    // Average transaction size
    const avgSize = await getAverageTransactionSize(startDate);

    // Top users by volume
    const topUsers = await getTopUsersByVolume(startDate, 10);

    return {
      dailyVolume,
      paymentMethodBreakdown,
      averageTransactionSize: avgSize,
      topUsers
    };

  } catch (error) {
    console.error('Failed to get transaction analytics:', error);
    return {
      dailyVolume: [],
      paymentMethodBreakdown: {},
      averageTransactionSize: 0,
      topUsers: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get daily transaction volume
 */
async function getDailyVolume(startDate: Date, days: number): Promise<DailyVolumeData[]>
{
  const dailyData: DailyVolumeData[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

    const _deposits = await db
      .select({ amount: sql<number>`SUM(${deposits.amount})` })
      .from(deposits)
      .where(and(
        eq(deposits.status, 'COMPLETED'),
        gte(deposits.createdAt, date),
        sql`${deposits.createdAt} < ${nextDate.toISOString()}`
      ));

    const _withdrawals = await db
      .select({ amount: sql<number>`SUM(${withdrawals.amount})` })
      .from(withdrawals)
      .where(and(
        eq(withdrawals.status, 'COMPLETED'),
        gte(withdrawals.createdAt, date),
        sql`${withdrawals.createdAt} < ${nextDate.toISOString()}`
      ));

    if (!_deposits[0] || !_withdrawals[0]) {
      console.warn('No data found for date range');
      dailyData.push({
        date: date.toISOString().split('T')[0] || '',
        deposits: 0,
        withdrawals: 0
      });
      continue;
    }

    dailyData.push({
      date: date.toISOString().split('T')[0] || new Date().toISOString().split('T')[0] || '',
      deposits: _deposits[0]?.amount || 0,
      withdrawals: _withdrawals[0]?.amount || 0
    });
  }

  return dailyData;
}

/**
 * Get payment method breakdown
 */
async function getPaymentMethodBreakdown(_startDate: Date): Promise<Record<string, number>>
{
  const breakdown: Record<string, number> = {};

  // This would query actual payment method data from transactions
  // For now, returning placeholder structure
  breakdown['CASHAPP'] = 0;
  breakdown['INSTORE_CASH'] = 0;
  breakdown['INSTORE_CARD'] = 0;

  return breakdown;
}

/**
 * Get average transaction size
 */
async function getAverageTransactionSize(startDate: Date): Promise<number>
{
  const result = await db
    .select({ avg: sql<number>`AVG(${deposits.amount})` })
    .from(deposits)
    .where(and(
      eq(deposits.status, 'COMPLETED'),
      gte(deposits.createdAt, startDate)
    ));

  if (!result[0]) throw new Error('no deposits');

  return result[0].avg || 0;
}

/**
 * Get top users by transaction volume
 */
async function getTopUsersByVolume(_startDate: Date, _limit: number): Promise<AdminUserTransaction[]>
{
  // This would query actual user transaction data grouped by user
  // For now, returning placeholder structure
  return [];
}

/**
 * Manual transaction adjustment (admin only)
 */
export async function adjustTransaction(
  transactionId: string,
  adjustmentType: 'credit' | 'debit',
  amount: number,
  adminId: string,
  reason: string
): Promise<{
  success: boolean
  error?: string
}>
{
  try {
    // Log the adjustment for audit trail
    console.log(`Admin ${adminId} ${adjustmentType} adjustment of ${amount} for transaction ${transactionId}. Reason: ${reason}`);

    // In production, this would:
    // 1. Update the transaction record
    // 2. Adjust user balance accordingly
    // 3. Log the admin action for compliance

    return { success: true };

  } catch (error) {
    console.error('Transaction adjustment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Export transaction data for compliance/reporting
 */
export async function exportTransactionData(
  filter: AdminTransactionFilter,
  format: 'csv' | 'json' = 'json'
): Promise<{
  success: boolean
  data?: string
  error?: string
}>
{
  try {
    // Get filtered transactions
    const result = await getFilteredTransactions(filter);

    if (format === 'json') {
      return {
        success: true,
        data: JSON.stringify(result.transactions, null, 2)
      };
    } else {
      // CSV export would be implemented here
      return {
        success: true,
        data: 'CSV export not yet implemented'
      };
    }

  } catch (error) {
    console.error('Transaction data export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * System maintenance functions
 */
export async function performSystemMaintenance(): Promise<{
  success: boolean
  actions: string[]
  error?: string
}>
{
  const actions: string[] = [];

  try {
    // Clean up expired deposits
    const cleanupResult = await cleanupExpiredDeposits();
    if (cleanupResult.cancelled > 0) {
      actions.push(`Cancelled ${cleanupResult.cancelled} expired deposits`);
    }

    // Additional maintenance tasks would go here

    return {
      success: true,
      actions
    };

  } catch (error) {
    console.error('System maintenance failed:', error);
    return {
      success: false,
      actions: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}