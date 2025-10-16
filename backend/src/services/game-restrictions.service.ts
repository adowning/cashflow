/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
/** biome-ignore-all lint/complexity/useOptionalChain: <> */


import db from '../database'
import type { Games, Bonus } from '../database/interfaces'
import { games, bonuses, players,  } from '../database/schema'
import { and, eq, } from "drizzle-orm";

/**
 * Game restriction logic for bonus usage (admin-configurable per game)
 * Controls which games are eligible for bonus wagering and under what conditions
 */

export interface GameRestriction
{
  gameId: string;
  gameName: string;
  bonusEligible?: boolean;
  maxBonusBet?: number; // Maximum bet when using bonus
  contributionRate?: number; // Bonus wagering contribution rate (0-1)
  vipMultiplier?: number; // VIP points multiplier for this game
  restrictedCountries?: string[];
  restrictedUserTypes?: string[];
  effectiveDate?: Date;
  expiryDate?: Date;
}

export interface BonusRestriction
{
  bonusId: string;
  bonusName: string;
  allowedGameTypes: string[];
  excludedGameIds: string[];
  maxBetWithBonus?: number;
  contributionPercentage: number; // How much of wager counts toward requirement
  vipPointsMultiplier: number;
}

export interface RestrictionCheck
{
  allowed: boolean;
  reason?: string;
  adjustedBetAmount?: number;
  contributionRate?: number;
  vipMultiplier?: number;
}

/**
 * Default game restrictions - should be admin configurable
 */
const DEFAULT_GAME_RESTRICTIONS: Record<string, Omit<GameRestriction, 'gameId' | 'gameName'>> = {
  // High RTP games might have lower contribution rates
  'high-rtp-slots': {
    bonusEligible: true,
    maxBonusBet: 50000, // $500 max bet with bonus
    contributionRate: 1.0, // 100% contribution
    vipMultiplier: 1.0,
  },
  // Table games might be restricted or have lower rates
  'table-games': {
    bonusEligible: false, // No bonus wagering allowed
    contributionRate: 0.0,
    vipMultiplier: 0.5, // Reduced VIP points
  },
  // Progressive jackpot games
  'progressive-slots': {
    bonusEligible: true,
    maxBonusBet: 100000, // $1,000 max bet with bonus
    contributionRate: 0.8, // 80% contribution
    vipMultiplier: 1.2, // Bonus VIP points
  },
  // Default for unconfigured games
  'default': {
    bonusEligible: true,
    contributionRate: 1.0,
    vipMultiplier: 1.0,
  },
};

/**
 * Check if game is allowed for bonus wagering
 */
export async function checkGameBonusEligibility(
  gameId: string,
  bonusId: string,
  betAmount: number,
  userId: string
): Promise<RestrictionCheck>
{
  try {
    // Get game information
    const game = await db.query.games.findFirst({
      where: eq(games.id, gameId),
    }) as Games | undefined;

    if (!game) {
      return {
        allowed: false,
        reason: 'Game not found',
      };
    }

    // Get bonus information
    const bonus = await db.query.bonuses.findFirst({
      where: eq(bonuses.id, bonusId),
    }) as Bonus | undefined;

    if (!bonus) {
      return {
        allowed: false,
        reason: 'Bonus not found',
      };
    }

    // Check basic game eligibility
    const gameEligibility = await checkBasicGameEligibility(game, bonus);
    if (!gameEligibility.allowed) {
      return gameEligibility;
    }

    // Check bet amount restrictions
    const betRestriction = await checkBetAmountRestriction(gameId, betAmount, bonus);
    if (!betRestriction.allowed) {
      return betRestriction;
    }

    // Check user-specific restrictions
    const userRestriction = await checkUserRestrictions(gameId, userId);
    if (!userRestriction.allowed) {
      return userRestriction;
    }

    // Get contribution rates and multipliers
    const gameConfig = getGameConfiguration(game);
    const contributionRate = gameConfig.contributionRate || 1.0;
    const vipMultiplier = gameConfig.vipMultiplier || 1.0;

    return {
      allowed: true,
      adjustedBetAmount: betRestriction.adjustedBetAmount,
      contributionRate,
      vipMultiplier,
    };
  } catch (error) {
    console.error('Game restriction check failed:', error);
    return {
      allowed: false,
      reason: 'Restriction check failed',
    };
  }
}

/**
 * Check basic game eligibility for bonus
 */
