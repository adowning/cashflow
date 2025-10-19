/** biome-ignore-all lint/suspicious/noExplicitAny: <> */


import { and, eq, gte, sql } from 'drizzle-orm'
import { checkWalletBalance, getUserWallets } from './wallet.service'
import db from '../database'
import { players, gameSessions, games, , session } from '../database/schema'

/**
 * Bet validation service for comprehensive pre-bet checks
 * Validates session, game eligibility, wager limits, and balance
 */

export interface BetValidationRequest
{
  userId: string
  gameId: string
  wagerAmount: number // Amount in cents
  operatorId?: string
}

export interface BetValidationResult
{
  valid: boolean
  reason?: string
  balanceType?: 'real' | 'bonus' | 'insufficient'
  availableBalance?: number
  game?: any
  session?: any
}

export interface GameLimits
{
  minBet: number
  maxBet: number
  maxDailyLoss?: number
  maxSessionLoss?: number
}

/**
 * Comprehensive bet validation following PRD requirements
 */
export async function validateBet(
  request: BetValidationRequest
): Promise<BetValidationResult>
{
  try {
    // 1. Validate user session
    const sessionValidation = await validateUserSession(request.userId)
    if (!sessionValidation.valid) {
      return sessionValidation
    }
    console.log(`sessionValidation : ${sessionValidation.valid}`)
    // 2. Validate game session and eligibility
    const gameValidation = await validateGameSession(request)
    if (!gameValidation.valid) {
      return gameValidation
    }
    console.log(`gameValidation : ${gameValidation.valid}`)

    // 3. Validate game availability and limits
    const gameLimitsValidation = await validateGameLimits(request)
    if (!gameLimitsValidation.valid) {
      return gameLimitsValidation
    }
    console.log(`gameLimitsValidation : ${gameLimitsValidation.valid}`)

    // 4. Validate wager amount limits
    const wagerValidation = await validateWagerAmount(request)
    if (!wagerValidation.valid) {
      return wagerValidation
    }
    console.log(`wagerValidation : ${wagerValidation.valid}`)

    // 5. Validate balance sufficiency
    const balanceValidation = await validateBalance(request)
    if (!balanceValidation.valid) {
      return balanceValidation
    }
    console.log(`balanceValidation : ${balanceValidation.valid}`)
    console.log('All validations passed')

    // All validations passed
    return {
      valid: true,
      balanceType: balanceValidation.balanceType,
      availableBalance: balanceValidation.availableBalance,
      game: gameValidation.game,
      session: sessionValidation.session,
    }
  } catch (error) {
    console.error('Bet validation error:', error)
    return {
      valid: false,
      reason: 'Validation system error',
    }
  }
}

/**
 * Validate user has active session
 */
async function validateUserSession(
  userId: string
): Promise<BetValidationResult>
{
  const user = await db.query.players.findFirst({
    where: eq(players.id, userId),
    with: {
      wallets: {
        with: {
          balances: true,
        },
      },
    },
  })

  if (!user) {
    return { valid: false, reason: 'User not found' }
  }

  // User status check would need to be implemented based on actual user schema
  // For now, assuming all users are active if they exist

  // Check for active auth session
  console.log('Available sessions columns:', Object.keys(gameSessions))
  console.log('Checking for active auth session for userId:', userId)
  let session
  if (process.env.NODE_ENV === 'development') {
    session = await db.query.gameSessions.findFirst({
      where: and(
        eq(gameSessions.playerId, userId),
        // gte(gameSessions.expiredTime, new Date())
      ),
    })
  } else {
    session = await db.query.gameSessions.findFirst({
      where: and(
        eq(gameSessions.playerId, userId),
        gte(gameSessions.expiredTime, new Date())
      ),
    })
  }
  console.log('Found session:', session ? 'yes' : 'no')

  if (!session) {
    return { valid: false, reason: 'No active session found' }
  }

  return {
    valid: true,
    session,
  }
}

/**
 * Validate game session and game eligibility
 */
async function validateGameSession(
  request: BetValidationRequest
): Promise<BetValidationResult>
{
  // Check if game exists and is active
  const game = await db.query.games.findFirst({
    where: and(
      eq(games.id, request.gameId),
      gte(games.status, 0) // 0 = ACTIVE (confirmed by user)
      // eq(games.state, true),
    ),
  })

  if (!game) {
    return { valid: false, reason: 'Game not found or inactive' }
  }

  const gameSession = await db.query.gameSessions.findFirst({
    where: and(
      eq(gameSessions.playerId, request.userId),
      eq(gameSessions.gameId, request.gameId),
      eq(gameSessions.status, 'ACTIVE')
    ),
  })

  if (!gameSession) {
    return { valid: false, reason: 'No active game session found' }
  }

  return {
    valid: true,
    game,
    session: gameSession,
  }
}

/**
 * Validate game-specific limits and restrictions
 */
async function validateGameLimits(
  request: BetValidationRequest
): Promise<BetValidationResult>
{
  const game = await db.query.games.findFirst({
    where: eq(games.id, request.gameId),
  })

  if (!game) {
    return { valid: false, reason: 'Game not found' }
  }

  // Check game-specific wager limits (these would typically come from game configuration)
  const gameLimits: GameLimits = {
    minBet: 100, // 1.00 in cents - should be configurable per game
    maxBet: 100000, // 1000.00 in cents - should be configurable per game
  }

  if (request.wagerAmount < gameLimits.minBet) {
    return {
      valid: false,
      reason: `Minimum bet is $${gameLimits.minBet / 100}`,
    }
  }

  if (request.wagerAmount > gameLimits.maxBet) {
    return {
      valid: false,
      reason: `Maximum bet is $${gameLimits.maxBet / 100}`,
    }
  }

  return { valid: true }
}

