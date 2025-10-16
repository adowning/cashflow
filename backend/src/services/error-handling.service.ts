import { notifyError } from "./realtime-notifications.service";

/**
 * Error handling system with player notifications for network/provider failures
 * Provides structured error handling and user-friendly error messages
 */

export enum BetErrorCode
{
  // Network/Game Provider Errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  GAME_PROVIDER_ERROR = 'GAME_PROVIDER_ERROR',
  WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',

  // Validation Errors
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_SESSION = 'INVALID_SESSION',
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  INVALID_WAGER_AMOUNT = 'INVALID_WAGER_AMOUNT',

  // Balance Errors
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  BALANCE_LOCKED = 'BALANCE_LOCKED',
  CONCURRENT_BET_ERROR = 'CONCURRENT_BET_ERROR',

  // System Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  SYSTEM_OVERLOAD = 'SYSTEM_OVERLOAD',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',

  // Generic Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export interface BetError
{
  code: BetErrorCode;
  message: string;
  userMessage: string; // User-friendly message
  recoverable: boolean;
  retryable: boolean;
  metadata?: Record<string, any>;
}

export interface ErrorHandlingResult
{
  handled: boolean;
  shouldRetry: boolean;
  userNotified: boolean;
  error?: BetError;
}

/**
 * Error definitions with user-friendly messages
 */
const ERROR_DEFINITIONS: Record<BetErrorCode, Omit<BetError, 'code'>> = {
  [BetErrorCode.NETWORK_TIMEOUT]: {
    message: 'Network request timed out',
    userMessage: 'Connection timeout. Please check your internet connection and try again.',
    recoverable: true,
    retryable: true,
  },
  [BetErrorCode.GAME_PROVIDER_ERROR]: {
    message: 'Game provider returned an error',
    userMessage: 'Game temporarily unavailable. Please try again in a moment.',
    recoverable: true,
    retryable: true,
  },
  [BetErrorCode.WEBSOCKET_ERROR]: {
    message: 'WebSocket connection error',
    userMessage: 'Connection lost. Please refresh the page and try again.',
    recoverable: true,
    retryable: false,
  },
  [BetErrorCode.INSUFFICIENT_BALANCE]: {
    message: 'Insufficient balance for bet',
    userMessage: 'Insufficient balance. Please make a deposit or use a smaller bet amount.',
    recoverable: false,
    retryable: false,
  },
  [BetErrorCode.INVALID_SESSION]: {
    message: 'Invalid or expired session',
    userMessage: 'Your session has expired. Please log in again.',
    recoverable: true,
    retryable: false,
  },
  [BetErrorCode.GAME_NOT_FOUND]: {
    message: 'Game not found or unavailable',
    userMessage: 'Game temporarily unavailable. Please try a different game.',
    recoverable: true,
    retryable: true,
  },
  [BetErrorCode.INVALID_WAGER_AMOUNT]: {
    message: 'Invalid wager amount',
    userMessage: 'Invalid bet amount. Please check the minimum and maximum limits.',
    recoverable: false,
    retryable: false,
  },
  [BetErrorCode.WALLET_NOT_FOUND]: {
    message: 'User wallet not found',
    userMessage: 'Account error. Please contact support if this persists.',
    recoverable: true,
    retryable: false,
  },
  [BetErrorCode.BALANCE_LOCKED]: {
    message: 'Balance is locked or under maintenance',
    userMessage: 'Account temporarily locked. Please contact support.',
    recoverable: true,
    retryable: false,
  },
  [BetErrorCode.CONCURRENT_BET_ERROR]: {
    message: 'Concurrent bet detected',
    userMessage: 'Please wait for your previous bet to complete before placing another.',
    recoverable: true,
    retryable: true,
  },
  [BetErrorCode.DATABASE_ERROR]: {
    message: 'Database operation failed',
    userMessage: 'System error. Please try again in a moment.',
    recoverable: true,
    retryable: true,
  },
  [BetErrorCode.SYSTEM_OVERLOAD]: {
    message: 'System under heavy load',
    userMessage: 'System busy. Please try again in a moment.',
    recoverable: true,
    retryable: true,
  },
  [BetErrorCode.CONFIGURATION_ERROR]: {
    message: 'System configuration error',
    userMessage: 'System maintenance. Please try again later.',
    recoverable: true,
    retryable: true,
  },
  [BetErrorCode.UNKNOWN_ERROR]: {
    message: 'Unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again.',
    recoverable: true,
    retryable: true,
  },
  [BetErrorCode.VALIDATION_ERROR]: {
    message: 'Validation failed',
    userMessage: 'Invalid request. Please check your input and try again.',
    recoverable: false,
    retryable: false,
  },
};

/**
 * Handle bet processing error with appropriate user notification
 */
export async function handleBetError(
  error: Error | string,
  userId: string,
  context?: Record<string, any>
): Promise<ErrorHandlingResult>
{
  const errorCode = identifyErrorCode(error, context);
  const errorDefinition = ERROR_DEFINITIONS[errorCode];

  const betError: BetError = {
    code: errorCode,
    ...errorDefinition,
    metadata: context,
  };

  // Log error for monitoring
  logError(betError, userId);

  // Send user notification
  const userNotified = await notifyUserOfError(userId, betError);

  // Determine if error is retryable
  const shouldRetry = errorDefinition.retryable && !isMaximumRetriesReached(userId, errorCode);

  return {
    handled: true,
    shouldRetry,
    userNotified,
    error: betError,
  };
}

/**
 * Identify error code from error object and context
 */
function identifyErrorCode(
  error: Error | string,
  context?: Record<string, any>
): BetErrorCode
{
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Network/Game Provider Errors
  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    return BetErrorCode.NETWORK_TIMEOUT;
  }