async function checkBasicGameEligibility(
  game: Games,
  bonus: Bonus
): Promise<RestrictionCheck>
{
  // Check if bonus allows this game type
  if (bonus.slot === false && game.category === 'slot') {
    return {
      allowed: false,
      reason: 'Bonus does not allow slot games',
    };
  }

  if (bonus.casino === false && game.category === 'casino') {
    return {
      allowed: false,
      reason: 'Bonus does not allow casino games',
    };
  }

  // Check game-specific restrictions
  const gameConfig = getGameConfiguration(game);

  if (!gameConfig.bonusEligible) {
    return {
      allowed: false,
      reason: 'Game not eligible for bonus wagering',
    };
  }

  return { allowed: true };
}

/**
 * Check bet amount restrictions for bonus usage
 */
async function checkBetAmountRestriction(
  gameId: string,
  betAmount: number,
  bonus: Bonus
): Promise<RestrictionCheck>
{
  const gameConfig = getGameConfigurationById(gameId);

  // Check maximum bet with bonus
  if (gameConfig.maxBonusBet && betAmount > gameConfig.maxBonusBet) {
    return {
      allowed: false,
      reason: `Maximum bet with bonus is $${gameConfig.maxBonusBet / 100}`,
      adjustedBetAmount: gameConfig.maxBonusBet,
    };
  }

  // Check bonus-specific bet limits
  if (bonus.maxBet && betAmount > bonus.maxBet) {
    return {
      allowed: false,
      reason: `Bonus maximum bet is $${bonus.maxBet / 100}`,
    };
  }

  return { allowed: true };
}

/**
 * Check user-specific restrictions
 */
async function checkUserRestrictions(
  gameId: string,
  userId: string
): Promise<RestrictionCheck>
{
  // Get user information
  const user = await db.query.players.findFirst({
    where: eq(players.id, userId),
  }) as any; // Using any for user type due to complex schema

  if (!user) {
    return {
      allowed: false,
      reason: 'User not found',
    };
  }

  // Check country restrictions
  const gameConfig = getGameConfigurationById(gameId);

  // if (gameConfig.restrictedCountries && user.country) {
  //   const userCountry = typeof user.country === 'object' ? user.country.code : user.country;
  //   if (gameConfig.restrictedCountries.includes(userCountry)) {
  //     return {
  //       allowed: false,
  //       reason: 'Game not available in your country',
  //     };
  //   }
  // }

  // Check VIP level restrictions (if any)
  if (gameConfig.restrictedUserTypes && gameConfig.restrictedUserTypes.includes(user.role)) {
    return {
      allowed: false,
      reason: 'Game not available for your user type',
    };
  }

  return { allowed: true };
}

/**
 * Get game configuration for restrictions
 */
function getGameConfiguration(game: Games): GameRestriction
{
  // In production, this would query a game_restrictions table
  // For now, using game type/category-based configuration

  const gameCategory = (game as any).category?.toLowerCase() || 'default';
  const gameName = (game as any).name?.toLowerCase() || '';

  // Check for specific game types
  if (gameCategory.includes('progressive') || gameName.includes('progressive')) {
    return {
      gameId: (game as any).id,
      gameName: (game as any).name,
      ...DEFAULT_GAME_RESTRICTIONS['progressive-slots'],
    };
  }

  if (gameCategory.includes('table') || gameCategory.includes('blackjack') || gameCategory.includes('roulette')) {
    return {
      gameId: (game as any).id,
      gameName: (game as any).name,
      ...DEFAULT_GAME_RESTRICTIONS['table-games'],
    };
  }

  if (gameCategory.includes('slot') && (game as any).targetRtp > 97) {
    return {
      gameId: (game as any).id,
      gameName: (game as any).name,
      ...DEFAULT_GAME_RESTRICTIONS['high-rtp-slots'],
    };
  }

  // Default configuration
  return {
    gameId: (game as any).id,
    gameName: (game as any).name,
    ...DEFAULT_GAME_RESTRICTIONS['default'],
  };
}

/**
 * Get game configuration by game ID
 */
function getGameConfigurationById(gameId: string): GameRestriction
{
  // In production, this would query the database
  // For now, returning default configuration
  return {
    gameId,
    gameName: 'Unknown Game',
    ...DEFAULT_GAME_RESTRICTIONS['default'],
  };
}

/**
 * Update game restrictions (admin function)
 */
