import db from '@backend/database';
import { eq, and } from 'drizzle-orm';
import { jackpotManager } from './jackpot.service.js';
import type { settings, games } from '@backend/database/schema.js';

/**
 * Admin configuration system for jackpot rates, game groups, and settings
 * Centralized management of all configurable system parameters
 */

export interface SystemConfiguration {
  // Jackpot settings
  jackpotConfig: {
    minor: { rate: number; seedAmount: number; maxAmount?: number };
    major: { rate: number; seedAmount: number; maxAmount?: number };
    mega: { rate: number; seedAmount: number; maxAmount?: number };
  };

  // Game group assignments
  gameGroups: Record<string, string>; // gameId -> jackpotGroup

  // VIP settings
  vipConfig: {
    pointsPerDollar: number;
    levelMultipliers: Record<number, number>;
    costSharingPercentage: number;
  };

  // Wagering settings
  wageringConfig: {
    defaultWageringMultiplier: number;
    maxBonusBetPercentage: number;
    bonusExpiryDays: number;
  };

  // System limits
  limits: {
    maxBetAmount: number;
    maxDailyLoss: number;
    maxSessionLoss: number;
    minBetAmount: number;
  };
  jwt:{
    secret: string
  }
}

export interface GameGroupAssignment {
  gameId: string;
  gameName: string;
  currentGroup?: string;
  availableGroups: string[];
}

/**
 * Default system configuration
 */
const DEFAULT_CONFIGURATION: SystemConfiguration = {
  jackpotConfig: {
    minor: { rate: 0.02, seedAmount: 100000, maxAmount: 1000000 },
    major: { rate: 0.01, seedAmount: 1000000, maxAmount: 10000000 },
    mega: { rate: 0.005, seedAmount: 10000000, maxAmount: 100000000 },
  },
  gameGroups: {},
  vipConfig: {
    pointsPerDollar: 1,
    levelMultipliers: { 1: 1.0, 2: 1.2, 3: 1.5, 4: 2.0, 5: 2.5 },
    costSharingPercentage: 20,
  },
  wageringConfig: {
    defaultWageringMultiplier: 30,
    maxBonusBetPercentage: 50,
    bonusExpiryDays: 30,
  },
  limits: {
    maxBetAmount: 100000,
    maxDailyLoss: 1000000,
    maxSessionLoss: 100000,
    minBetAmount: 100,
  },
  jwt:{
    secret: process.env.JWT_SECRET || 'default_secret'
  }
};

/**
 * Configuration manager
 */
class ConfigurationManager {
  private config: SystemConfiguration = DEFAULT_CONFIGURATION;
  private lastUpdated: Date = new Date();

  constructor() {
    this.loadConfiguration();
  }