  if (errorMessage.includes('websocket') || errorMessage.includes('WebSocket')) {
    return BetErrorCode.WEBSOCKET_ERROR;
  }

  if (errorMessage.includes('provider') || errorMessage.includes('game server')) {
    return BetErrorCode.GAME_PROVIDER_ERROR;
  }

  // Validation Errors
  if (errorMessage.includes('insufficient balance') || errorMessage.includes('NSF')) {
    return BetErrorCode.INSUFFICIENT_BALANCE;
  }

  if (errorMessage.includes('session') || errorMessage.includes('authentication')) {
    return BetErrorCode.INVALID_SESSION;
  }

  if (errorMessage.includes('game not found') || errorMessage.includes('invalid game')) {
    return BetErrorCode.GAME_NOT_FOUND;
  }

  if (errorMessage.includes('invalid wager') || errorMessage.includes('bet amount')) {
    return BetErrorCode.INVALID_WAGER_AMOUNT;
  }

  // Balance Errors
  if (errorMessage.includes('wallet not found')) {
    return BetErrorCode.WALLET_NOT_FOUND;
  }

  if (errorMessage.includes('balance locked') || errorMessage.includes('locked')) {
    return BetErrorCode.BALANCE_LOCKED;
  }

  if (errorMessage.includes('concurrent') || errorMessage.includes('duplicate')) {
    return BetErrorCode.CONCURRENT_BET_ERROR;
  }

  // System Errors
  if (errorMessage.includes('database') || errorMessage.includes('SQL')) {
    return BetErrorCode.DATABASE_ERROR;
  }

  if (errorMessage.includes('overload') || errorMessage.includes('rate limit')) {
    return BetErrorCode.SYSTEM_OVERLOAD;
  }

  if (errorMessage.includes('configuration') || errorMessage.includes('config')) {
    return BetErrorCode.CONFIGURATION_ERROR;
  }

  // Default to unknown error
  return BetErrorCode.UNKNOWN_ERROR;
}

/**
 * Notify user of error through realtime notification system
 */
async function notifyUserOfError(userId: string, error: BetError): Promise<boolean>
{
  try {
    await notifyError(userId, error.userMessage, error.code);
    return true;
  } catch (notificationError) {
    console.error('Failed to send error notification:', notificationError);
    return false;
  }
}

/**
 * Log error for monitoring and debugging
 */
function logError(error: BetError, userId: string): void
{
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId,
    errorCode: error.code,
    message: error.message,
    userMessage: error.userMessage,
    recoverable: error.recoverable,
    retryable: error.retryable,
    metadata: error.metadata,
  };

  // In production, this would be sent to monitoring system (e.g., Sentry, DataDog)
  console.error('Bet Error:', logEntry);

  // Also log to database for audit trail
  logErrorToDatabase(logEntry);
}

/**
 * Log error to database for audit trail
 */
function logErrorToDatabase(logEntry: any): void
{
  // In production, this would insert into an error_logs table
  console.log('Error logged to database:', logEntry);
}

/**
 * Check if maximum retries reached for error type
 */