export async function updateGameRestrictions(
  gameId: string,
  restrictions: Partial<GameRestriction>
): Promise<{ success: boolean; error?: string }>
{
  try {
    // In production, this would update a game_restrictions table
    console.log(`Updating restrictions for game ${gameId}:`, restrictions);

    // For now, just logging the update
    // In production:
    // await db.insert(gameRestrictions).values({
    //   gameId,
    //   ...restrictions,
    //   updatedAt: new Date().toISOString(),
    // }).onConflictDoUpdate(...)

    return { success: true };
  } catch (error) {
    console.error('Failed to update game restrictions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all game restrictions for admin management
 */
export async function getAllGameRestrictions(): Promise<GameRestriction[]>
{
  // In production, this would query the game_restrictions table
  // For now, returning empty array
  return [];
}

/**
 * Get bonus restrictions for admin management
 */
export async function getBonusRestrictions(bonusId: string): Promise<BonusRestriction | null>
{
  const bonus = await db.query.bonuses.findFirst({
    where: eq(bonuses.id, bonusId),
  }) as Bonus | undefined;

  if (!bonus) {
    return null;
  }

  // In production, this would include more sophisticated restriction data
  return {
    bonusId: bonus.id,
    bonusName: bonus.name,
    allowedGameTypes: bonus.slot ? ['slot'] : [],
    excludedGameIds: [], // Would be populated from bonus configuration
    maxBetWithBonus: bonus.maxBet,
    contributionPercentage: 100, // Default - should be configurable
    vipPointsMultiplier: 1.0, // Default - should be configurable
  };
}

/**
 * Check if user can use bonus for specific game
 */
export async function canUseBonusForGame(
  userId: string,
  bonusId: string,
  gameId: string,
  betAmount: number
): Promise<RestrictionCheck>
{
  return checkGameBonusEligibility(gameId, bonusId, betAmount, userId);
}

/**
 * Get contribution rate for bonus wagering on specific game
 */
export async function getBonusContributionRate(
  gameId: string,
  _bonusId: string
): Promise<number>
{
  const gameConfig = getGameConfigurationById(gameId);

  // In production, this would consider bonus-specific rates
  return gameConfig.contributionRate || 1.0;
}

/**
 * Get VIP multiplier for specific game
 */
export async function getGameVIPMultiplier(gameId: string): Promise<number>
{
  const gameConfig = getGameConfigurationById(gameId);
  return gameConfig.vipMultiplier || 1.0;
}

/**
 * Validate game is available for user in their jurisdiction
 */
export async function validateGameAvailability(
  gameId: string,
  userId: string
): Promise<{ available: boolean; reason?: string }>
{
  try {
    const game = await db.query.games.findFirst({
      where: eq(games.id, gameId),
    }) as Games | undefined;

    if (!game) {
      return { available: false, reason: 'Game not found' };
    }

    if (game.status !== 1) { // Assuming 1 means ACTIVE
      return { available: false, reason: 'Game not available' };
    }

    // Check user restrictions
    const userRestriction = await checkUserRestrictions(gameId, userId);
    if (!userRestriction.allowed) {
      return { available: false, reason: userRestriction.reason };
    }

    return { available: true };
  } catch (error) {
    console.error('Game availability check failed:', error);
    return {
      available: false,
      reason: 'Availability check failed',
    };
  }
}

/**
 * Get games eligible for bonus wagering
 */
export async function getBonusEligibleGames(bonusId: string): Promise<string[]>
{
  try {
    const bonus = await db.query.bonuses.findFirst({
      where: eq(bonuses.id, bonusId),
    }) as Bonus | undefined;

    if (!bonus) {
      return [];
    }

    // Get all active games
    const allGames = await db.query.games.findMany({
      where: (and as any)(
        eq(games.status, 1), // Assuming 1 means ACTIVE
        // eq(games.state, true)
      ),
    }) as Games[];

    // Filter games based on bonus restrictions
    const eligibleGames: string[] = [];

    for (const game of allGames) {
      const eligibility = await checkBasicGameEligibility(game, bonus);
      if (eligibility.allowed) {
        eligibleGames.push(game.id);
      }
    }

    return eligibleGames;
  } catch (error) {
    console.error('Failed to get bonus eligible games:', error);
    return [];
  }
}

/**
 * Admin function to set game bonus eligibility
 */
export async function setGameBonusEligibility(
  gameId: string,
  eligible: boolean,
  restrictions?: Partial<GameRestriction>
): Promise<{ success: boolean; error?: string }>
{
  try {
    // In production, this would update a game_restrictions table
    console.log(`Setting game ${gameId} bonus eligibility to ${eligible}`, restrictions);

    return { success: true };
  } catch (error) {
    console.error('Failed to set game bonus eligibility:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}