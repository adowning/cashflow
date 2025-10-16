/** biome-ignore-all lint/style/noNonNullAssertion: <> */
import { pub } from '@backend/orpc'
import * as v from 'valibot'

import { getPendingWithdrawals, processWithdrawalAction, WithdrawalStatus } from '../../services/payments/withdrawal.service.js'

// Schemas for admin operations
const adminTransactionFilterSchema = v.object({
  status: v.optional(v.string()),
  type: v.optional(v.union([v.literal('deposit'), v.literal('withdrawal')])),
  userId: v.optional(v.string()),
  dateFrom: v.optional(v.pipe(v.string(), v.transform((s) => new Date(s)))),
  dateTo: v.optional(v.pipe(v.string(), v.transform((s) => new Date(s)))),
  amountMin: v.optional(v.pipe(v.string(), v.transform(Number))),
  amountMax: v.optional(v.pipe(v.string(), v.transform(Number))),
  limit: v.optional(v.pipe(v.string(), v.transform(Number))),
  offset: v.optional(v.pipe(v.string(), v.transform(Number))),
})

const userTransactionsParamsSchema = v.object({
  userId: v.string(),
})

const bulkProcessWithdrawalsSchema = v.object({
  withdrawalIds: v.array(v.string()),
  action: v.union([v.literal('approve'), v.literal('reject'), v.literal('cancel')]),
  reason: v.optional(v.string()),
})

const withdrawalProcessParamsSchema = v.object({
  withdrawalId: v.string(),
})

const processWithdrawalActionSchema = v.object({
  action: v.union([v.literal('approve'), v.literal('reject'), v.literal('cancel')]),
  reason: v.optional(v.string()),
  adminNote: v.optional(v.string()),
})

// Response schemas
const adminDashboardResponseSchema = v.object({
  summary: v.object({
    totalDeposits: v.number(),
    totalWithdrawals: v.number(),
    pendingDeposits: v.number(),
    pendingWithdrawals: v.number(),
    completedToday: v.number(),
    totalVolumeToday: v.number(),
    averageProcessingTime: v.number(),
  }),
  recentTransactions: v.array(v.any()),
  alerts: v.array(v.string()),
  error: v.optional(v.string()),
})

const filteredTransactionsResponseSchema = v.object({
  transactions: v.array(v.any()),
  total: v.number(),
  error: v.optional(v.string()),
})

const userTransactionHistoryResponseSchema = v.object({
  deposits: v.array(v.any()),
  withdrawals: v.array(v.any()),
  summary: v.object({
    totalDeposits: v.number(),
    totalWithdrawals: v.number(),
    netAmount: v.number(),
    firstDepositDate: v.optional(v.date()),
    lastActivityDate: v.optional(v.date()),
  }),
  error: v.optional(v.string()),
})

const bulkProcessResponseSchema = v.object({
  success: v.boolean(),
  processed: v.number(),
  failed: v.number(),
  errors: v.array(v.string()),
})

const withdrawalActionResponseSchema = v.object({
  success: v.boolean(),
  withdrawalId: v.string(),
  newStatus: v.enum(WithdrawalStatus),
  error: v.optional(v.string()),
})

const transactionAnalyticsResponseSchema = v.object({
  dailyVolume: v.array(v.object({
    date: v.string(),
    deposits: v.number(),
    withdrawals: v.number(),
  })),
  paymentMethodBreakdown: v.record(v.string(), v.number()),
  averageTransactionSize: v.number(),
  topUsers: v.array(v.object({
    userId: v.string(),
    username: v.string(),
    totalDeposits: v.number(),
    totalWithdrawals: v.number(),
    netAmount: v.number(),
    lastActivity: v.date(),
    riskScore: v.number(),
  })),
  error: v.optional(v.string()),
})

const pendingWithdrawalsResponseSchema = v.object({
  withdrawals: v.array(v.any()),
  total: v.number(),
  error: v.optional(v.string()),
})

const systemMaintenanceResponseSchema = v.object({
  success: v.boolean(),
  actions: v.array(v.string()),
  error: v.optional(v.string()),
})

/**
 * API router for admin operations
 * Provides ORPC endpoints for administrative functions
 */

/**
 * ADMIN ENDPOINTS
 */

// Get admin dashboard summary
export const getAdminDashboardRoute = pub
  .output(adminDashboardResponseSchema)
  .handler(async ({ context }) => {
    // TODO: Add admin authentication middleware
    // eslint-disable-next-line node/prefer-global/process
    const isAdmin = context.reqHeaders?.get('x-admin-token') === process.env.ADMIN_TOKEN

    if (!isAdmin) {
      throw new Error('Unauthorized')
    }

    // TODO: Implement getAdminDashboardSummary function
    // For now, return a placeholder response
    return {
      summary: {
        totalDeposits: 0,
        totalWithdrawals: 0,
        pendingDeposits: 0,
        pendingWithdrawals: 0,
        completedToday: 0,
        totalVolumeToday: 0,
        averageProcessingTime: 0,
      },
      recentTransactions: [],
      alerts: [],
    }
  })

