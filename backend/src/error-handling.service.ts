/**
 * Error handling service for bet-related errors
 * Provides centralized error logging and handling
 */

export interface ErrorContext {
  userId?: string
  gameId?: string
  betAmount?: number
  [key: string]: unknown
}

/**
 * Handle bet-related errors with logging and optional user notification
 */
export async function handleBetError(
  error: Error,
  source: 'user' | 'system' | 'game' | 'payment',
  context?: ErrorContext,
): Promise<void> {
  // Log error details
  console.error('Bet Error:', {
    message: error.message,
    stack: error.stack,
    source,
    context,
    timestamp: new Date().toISOString(),
  });

  // In production, you might want to:
  // 1. Send error to monitoring service (Sentry, DataDog, etc.)
  // 2. Store in error tracking database
  // 3. Send notifications to admin team for critical errors
  // 4. Trigger fallback processes

  // For now, just logging to console
  // You could extend this to integrate with your notification system
}