/**
 * Validate wager amount against user-specific limits
 */
async function validateWagerAmount(
  request: BetValidationRequest
): Promise<BetValidationResult>
{
  // Get user's active wallet
  // const user = await db.query.players.findFirst({
  //   where: eq(players.id, request.playerId),
  //   with: {
  //     // balances: true,
  //     activeWallet: true
  //   },
  // })
  const userWallets = await getUserWallets(request.userId)
  const user = userWallets[0]

  if (!user) {
    return { valid: false, reason: 'User wallet not found' }
  }

  // Check daily loss limit (configurable per user/VIP level)
  const dailyLossValidation = await validateDailyLossLimit(request)
  if (!dailyLossValidation.valid) {
    return dailyLossValidation
  }

  // Check session loss limit
  const sessionLossValidation = await validateSessionLossLimit(request)
  if (!sessionLossValidation.valid) {
    return sessionLossValidation
  }

  return { valid: true }
}

/**
 * Validate against daily loss limits
 */
async function validateDailyLossLimit(
  request: BetValidationRequest
): Promise<BetValidationResult>
{
  const today = new Date()
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )

  // Calculate today's total losses (negative GGR)
  const todayStats = await db
    .select({
      totalWager: sql<number>`COALESCE(SUM(${gameSessions.totalWagered}), 0)`,
      totalWon: sql<number>`COALESCE(SUM(${gameSessions.totalWon}), 0)`,
    })
    .from(gameSessions)
    .where(
      and(
        eq(gameSessions.playerId, request.userId),
        gte(gameSessions.createdAt, startOfDay)
      )
    )

  const stats = todayStats[0]
  const todayLosses = (stats?.totalWager || 0) - (stats?.totalWon || 0)

  // Daily loss limit (should be configurable per user/VIP level)
  const dailyLossLimit = 1000000 // $10,000 - should be configurable

  if (todayLosses + request.wagerAmount > dailyLossLimit) {
    return {
      valid: false,
      reason: `Daily loss limit of $${dailyLossLimit / 100} would be exceeded`,
    }
  }

  return { valid: true }
}

/**
 * Validate against session loss limits
 */
async function validateSessionLossLimit(
  request: BetValidationRequest
): Promise<BetValidationResult>
{
  // Get current active game session
  const gameSession = await db.query.gameSessions.findFirst({
    where: and(
      eq(gameSessions.playerId, request.userId),
      eq(gameSessions.gameId, request.gameId),
      eq(gameSessions.status, 'ACTIVE')
    ),
  })

  if (!gameSession) {
    return { valid: false, reason: 'No active game session' }
  }

  const sessionLosses =
    ((gameSession as any).totalWagered || 0) -
    ((gameSession as any).totalWon || 0)

  // Session loss limit (should be configurable per game/session)
  const sessionLossLimit = 100000 // $1,000 - should be configurable

  if (sessionLosses + request.wagerAmount > sessionLossLimit) {
    return {
      valid: false,
      reason: `Session loss limit of $${sessionLossLimit / 100} would be exceeded`,
    }
  }

  return { valid: true }
}

/**
 * Validate balance sufficiency and determine balance type
 */
async function validateBalance(
  request: BetValidationRequest
): Promise<BetValidationResult>
{
  // Get user's active wallet
  // const user = await db.query.players.findFirst({
  //     where: eq(players.id, request.playerId),
  //     with: {
  //         balances: true,
  //     },
  // })
  const userWallets = await getUserWallets(request.userId)
  const user = userWallets[0]

  if (!user) {
    return { valid: false, reason: 'User wallet not found' }
  }

  const walletBalance = user

  // Check balance using wallet service
  const balanceCheck = await checkWalletBalance(
    walletBalance.walletId,
    request.wagerAmount
  )

  if (!balanceCheck.sufficient) {
    return {
      valid: false,
      reason: `Insufficient balance. Available: $${balanceCheck.availableAmount / 100}`,
      balanceType: balanceCheck.balanceType,
      availableBalance: balanceCheck.availableAmount,
    }
  }

  return {
    valid: true,
    balanceType: balanceCheck.balanceType,
    availableBalance: balanceCheck.availableAmount,
  }
}

/**
 * Quick validation for Nolimit compatibility
 * Simplified version for existing Nolimit integration
 */
export async function quickValidateBet(
  userId: string,
  gameId: string,
  wagerAmount: number
): Promise<boolean>
{
  const validation = await validateBet({
    userId,
    gameId,
    wagerAmount,
  })

  return validation.valid
}

/**
 * Get game-specific configuration and limits
 */
export async function getGameLimits(
  gameId: string
): Promise<GameLimits | null>
{
  const game = await db.query.games.findFirst({
    where: eq(games.id, gameId),
  })

  if (!game) {
    return null
  }

  // These limits should ideally come from a game configuration table
  // For now, using default values that should be configurable
  return {
    minBet: 100, // $1.00
    maxBet: 100000, // $1000.00
    maxDailyLoss: 1000000, // $10,000
    maxSessionLoss: 100000, // $1,000
  }
}