  /**
   * Load configuration from database
   */
  private async loadConfiguration(): Promise<void> {
    try {
      // In production, this would load from a system_configuration table
      // For now, using defaults with potential database override
      const settingsRecord = await db.query.settings.findFirst();

      if (settingsRecord) {
        // Merge database settings with defaults
        this.config = {
          ...DEFAULT_CONFIGURATION,
          jackpotConfig: settingsRecord.commission ? {
            ...DEFAULT_CONFIGURATION.jackpotConfig,
            // Map commission settings to jackpot config if needed
          } : DEFAULT_CONFIGURATION.jackpotConfig,
        };
      }

      this.lastUpdated = new Date();
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): SystemConfiguration {
    return { ...this.config };
  }

  /**
   * Update jackpot configuration
   */
  async updateJackpotConfig(
    group: 'minor' | 'major' | 'mega',
    updates: Partial<SystemConfiguration['jackpotConfig']['minor']>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.config.jackpotConfig[group] = {
        ...this.config.jackpotConfig[group],
        ...updates,
      };

      // Update jackpot manager
      jackpotManager.updateConfig(this.config.jackpotConfig);

      // Persist to database
      await this.persistConfiguration();

      return { success: true };
    } catch (error) {
      console.error('Failed to update jackpot config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Assign game to jackpot group
   */
  async assignGameToJackpotGroup(
    gameId: string,
    group: 'minor' | 'major' | 'mega' | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (group) {
        this.config.gameGroups[gameId] = group;
      } else {
        delete this.config.gameGroups[gameId];
      }

      await this.persistConfiguration();

      return { success: true };
    } catch (error) {
      console.error('Failed to assign game to jackpot group:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update VIP configuration
   */
  async updateVIPConfig(
    updates: Partial<SystemConfiguration['vipConfig']>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.config.vipConfig = {
        ...this.config.vipConfig,
        ...updates,
      };

      await this.persistConfiguration();

      return { success: true };
    } catch (error) {
      console.error('Failed to update VIP config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update wagering configuration
   */
  async updateWageringConfig(
    updates: Partial<SystemConfiguration['wageringConfig']>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.config.wageringConfig = {
        ...this.config.wageringConfig,
        ...updates,
      };

      await this.persistConfiguration();

      return { success: true };
    } catch (error) {
      console.error('Failed to update wagering config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update system limits
   */
  async updateLimits(
    updates: Partial<SystemConfiguration['limits']>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.config.limits = {
        ...this.config.limits,
        ...updates,
      };

      await this.persistConfiguration();

      return { success: true };
    } catch (error) {
      console.error('Failed to update limits:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Persist configuration to database
   */
  private async persistConfiguration(): Promise<void> {
    try {
      // In production, this would update a system_configuration table
      // For now, updating the existing settings table
      await db
        .update(settings)
        .set({
          commission: this.config.jackpotConfig,
          rates: this.config.vipConfig,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(settings.id, 'default')); // Assuming a default settings record

      this.lastUpdated = new Date();
    } catch (error) {
      console.error('Failed to persist configuration:', error);
      throw error;
    }
  }

  /**
   * Get configuration last updated time
   */
  getLastUpdated(): Date {
    return this.lastUpdated;
  }
}

// Global configuration manager
export const configurationManager = new ConfigurationManager();

/**
 * Get current system configuration
 */
export async function getSystemConfiguration(): Promise<SystemConfiguration> {
  return configurationManager.getConfiguration();
}

/**
 * Update jackpot configuration
 */
export async function updateJackpotConfiguration(
  group: 'minor' | 'major' | 'mega',
  config: Partial<SystemConfiguration['jackpotConfig']['minor']>
): Promise<{ success: boolean; error?: string }> {
  return configurationManager.updateJackpotConfig(group, config);
}

/**
 * Assign game to jackpot group
 */
export async function assignGameToJackpotGroup(
  gameId: string,
  group: 'minor' | 'major' | 'mega' | null
): Promise<{ success: boolean; error?: string }> {
  return configurationManager.assignGameToJackpotGroup(gameId, group);
}

/**
 * Get game group assignment
 */
export async function getGameGroupAssignment(gameId: string): Promise<string | null> {
  const config = configurationManager.getConfiguration();
  return config.gameGroups[gameId] || null;
}

/**
 * Get all game group assignments for admin
 */
export async function getAllGameGroupAssignments(): Promise<GameGroupAssignment[]> {
  try {
    const allGames = await db.query.games.findMany({
      where: and(
        eq(games.status, 'active'),
        eq(games.state, true)
      ),
    });

    const config = configurationManager.getConfiguration();

    return allGames.map(game => ({
      gameId: game.id,
      gameName: game.gameName,
      currentGroup: config.gameGroups[game.id] || null,
      availableGroups: ['minor', 'major', 'mega'],
    }));
  } catch (error) {
    console.error('Failed to get game group assignments:', error);
    return [];
  }
}

/**
 * Update VIP configuration
 */
export async function updateVIPConfiguration(
  config: Partial<SystemConfiguration['vipConfig']>
): Promise<{ success: boolean; error?: string }> {
  return configurationManager.updateVIPConfig(config);
}

/**
 * Update wagering configuration
 */
export async function updateWageringConfiguration(
  config: Partial<SystemConfiguration['wageringConfig']>
): Promise<{ success: boolean; error?: string }> {
  return configurationManager.updateWageringConfig(config);
}

/**
 * Update system limits
 */
export async function updateSystemLimits(
  limits: Partial<SystemConfiguration['limits']>
): Promise<{ success: boolean; error?: string }> {
  return configurationManager.updateLimits(limits);
}

/**
 * Get configuration summary for admin dashboard
 */
export async function getConfigurationSummary(): Promise<{
  jackpotPools: any;
  activeGames: number;
  gamesWithJackpots: number;
  lastUpdated: Date;
  vipLevels: number;
}> {
  const config = configurationManager.getConfiguration();
  const allAssignments = await getAllGameGroupAssignments();

  return {
    jackpotPools: jackpotManager.getAllPools(),
    activeGames: allAssignments.length,
    gamesWithJackpots: Object.keys(config.gameGroups).length,
    lastUpdated: configurationManager.getLastUpdated(),
    vipLevels: Object.keys(config.vipConfig.levelMultipliers).length,
  };
}

/**
 * Reset configuration to defaults (admin function)
 */
export async function resetConfigurationToDefaults(): Promise<{ success: boolean; error?: string }> {
  try {
    // Reset to default configuration
    configurationManager['config'] = { ...DEFAULT_CONFIGURATION };
    configurationManager['lastUpdated'] = new Date();

    // Reset jackpot manager
    jackpotManager.updateConfig(DEFAULT_CONFIGURATION.jackpotConfig);

    // Clear game group assignments
    configurationManager['config'].gameGroups = {};

    await configurationManager['persistConfiguration']();

    return { success: true };
  } catch (error) {
    console.error('Failed to reset configuration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate configuration before applying
 */
export function validateConfiguration(
  config: Partial<SystemConfiguration>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate jackpot rates
  if (config.jackpotConfig) {
    for (const [group, groupConfig] of Object.entries(config.jackpotConfig)) {
      if (groupConfig.rate !== undefined && (groupConfig.rate < 0 || groupConfig.rate > 1)) {
        errors.push(`Jackpot rate for ${group} must be between 0 and 1`);
      }

      if (groupConfig.seedAmount !== undefined && groupConfig.seedAmount < 0) {
        errors.push(`Seed amount for ${group} must be positive`);
      }

      if (groupConfig.maxAmount !== undefined && groupConfig.maxAmount <= groupConfig.seedAmount) {
        errors.push(`Max amount for ${group} must be greater than seed amount`);
      }
    }
  }

  // Validate VIP config
  if (config.vipConfig?.pointsPerDollar !== undefined && config.vipConfig.pointsPerDollar < 0) {
    errors.push('VIP points per dollar must be positive');
  }

  if (config.vipConfig?.costSharingPercentage !== undefined &&
      (config.vipConfig.costSharingPercentage < 0 || config.vipConfig.costSharingPercentage > 100)) {
    errors.push('Cost sharing percentage must be between 0 and 100');
  }

  // Validate limits
  if (config.limits) {
    if (config.limits.maxBetAmount !== undefined && config.limits.maxBetAmount <= config.limits.minBetAmount) {
      errors.push('Max bet amount must be greater than min bet amount');
    }

    if (config.limits.minBetAmount !== undefined && config.limits.minBetAmount <= 0) {
      errors.push('Min bet amount must be positive');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}