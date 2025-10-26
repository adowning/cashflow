import { handleBetError } from '../../lib/utils/errors';
import { processDepositConfirmation } from './deposit.service';

/**
 * Generic webhook processing system for multiple payment providers
 * Handles secure validation, confirmation processing, and error handling
 */

export enum WebhookProvider {
  CASHAPP = 'CASHAPP',
  INSTORE_CASH = 'INSTORE_CASH',
  INSTORE_CARD = 'INSTORE_CARD',
  GENERIC = 'GENERIC',
}

export interface WebhookPayload {
  provider: WebhookProvider;
  transactionId: string;
  amount: number;
  currency: string;
  timestamp: string;
  signature?: string;
  rawData?: Record<string, unknown>;
}

export interface WebhookValidationResult {
  valid: boolean;
  provider?: WebhookProvider;
  transactionId?: string;
  amount?: number;
  error?: string;
}

export interface WebhookProcessingResult {
  success: boolean;
  depositId?: string;
  amount?: number;
  error?: string;
  provider?: WebhookProvider;
}

/**
 * Process incoming webhook from payment provider
 */
export async function processWebhook(
  payload: WebhookPayload,
  secret: string,
  signature: string,
): Promise<WebhookProcessingResult> {
  try {
    // 1. Validate webhook signature for security
    const validation = await validateWebhookSignature(payload, secret, signature);
    if (!validation.valid) {
      await handleBetError(new Error(`Invalid webhook signature: ${validation.error}`), 'system', {
        provider: payload.provider,
        error: validation.error,
      });

      return {
        success: false,
        error: 'Invalid webhook signature',
      };
    }

    // 2. Validate payload structure and content
    const payloadValidation = validateWebhookPayload(payload);
    if (!payloadValidation.valid) {
      return {
        success: false,
        error: payloadValidation.error,
      };
    }

    // 3. Process confirmation based on provider
    const confirmation = {
      transactionId: payload.transactionId,
      amount: payload.amount,
      timestamp: new Date(payload.timestamp),
      providerData: payload.rawData,
    };

    const result = await processDepositConfirmation(confirmation);

    if (result.success) {
      console.log(
        `✅ Webhook processed successfully: ${payload.transactionId} - $${payload.amount / 100}`,
      );

      return {
        success: true,
        depositId: result.depositId,
        amount: result.amount,
        provider: payload.provider,
      };
    } else {
      await handleBetError(new Error(`Deposit confirmation failed: ${result.error}`), 'system', {
        transactionId: payload.transactionId,
        error: result.error,
      });

      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error('Webhook processing error:', error);

    await handleBetError(
      error instanceof Error ? error : new Error('Unknown webhook error'),
      'system',
      { provider: payload.provider, transactionId: payload.transactionId },
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate webhook signature for security
 */
async function validateWebhookSignature(
  payload: WebhookPayload,
  secret: string,
  signature: string,
): Promise<WebhookValidationResult> {
  try {
    // Generate expected signature based on payload and secret
    const payloadString = JSON.stringify(payload);
    const expectedSignature = await generateSignature(payloadString, secret);

    if (signature !== expectedSignature) {
      return {
        valid: false,
        error: 'Signature mismatch',
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Signature validation failed',
    };
  }
}

/**
 * Generate HMAC signature for webhook validation
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
  // In production, use proper HMAC with crypto.subtle
  // For now, using simple hash for demonstration
  const encoder = new TextEncoder();
  const data = encoder.encode(payload + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate webhook payload structure and content
 */
function validateWebhookPayload(payload: WebhookPayload): WebhookValidationResult {
  // Basic structure validation
  if (!payload.transactionId || typeof payload.transactionId !== 'string') {
    return {
      valid: false,
      error: 'Invalid or missing transactionId',
    };
  }

  if (!payload.amount || typeof payload.amount !== 'number' || payload.amount <= 0) {
    return {
      valid: false,
      error: 'Invalid or missing amount',
    };
  }

  if (!payload.timestamp || !isValidISODate(payload.timestamp)) {
    return {
      valid: false,
      error: 'Invalid or missing timestamp',
    };
  }

  // Provider-specific validation
  switch (payload.provider) {
    case WebhookProvider.CASHAPP:
      return validateCashAppPayload(payload);
    case WebhookProvider.INSTORE_CASH:
    case WebhookProvider.INSTORE_CARD:
      return validateInstorePayload(payload);
    default:
      return { valid: true };
  }
}

/**
 * Validate CashApp-specific webhook payload
 */
function validateCashAppPayload(payload: WebhookPayload): WebhookValidationResult {
  if (!payload.rawData?.senderName) {
    return {
      valid: false,
      error: 'CashApp payload missing sender information',
    };
  }

  if (!payload.rawData?.cashtag) {
    return {
      valid: false,
      error: 'CashApp payload missing cashtag',
    };
  }

  return { valid: true };
}

/**
 * Validate in-store payment webhook payload
 */
function validateInstorePayload(payload: WebhookPayload): WebhookValidationResult {
  if (!payload.rawData?.locationId) {
    return {
      valid: false,
      error: 'In-store payload missing location information',
    };
  }

  if (!payload.rawData?.cashierId) {
    return {
      valid: false,
      error: 'In-store payload missing cashier information',
    };
  }

  return { valid: true };
}

/**
 * Validate ISO date string
 */
function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !Number.isNaN(date.getTime()) && date.toISOString() === dateString;
}

/**
 * Webhook endpoint handler for HTTP requests
 */
export async function handleWebhookEndpoint(
  request: Request,
  provider: WebhookProvider,
  webhookSecret: string,
): Promise<Response> {
  try {
    // Validate request method
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get signature from headers
    const signature =
      request.headers.get('x-webhook-signature') ||
      request.headers.get('x-signature') ||
      request.headers.get('signature');

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    let payload: WebhookPayload;
    try {
      payload = (await request.json()) as WebhookPayload;
      payload.provider = provider; // Ensure provider is set
    } catch (_error) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Process webhook
    const result = await processWebhook(payload, webhookSecret, signature);

    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook processed successfully',
          depositId: result.depositId,
          amount: result.amount,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  } catch (error) {
    console.error('Webhook endpoint error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

/**
 * Batch webhook processing for high-volume scenarios
 */
export async function processWebhookBatch(
  payloads: WebhookPayload[],
  secret: string,
  signatures: string[],
): Promise<WebhookProcessingResult[]> {
  const results: WebhookProcessingResult[] = [];

  // Validate array lengths match
  if (payloads.length !== signatures.length) {
    throw new Error(
      `Payload array length (${payloads.length}) must match signatures array length (${signatures.length})`,
    );
  }

  for (let i = 0; i < payloads.length; i++) {
    // Skip undefined payloads but continue processing the rest
    if (!payloads[i] || !signatures[i]) {
      results.push({
        success: false,
        error: 'Missing payload or signature',
      });
      continue;
    }

    const result = await processWebhook(payloads[i]!, secret, signatures[i]!);
    results.push(result);

    // Small delay to prevent overwhelming the system
    if (i < payloads.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  return results;
}

/**
 * Webhook retry mechanism for failed processing
 */
export async function retryFailedWebhook(
  payload: WebhookPayload,
  secret: string,
  signature: string,
  maxRetries: number = 3,
): Promise<WebhookProcessingResult> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await processWebhook(payload, secret, signature);

    if (result.success) {
      return result;
    }

    lastError = result.error;

    // Exponential backoff delay
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
  };
}

/**
 * Webhook health check for monitoring
 */
export async function getWebhookHealth(): Promise<{
  healthy: boolean;
  processedToday: number;
  failedToday: number;
  averageProcessingTime: number;
}> {
  // In production, this would query actual webhook processing logs
  // For now, returning placeholder data

  return {
    healthy: true,
    processedToday: 0,
    failedToday: 0,
    averageProcessingTime: 0,
  };
}

/**
 * Webhook rate limiting check
 */
export function checkWebhookRateLimit(
  _provider: WebhookProvider,
  _windowMs: number = 60000, // 1 minute
  _maxRequests: number = 100,
): boolean {
  // In production, this would check actual rate limiting data
  // For now, always allowing

  return true;
}
