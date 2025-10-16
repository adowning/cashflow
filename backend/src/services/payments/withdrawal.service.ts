/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import  db from '@backend/database'
import { withdrawals, wallets } from '../../database/schema'
import { getUserWallets } from '../wallet.service'
import { eq,  SQL, sql } from 'drizzle-orm'
import { notifyError } from '../realtime-notifications.service.js'
import { canUserWithdraw } from '../wagering.service.js'
import { debitFromWallet } from '../wallet.service.js'

/**
 * Enhanced withdrawal service implementing PRD requirements
 * Handles withdrawal requests, admin approval workflow, and balance validation
 */

export enum WithdrawalStatus
{
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

export const PayoutMethodValues = {
  BANK_TRANSFER: 'BANK_TRANSFER',
  CASHAPP: 'CASHAPP',
  CRYPTO: 'CRYPTO',
  CHECK: 'CHECK'
} as const

export type PayoutMethod = typeof PayoutMethodValues[keyof typeof PayoutMethodValues]

export interface WithdrawalRequest
{
  userId: string
  amount: number // Amount in cents
  payoutMethod: PayoutMethod
  payoutDetails: {
    accountNumber?: string
    routingNumber?: string
    cashappTag?: string
    cryptoAddress?: string
    walletType?: string
  }
  currency?: string
  note?: string
}

export interface WithdrawalResponse
{
  success: boolean
  withdrawalId?: string
  status: WithdrawalStatus
  error?: string
  validationErrors?: string[]
}

export interface WithdrawalApprovalRequest
{
  withdrawalId: string
  adminId: string
  approved: boolean
  reason?: string
  adminNote?: string
}

export interface AdminWithdrawalAction
{
  withdrawalId: string
  action: 'approve' | 'reject' | 'cancel'
  adminId: string
  reason?: string
  adminNote?: string
}

/**
 * Request a new withdrawal
 */
export async function requestWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResponse>
{
  try {
    // Validate user exists and has active wallet
    const userWallets = await getUserWallets(request.userId)
    if (!userWallets || userWallets.length === 0) {
      return {
        success: false,
        status: WithdrawalStatus.FAILED,
        error: 'User wallet not found'
      }
    }

    const user = userWallets[0]

    const walletBalance = user
    if (!walletBalance || !walletBalance.walletId) {
      return {
        success: false,
        status: WithdrawalStatus.FAILED,
        error: 'Wallet balance not found'
      }
    }

    // Check if user can withdraw (wagering requirements met)
    const withdrawalEligibility = await canUserWithdraw(request.userId)

    if (!withdrawalEligibility.canWithdraw) {
      const errorMessage = 'Withdrawal not allowed. Please complete bonus wagering requirements first.'

      // Send error notification to user
      await notifyError(request.userId, errorMessage)

      return {
        success: false,
        status: WithdrawalStatus.REJECTED,
        error: errorMessage,
        validationErrors: withdrawalEligibility.blockingRequirements.map((req: { id: any; requiredWagering: number; currentWagering: number }) =>
          `Bonus ${req.id}: ${req.requiredWagering - req.currentWagering} more wagering needed`
        )
      }
    }

    // Validate withdrawal amount
    const currentBalance = Number(walletBalance.realBalance) + Number(walletBalance.bonusBalance)
    if (request.amount > currentBalance) {
      return {
        success: false,
        status: WithdrawalStatus.FAILED,
        error: 'Insufficient balance for withdrawal'
      }
    }

    // Validate payout details based on method
    const validationErrors = await validatePayoutDetails(request.payoutMethod, request.payoutDetails)
    if (validationErrors.length > 0) {
      return {
        success: false,
        status: WithdrawalStatus.FAILED,
        error: 'Invalid payout details',
        validationErrors
      }
    }

    // Create withdrawal record
    const withdrawalId = await db.transaction(async (tx) =>
    {
      const withdrawal = await tx.insert(withdrawals).values({
        playerId: request.userId,
        amount: request.amount,
        status: WithdrawalStatus.PENDING,
        currency: request.currency || 'USD',
        note: request.note,
        metadata: Buffer.from(JSON.stringify({
          payoutMethod: request.payoutMethod,
          payoutDetails: request.payoutDetails,
          requestedAt: new Date().toISOString()
        }))
      }).returning({ id: withdrawals.id })

      // Debit from wallet (hold funds)
      const debitResult = await debitFromWallet(
        walletBalance.walletId,
        request.amount,
        'real' // Debit from real balance first
      )

      if (!debitResult.success) {
        throw new Error(`Failed to debit wallet: ${debitResult.error}`)
      }
      if (!withdrawal[0]) throw new Error('no withdrawal')
      return withdrawal[0].id
    })

    return {
      success: true,
      withdrawalId,
      status: WithdrawalStatus.PENDING
    }

  } catch (error) {
    console.error('Withdrawal request failed:', error)
    return {
      success: false,
      status: WithdrawalStatus.FAILED,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Admin approval/rejection of withdrawal
 */
export async function processWithdrawalAction(action: AdminWithdrawalAction): Promise<{
  success: boolean
  withdrawalId: string
  newStatus: WithdrawalStatus
  error?: string
}>
{
  try {
    const result = await db.transaction(async (tx) =>
    {
      // Get withdrawal details
      const withdrawal = await tx.query.withdrawals.findFirst({
        where: eq(withdrawals.id, action.withdrawalId)
      })

      if (!withdrawal) {
        throw new Error('Withdrawal not found')
      }

      let newStatus: WithdrawalStatus
      let shouldRefund = false

      switch (action.action) {
        case 'approve':
          newStatus = WithdrawalStatus.PROCESSING
          break
        case 'reject':
          newStatus = WithdrawalStatus.REJECTED
          shouldRefund = true
          break
        case 'cancel':
          newStatus = WithdrawalStatus.CANCELLED
          shouldRefund = true
          break
        default:
          throw new Error('Invalid action')
      }

      // Update withdrawal status
      const existingMetadata = withdrawal.metadata ? JSON.parse(withdrawal.metadata.toString()) : {}
      await tx.update(withdrawals)
        .set({
          status: newStatus,
          updatedAt: new Date(),
          metadata: Buffer.from(JSON.stringify({
            ...existingMetadata,
            adminAction: {
              adminId: action.adminId,
              action: action.action,
              reason: action.reason,
              adminNote: action.adminNote,
              processedAt: new Date().toISOString()
            }
          }))
        })
        .where(eq(withdrawals.id, action.withdrawalId))

      // Refund to wallet if rejected/cancelled
      if (shouldRefund) {
        const userWallets = await getUserWallets(withdrawal.playerId!)
        if (userWallets && userWallets.length > 0) {
          const user = userWallets[0]
          if (user && user.walletId) {
            await tx.update(wallets)
              .set({
                balance: sql`${wallets.balance} + ${withdrawal.amount}`,
                updatedAt: new Date()
              })
              .where(eq(wallets.id, user.walletId))
          }
        }
      }

      return {
        success: true,
        withdrawalId: action.withdrawalId,
        newStatus
      }
    })

    return result

  } catch (error) {
    console.error('Withdrawal action processing failed:', error)
    return {
      success: false,
      withdrawalId: action.withdrawalId,
      newStatus: WithdrawalStatus.FAILED,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Complete withdrawal after external processing
 */
export async function completeWithdrawal(
  withdrawalId: string,
  externalTransactionId?: string
): Promise<{
  success: boolean
  error?: string
}>
{
  try {
    await db.transaction(async (tx) => {
      const withdrawal = await tx.query.withdrawals.findFirst({
        where: eq(withdrawals.id, withdrawalId)
      })

      if (!withdrawal) {
        throw new Error('Withdrawal not found')
      }

      const existingMetadata = withdrawal.metadata ? JSON.parse(withdrawal.metadata.toString()) : {}
      await tx.update(withdrawals)
        .set({
          status: WithdrawalStatus.COMPLETED,
          updatedAt: new Date(),
          metadata: Buffer.from(JSON.stringify({
            ...existingMetadata,
            completedAt: new Date().toISOString(),
            externalTransactionId
          }))
        })
        .where(eq(withdrawals.id, withdrawalId))
    })

    return { success: true }

  } catch (error) {
    console.error('Withdrawal completion failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Validate payout details based on method
 */
async function validatePayoutDetails(
  method: PayoutMethod,
  details: WithdrawalRequest['payoutDetails']
): Promise<string[]>
{
  const errors: string[] = []

  switch (method) {
    case PayoutMethodValues.BANK_TRANSFER:
      if (!details.accountNumber || details.accountNumber.length < 8) {
        errors.push('Valid account number is required')
      }
      if (!details.routingNumber || details.routingNumber.length !== 9) {
        errors.push('Valid routing number is required')
      }
      break

    case PayoutMethodValues.CASHAPP:
      if (!details.cashappTag || !details.cashappTag.startsWith('$')) {
        errors.push('Valid CashApp tag is required (must start with $)')
      }
      break

    case PayoutMethodValues.CRYPTO:
      if (!details.cryptoAddress || details.cryptoAddress.length < 20) {
        errors.push('Valid crypto address is required')
      }
      if (!details.walletType) {
        errors.push('Wallet type is required for crypto withdrawals')
      }
      break

    case PayoutMethodValues.CHECK:
      // Check method might not need additional validation
      break
  }

  return errors
}

/**
 * Get withdrawal status and details
 */
export async function getWithdrawalStatus(withdrawalId: string): Promise<{
  withdrawal?: any
  status: WithdrawalStatus
  error?: string
} | null>
{
  try {
    const withdrawal = await db.query.withdrawals.findFirst({
      where: eq(withdrawals.id, withdrawalId)
    })

    if (!withdrawal) {
      return {
        status: WithdrawalStatus.FAILED,
        error: 'Withdrawal not found'
      }
    }

    return {
      withdrawal,
      status: withdrawal.status as WithdrawalStatus
    }
  } catch (error) {
    console.error('Failed to get withdrawal status:', error)
    return {
      status: WithdrawalStatus.FAILED,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get user's withdrawal history
 */
export async function getUserWithdrawalHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{
  withdrawals: any[]
  total: number
  error?: string
}>
{
  try {
    const withdrawalsList = await db.query.withdrawals.findMany({
      where: eq(withdrawals.playerId, userId),
      orderBy: [sql`${withdrawals.createdAt} DESC`],
      limit,
      offset
    })

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(withdrawals)
      .where(eq(withdrawals.playerId, userId))

    if (!total[0]) throw new Error('no total')
    return {
      withdrawals: withdrawalsList,
      total: total[0].count
    }
  } catch (error) {
    console.error('Failed to get withdrawal history:', error)
    return {
      withdrawals: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get pending withdrawals for admin review
 */
export async function getPendingWithdrawals(
  limit: number = 100,
  offset: number = 0
): Promise<{
  withdrawals: any[]
  total: number
  error?: string
}>
{
  try {
    const pendingWithdrawals = await db.query.withdrawals.findMany({
      where: eq(withdrawals.status, WithdrawalStatus.PENDING),
      orderBy: [sql`${withdrawals.createdAt} ASC`], // Oldest first for FIFO processing
      limit,
      offset
    })

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(withdrawals)
      .where(eq(withdrawals.status, WithdrawalStatus.PENDING))

    if (!total[0]) throw new Error('no total')


    return {
      withdrawals: pendingWithdrawals,
      total: total[0].count
    }
  } catch (error) {
    console.error('Failed to get pending withdrawals:', error)
    return {
      withdrawals: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get withdrawal statistics for admin dashboard
 */
export async function getWithdrawalStatistics(
  days: number = 30
): Promise<{
  totalWithdrawals: number
  totalAmount: number
  pendingWithdrawals: number
  pendingAmount: number
  completedWithdrawals: number
  completedAmount: number
  averageProcessingTime: number
  error?: string
}>
{
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const stats = await db
      .select({
        status: withdrawals.status,
        amount: sql<number>`SUM(${withdrawals.amount})`,
        count: sql<number>`COUNT(*)`,
        avgProcessingTime: sql<number>`AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))`
      })
      .from(withdrawals)
      .where(sql`${withdrawals.createdAt} >= ${startDate.toISOString()}`)
      .groupBy(withdrawals.status)

    const totalWithdrawals = stats.reduce((sum: any, stat: { count: any }) => sum + stat.count, 0)
    const totalAmount = stats.reduce((sum: any, stat: { amount: any }) => sum + (stat.amount || 0), 0)

    const pendingStats = stats.find((s) => s.status === WithdrawalStatus.PENDING)
    const completedStats = stats.find((s) => s.status === WithdrawalStatus.COMPLETED)

    return {
      totalWithdrawals,
      totalAmount,
      pendingWithdrawals: pendingStats?.count || 0,
      pendingAmount: pendingStats?.amount || 0,
      completedWithdrawals: completedStats?.count || 0,
      completedAmount: completedStats?.amount || 0,
      averageProcessingTime: completedStats?.avgProcessingTime || 0
    }

  } catch (error) {
    console.error('Failed to get withdrawal statistics:', error)
    return {
      totalWithdrawals: 0,
      totalAmount: 0,
      pendingWithdrawals: 0,
      pendingAmount: 0,
      completedWithdrawals: 0,
      completedAmount: 0,
      averageProcessingTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}