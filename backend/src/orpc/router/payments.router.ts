/* eslint-disable ts/ban-ts-comment */
/** biome-ignore-all lint/style/noNonNullAssertion: <> */
/** biome-ignore-all lint/suspicious/noTsIgnore: <> */
import { pub } from '@backend/orpc'
import * as v from 'valibot'

import { DepositStatus, getDepositStatus, getUserDepositHistory, initiateDeposit, PaymentMethod } from '../../services/payments/deposit.service.js'
import { getUserWithdrawalHistory, getWithdrawalStatus, requestWithdrawal, WithdrawalStatus } from '../../services/payments/withdrawal.service.js'
import type { PayoutMethod } from '../../services/payments/withdrawal.service.js'
import { PayoutMethodValues } from '../../services/payments/withdrawal.service.js'

// Schemas for deposit operations
const initiateDepositSchema = v.object({
  userId: v.string(),
  amount: v.number(),
  paymentMethod: v.enum(PaymentMethod),
  currency: v.optional(v.string()),
  note: v.optional(v.string()),
  metadata: v.optional(v.record(v.string(), v.any())),
})

const depositParamsSchema = v.object({
  depositId: v.string(),
})

const userDepositsParamsSchema = v.object({
  userId: v.string(),
})

// const userDepositsQuerySchema = v.object({
//   limit: v.optional(v.pipe(v.string(), v.transform(Number)), 50),
//   offset: v.optional(v.pipe(v.string(), v.transform(Number)), 0),
// })

const depositResponseSchema = v.object({
  success: v.boolean(),
  depositId: v.optional(v.string()),
  status: v.enum(DepositStatus),
  instructions: v.optional(v.string()),
  referenceId: v.optional(v.string()),
  error: v.optional(v.string()),
})

const depositStatusResponseSchema = v.object({
  deposit: v.optional(v.any()),
  status: v.enum(DepositStatus),
  error: v.optional(v.string()),
})

const userDepositsResponseSchema = v.object({
  deposits: v.array(v.any()),
  total: v.number(),
  error: v.optional(v.string()),
})

// Schemas for withdrawal operations
const payoutDetailsSchema = v.object({
  accountNumber: v.optional(v.string()),
  routingNumber: v.optional(v.string()),
  cashappTag: v.optional(v.string()),
  cryptoAddress: v.optional(v.string()),
  walletType: v.optional(v.string()),
})

const requestWithdrawalSchema = v.object({
  userId: v.string(),
  amount: v.number(),
  payoutMethod: v.enum(PayoutMethodValues),
  payoutDetails: payoutDetailsSchema,
  currency: v.optional(v.string()),
  note: v.optional(v.string()),
})

const withdrawalParamsSchema = v.object({
  withdrawalId: v.string(),
})

const userWithdrawalsParamsSchema = v.object({
  userId: v.string(),
})

const withdrawalResponseSchema = v.object({
  success: v.boolean(),
  withdrawalId: v.optional(v.string()),
  status: v.enum(WithdrawalStatus),
  error: v.optional(v.string()),
  validationErrors: v.optional(v.array(v.string())),
})

const withdrawalStatusResponseSchema = v.object({
  withdrawal: v.optional(v.any()),
  status: v.enum(WithdrawalStatus),
  error: v.optional(v.string()),
})

const userWithdrawalsResponseSchema = v.object({
  withdrawals: v.array(v.any()),
  total: v.number(),
  error: v.optional(v.string()),
})

/**
 * API router for deposit/withdrawal system
 * Provides ORPC endpoints for deposit and withdrawal operations
 */

/**
 * DEPOSIT ENDPOINTS
 */

// Initiate a new deposit
export const initiateDepositRoute = pub
  .input(initiateDepositSchema)
  .output(depositResponseSchema)
  .handler(async ({ input }) => {
    return await initiateDeposit(input)
  })

// Get deposit status
export const getDepositStatusRoute = pub
  .input(depositParamsSchema)
  .output(depositStatusResponseSchema)
  .handler(async ({ input }) => {
    const result = await getDepositStatus(input.depositId)

    if (!result) {
      throw new Error('Deposit not found')
    }

    return result
  })

// Get user deposit history
export const getUserDepositHistoryRoute = pub
  .input(userDepositsParamsSchema)
  .output(userDepositsResponseSchema)
  .handler(async ({ input, context }) => {
    // @ts-ignore
    const query = context.reqQuery || {}
    const limit = query.limit ? Number(query.limit) : 50
    const offset = query.offset ? Number(query.offset) : 0

    return await getUserDepositHistory(input.userId, limit, offset)
  })

/**
 * WITHDRAWAL ENDPOINTS
 */

// Request a new withdrawal
export const requestWithdrawalRoute = pub
  .input(requestWithdrawalSchema)
  .output(withdrawalResponseSchema)
  .handler(async ({ input }) => {
    return await requestWithdrawal(input)
  })

// Get withdrawal status
export const getWithdrawalStatusRoute = pub
  .input(withdrawalParamsSchema)
  .output(withdrawalStatusResponseSchema)
  .handler(async ({ input }) => {
    const result = await getWithdrawalStatus(input.withdrawalId)

    if (!result) {
      throw new Error('Withdrawal not found')
    }

    return result
  })

// Get user withdrawal history
export const getUserWithdrawalHistoryRoute = pub
  .input(userWithdrawalsParamsSchema)
  .output(userWithdrawalsResponseSchema)
  .handler(async ({ input, context }) => {
    // @ts-ignore
    const query = context.reqQuery || {}
    const limit = query.limit ? Number(query.limit) : 50
    const offset = query.offset ? Number(query.offset) : 0

    return await getUserWithdrawalHistory(input.userId, limit, offset)
  })