// Get filtered transactions for admin
export const getFilteredTransactionsRoute = pub
  .input(adminTransactionFilterSchema)
  .output(filteredTransactionsResponseSchema)
  .handler(async ({ input: _input, context }) => {
    // TODO: Add admin authentication middleware
    // eslint-disable-next-line node/prefer-global/process
    const isAdmin = context.reqHeaders?.get('x-admin-token') === process.env.ADMIN_TOKEN

    if (!isAdmin) {
      throw new Error('Unauthorized')
    }

    // TODO: Implement getFilteredTransactions function
    // For now, return a placeholder response
    return {
      transactions: [],
      total: 0,
    }
  })

// Get user transaction history for admin
export const getUserTransactionHistoryRoute = pub
  .input(userTransactionsParamsSchema)
  .output(userTransactionHistoryResponseSchema)
  .handler(async ({ input: _input, context }) => {
    // TODO: Add admin authentication middleware
    // eslint-disable-next-line node/prefer-global/process
    const isAdmin = context.reqHeaders?.get('x-admin-token') === process.env.ADMIN_TOKEN

    if (!isAdmin) {
      throw new Error('Unauthorized')
    }

    // TODO: Implement getUserTransactionHistory function
    // For now, return a placeholder response
    return {
      deposits: [],
      withdrawals: [],
      summary: {
        totalDeposits: 0,
        totalWithdrawals: 0,
        netAmount: 0,
      },
    }
  })

// Bulk process withdrawals
export const bulkProcessWithdrawalsRoute = pub
  .input(bulkProcessWithdrawalsSchema)
  .output(bulkProcessResponseSchema)
  .handler(async ({ input, context }) => {
    // TODO: Add admin authentication middleware
    // eslint-disable-next-line node/prefer-global/process
    const isAdmin = context.reqHeaders?.get('x-admin-token') === process.env.ADMIN_TOKEN

    if (!isAdmin) {
      throw new Error('Unauthorized')
    }

    // TODO: Implement bulkProcessWithdrawals function
    // For now, return a placeholder response
    return {
      success: true,
      processed: input.withdrawalIds.length,
      failed: 0,
      errors: [],
    }
  })

// Get transaction analytics
export const getTransactionAnalyticsRoute = pub
  .output(transactionAnalyticsResponseSchema)
  .handler(async ({ context }) => {
    // TODO: Add admin authentication middleware
    // eslint-disable-next-line node/prefer-global/process
    const isAdmin = context.reqHeaders?.get('x-admin-token') === process.env.ADMIN_TOKEN

    if (!isAdmin) {
      throw new Error('Unauthorized')
    }

    // TODO: Implement getTransactionAnalytics function
    // For now, return a placeholder response
    return {
      dailyVolume: [],
      paymentMethodBreakdown: {},
      averageTransactionSize: 0,
      topUsers: [],
    }
  })

// Get pending withdrawals for admin review
export const getPendingWithdrawalsRoute = pub
  .output(pendingWithdrawalsResponseSchema)
  .handler(async ({ context }) => {
    // TODO: Add admin authentication middleware
    // eslint-disable-next-line node/prefer-global/process
    const isAdmin = context.reqHeaders?.get('x-admin-token') === process.env.ADMIN_TOKEN

    if (!isAdmin) {
      throw new Error('Unauthorized')
    }

    return await getPendingWithdrawals(100, 0)
  })

// Process individual withdrawal action
export const processWithdrawalActionRoute = pub
  .input(v.intersect([
    withdrawalProcessParamsSchema,
    processWithdrawalActionSchema,
  ]))
  .output(withdrawalActionResponseSchema)
  .handler(async ({ input, context }) => {
    // TODO: Add admin authentication middleware
    // eslint-disable-next-line node/prefer-global/process
    const isAdmin = context.reqHeaders?.get('x-admin-token') === process.env.ADMIN_TOKEN

    if (!isAdmin) {
      throw new Error('Unauthorized')
    }

    const result = await processWithdrawalAction({
      withdrawalId: input.withdrawalId,
      action: input.action,
      adminId: 'admin-system', // Would come from authenticated admin
      reason: input.reason,
      adminNote: input.adminNote,
    })

    return result
  })

// System maintenance endpoint
export const performSystemMaintenanceRoute = pub
  .output(systemMaintenanceResponseSchema)
  .handler(async ({ context }) => {
    // TODO: Add admin authentication middleware
    // eslint-disable-next-line node/prefer-global/process
    const isAdmin = context.reqHeaders?.get('x-admin-token') === process.env.ADMIN_TOKEN

    if (!isAdmin) {
      throw new Error('Unauthorized')
    }

    // TODO: Implement performSystemMaintenance function
    // For now, return a placeholder response
    return {
      success: true,
      actions: [],
    }
  })
