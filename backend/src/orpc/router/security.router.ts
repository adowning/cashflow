/** biome-ignore-all lint/style/noNonNullAssertion: <> */
import { pub } from '@backend/orpc'
import * as v from 'valibot'

import { performFraudCheck, shouldBlockTransaction } from '../../services/security.service.js'

// Schemas for security operations
const fraudCheckParamsSchema = v.object({
  userId: v.string(),
})

const transactionCheckInputSchema = v.object({
  userId: v.string(),
  amount: v.number(),
  type: v.union([v.literal('deposit'), v.literal('withdrawal')]),
})

const fraudCheckResponseSchema = v.object({
  userId: v.string(),
  riskScore: v.number(),
  flags: v.array(v.string()),
  blocked: v.boolean(),
  recommendation: v.union([v.literal('approve'), v.literal('review'), v.literal('reject')]),
})

const transactionCheckResponseSchema = v.object({
  blocked: v.boolean(),
  reason: v.optional(v.string()),
  alerts: v.array(v.object({
    type: v.union([v.literal('velocity'), v.literal('suspicious_pattern'), v.literal('high_risk'), v.literal('duplicate')]),
    severity: v.union([v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical')]),
    userId: v.string(),
    description: v.string(),
    timestamp: v.date(),
    metadata: v.optional(v.record(v.string(), v.any())),
  })),
})

/**
 * API router for security operations
 * Provides ORPC endpoints for security checks and fraud prevention
 */

/**
 * SECURITY ENDPOINTS
 */

// Perform fraud check on user - requires admin authentication
export const performFraudCheckRoute = pub
  .input(fraudCheckParamsSchema)
  .output(fraudCheckResponseSchema)
  .handler(async ({ input, context }) => {
    // TODO: Add admin authentication middleware
    // eslint-disable-next-line node/prefer-global/process
    const isAdmin = context.reqHeaders?.get('x-admin-token') === process.env.ADMIN_TOKEN

    if (!isAdmin) {
      throw new Error('Unauthorized')
    }

    const result = await performFraudCheck(input.userId)
    return result
  })

// Check if transaction should be blocked
export const checkTransactionRoute = pub
  .input(transactionCheckInputSchema)
  .output(transactionCheckResponseSchema)
  .handler(async ({ input }) => {
    const result = await shouldBlockTransaction(input.userId, input.amount, input.type)
    return result
  })