function isMaximumRetriesReached(userId: string, errorCode: BetErrorCode): boolean
{
  // In production, this would track retry counts per user/error type
  // For now, allowing up to 3 retries for retryable errors
  const maxRetries: Record<BetErrorCode, number> = {
    [BetErrorCode.NETWORK_TIMEOUT]: 3,
    [BetErrorCode.GAME_PROVIDER_ERROR]: 2,
    [BetErrorCode.DATABASE_ERROR]: 3,
    [BetErrorCode.SYSTEM_OVERLOAD]: 5,
    [BetErrorCode.CONFIGURATION_ERROR]: 1,
    [BetErrorCode.WEBSOCKET_ERROR]: 0, // Don't retry WebSocket errors
    [BetErrorCode.INSUFFICIENT_BALANCE]: 0,
    [BetErrorCode.INVALID_SESSION]: 0,
    [BetErrorCode.GAME_NOT_FOUND]: 2,
    [BetErrorCode.INVALID_WAGER_AMOUNT]: 0,
    [BetErrorCode.WALLET_NOT_FOUND]: 0,
    [BetErrorCode.BALANCE_LOCKED]: 0,
    [BetErrorCode.CONCURRENT_BET_ERROR]: 1,
    [BetErrorCode.UNKNOWN_ERROR]: 2,
    [BetErrorCode.VALIDATION_ERROR]: 0,
  };

  return false; // Placeholder - would check actual retry count
}

/**
 * Create user-friendly error message from error code
 */
export function getUserFriendlyErrorMessage(errorCode: BetErrorCode): string
{
  return ERROR_DEFINITIONS[errorCode]?.userMessage || 'An error occurred. Please try again.';
}

/**
 * Check if error is retryable
 */
export function isErrorRetryable(errorCode: BetErrorCode): boolean
{
  return ERROR_DEFINITIONS[errorCode]?.retryable || false;
}

/**
 * Handle network failure with exponential backoff
 */
export async function handleNetworkFailure(
  userId: string,
  operation: () => Promise<any>,
  maxRetries: number = 3
): Promise<{ success: boolean; result?: any; error?: string }>
{
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return { success: true, result };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      const errorHandling = await handleBetError(lastError, userId, { attempt });
      if (!errorHandling.shouldRetry) {
        break;
      }

      // Exponential backoff delay
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Network operation failed after retries',
  };
}

/**
 * Handle game provider timeout
 */
export async function handleGameProviderTimeout(
  userId: string,
  gameId: string,
  timeout: number = 30000
): Promise<{ success: boolean; error?: string }>
{
  return new Promise((resolve) =>
  {
    // Set up timeout
    const timeoutId = setTimeout(async () =>
    {
      const errorHandling = await handleBetError(
        new Error('Game provider timeout'),
        userId,
        { gameId, timeout }
      );

      resolve({
        success: false,
        error: 'Game provider did not respond in time',
      });
    }, timeout);

    // In real implementation, this would wait for game provider response
    // For now, simulating immediate response
    clearTimeout(timeoutId);
    resolve({ success: true });
  });
}

/**
 * Handle WebSocket connection errors
 */
export async function handleWebSocketError(
  userId: string,
  error: Error
): Promise<void>
{
  await handleBetError(error, userId, {
    errorType: 'websocket',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle database errors with potential rollback
 */
export async function handleDatabaseError(
  userId: string,
  operation: string,
  error: Error
): Promise<{ success: boolean; shouldRetry: boolean }>
{
  const errorHandling = await handleBetError(error, userId, {
    operation,
    errorType: 'database',
  });

  return {
    success: false,
    shouldRetry: errorHandling.shouldRetry,
  };
}

/**
 * Get error statistics for monitoring
 */
export async function getErrorStatistics(
  hours: number = 24
): Promise<Record<BetErrorCode, number>>
{
  // In production, this would query error logs from database
  // For now, returning empty statistics
  const statistics: Record<BetErrorCode, number> = {} as Record<BetErrorCode, number>;

  Object.values(BetErrorCode).forEach(code =>
  {
    statistics[code] = 0;
  });

  return statistics;
}

/**
 * Check system health for error conditions
 */
export async function checkErrorConditions(): Promise<{
  healthy: boolean;
  activeErrors: number;
  errorRate: number;
}>
{
  // In production, this would check actual error rates and system health
  return {
    healthy: true,
    activeErrors: 0,
    errorRate: 0,
  };
}