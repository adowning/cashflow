/** biome-ignore-all lint/style/noNonNullAssertion: <> */
import { pub } from '@backend/orpc'
import * as v from 'valibot'

import { processWebhook, WebhookProvider } from '../../services/webhook.service.js'

// Webhook secret for signature validation
// eslint-disable-next-line node/prefer-global/process
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret'

// Schemas for webhook operations
const webhookPayloadSchema = v.object({
  provider: v.optional(v.enum(WebhookProvider)),
  transactionId: v.string(),
  amount: v.number(),
  currency: v.string(),
  timestamp: v.string(),
  signature: v.optional(v.string()),
  rawData: v.optional(v.record(v.string(), v.any())),
})

const webhookResponseSchema = v.object({
  success: v.boolean(),
  message: v.optional(v.string()),
  depositId: v.optional(v.string()),
  amount: v.optional(v.number()),
  error: v.optional(v.string()),
})

/**
 * API router for webhook operations
 * Provides ORPC endpoints for external service webhooks
 */

/**
 * WEBHOOK ENDPOINTS
 */

// CashApp webhook endpoint
export const cashappWebhook = pub
  .input(webhookPayloadSchema)
  .output(webhookResponseSchema)
  .handler(async ({ input, context }) => {
    // Get signature from headers
    const signature = context.reqHeaders?.get('x-webhook-signature')
      || context.reqHeaders?.get('x-signature')
      || context.reqHeaders?.get('signature')
      || input.signature

    if (!signature) {
      throw new Error('Missing signature')
    }

    // Process webhook with CashApp provider
    const payload = { ...input, provider: WebhookProvider.CASHAPP }
    return await processWebhook(payload, WEBHOOK_SECRET, signature)
  })

// In-store cash webhook endpoint
export const instoreCashWebhook = pub
  .input(webhookPayloadSchema)
  .output(webhookResponseSchema)
  .handler(async ({ input, context }) => {
    // Get signature from headers
    const signature = context.reqHeaders?.get('x-webhook-signature')
      || context.reqHeaders?.get('x-signature')
      || context.reqHeaders?.get('signature')
      || input.signature

    if (!signature) {
      throw new Error('Missing signature')
    }

    // Process webhook with in-store cash provider
    const payload = { ...input, provider: WebhookProvider.INSTORE_CASH }
    return await processWebhook(payload, WEBHOOK_SECRET, signature)
  })

// In-store card webhook endpoint
export const instoreCardWebhook = pub
  .input(webhookPayloadSchema)
  .output(webhookResponseSchema)
  .handler(async ({ input, context }) => {
    // Get signature from headers
    const signature = context.reqHeaders?.get('x-webhook-signature')
      || context.reqHeaders?.get('x-signature')
      || context.reqHeaders?.get('signature')
      || input.signature

    if (!signature) {
      throw new Error('Missing signature')
    }

    // Process webhook with in-store card provider
    const payload = { ...input, provider: WebhookProvider.INSTORE_CARD }
    return await processWebhook(payload, WEBHOOK_SECRET, signature)
  })

// Generic webhook endpoint for future providers
export const genericWebhook = pub
  .input(webhookPayloadSchema)
  .output(webhookResponseSchema)
  .handler(async ({ input, context }) => {
    // Get signature from headers
    const signature = context.reqHeaders?.get('x-webhook-signature')
      || context.reqHeaders?.get('x-signature')
      || context.reqHeaders?.get('signature')
      || input.signature

    if (!signature) {
      throw new Error('Missing signature')
    }

    // Process webhook with generic provider
    const payload = { ...input, provider: WebhookProvider.GENERIC }
    return await processWebhook(payload, WEBHOOK_SECRET, signature)
  })
