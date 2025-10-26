import { and, eq } from 'drizzle-orm';
import { jackpotManager } from '../services/gameplay/jackpot.service.js';
import {
  games,
  OpenAPIGamesSchema,
  OpenAPIUserSchemaWithoutPassword,
  OpenAPIVipInfoSchema,
  OpenAPIVipRankSchema,
  OpenAPIWalletsSchema,
} from '@@/database/schema/index.js';
import db from '@@/database/index.js';
import type { Settings, Settings, Settings, VipLevel } from '@@/database/schema/index.js';
import { Scalar } from '@scalar/hono-api-reference';
import type { AppOpenAPI } from '../utils/types.js';

/**
 * Admin configuration system for jackpot rates, game groups, and settings
 * Centralized management of all configurable system parameters
 */

// export interface Settings {
//   // Jackpot settings
//   jackpotConfig: {
//     minor: { rate: number; seedAmount: number; maxAmount?: number };
//     major: { rate: number; seedAmount: number; maxAmount?: number };
//     mega: { rate: number; seedAmount: number; maxAmount?: number };
//   };

//   // Game group assignments
//   gameGroups: Record<string, string>; // gameId -> jackpotGroup

//   // VIP settings
//   vipConfig: {
//     pointsPerDollar: number;
//     levelMultipliers: Record<number, number>;
//     costSharingPercentage: number;
//   };

//   // Wagering settings
//   wageringConfig: {
//     defaultWageringMultiplier: number;
//     maxBonusBetPercentage: number;
//     bonusExpiryDays: number;
//   };

//   // System limits
//   limits: {
//     maxBetAmount: number;
//     maxDailyLoss: number;
//     maxSessionLoss: number;
//     minBetAmount: number;
//   };
// }

export interface GameGroupAssignment {
  gameId: string;
  gameName: string;
  currentGroup?: string;
  availableGroups: string[];
}

/**
 * Default system configuration
 */
const DEFAULT_CONFIGURATION: Settings = {
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
};

/**
 * Configuration manager
 */
class ConfigurationManager {
  private static instance: ConfigurationManager | null = null;
  private config: Settings = DEFAULT_CONFIGURATION;
  private lastUpdated: Date = new Date();

  private constructor() {
    // Load configuration asynchronously
    this.loadConfiguration();
  }

  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Load configuration from database
   */
  private async loadConfiguration(): Promise<void> {
    try {
      // In production, this would load from a system_configuration table
      // For now, using defaults with potential database override
      // const settingsRecord = await db.query.settings.findFirst();
      console.log('setting up settings');

      const _settings = await fetch('https://configs.cashflowcasino.com/house/settings.seed.json');
      const settingsRecord = (await _settings.json()) as Settings;
      // await db.insert(settings).values(settings);
      console.log('setting up bonuses');

      if (settingsRecord) {
        // Map and prepare setting data
        const settingsToInsert = settingsRecord.map((setting: Settings) => ({
          id: setting.id,
          name: setting.name,
          referralCodeCount: setting.referralCodeCount,
          referralCommissionRate: setting.referralCommissionRate,
          rates: setting.rates,
          commission: setting.commission,
          jackpotConfig: setting.jackpotConfig,
          gameGroups: setting.jackpotConfig,
          vipConfig: setting.vipConfig,
          wageringConfig: setting.wageringConfig,
          systemLimits: setting.systemLimits,
          createdAt: new Date(setting.createdAt!),
          updatedAt: new Date(setting.updatedAt!),
        }));

        // Prepare VIP levels data
        const vipLevelsToInsert = settingsData.flatMap(
          (setting: Settings) =>
            setting.vipConfig.vipLevels?.map((level: VipLevel) => ({
              id: level.id,
              parentId: '1',
              minXpNeeded: level.xp,
              levelNumber: level.level_name,
              levelName: level.level_name,
              spinBonusMultiplier: level.dailyBonusMultiplier, //.spinBonusMultiplier,
              levelUpBonusAmount: level.dailyBonusMultiplier,
              createdAt: new Date(),
              updatedAt: new Date(),
            })) || [],
        );

        // Insert settings in transaction
        await db.transaction(async (tx) => {
          // Clear existing settings
          await tx.delete(schema.settings);

          // Insert new settings
          await tx.insert(schema.settings).values(settingsToInsert);

          // Insert VIP levels if any
          if (vipLevelsToInsert.length > 0) {
            await tx.delete(schema.vipLevels);
            await tx.insert(schema.vipLevels).values(vipLevelsToInsert);
          }
        });

        updateJackpotConfiguration('minor', settingsToInsert[0]);
        updateJackpotConfiguration('major', settingsToInsert[0]);
        updateJackpotConfiguration('mega', settingsToInsert[0]);

        // Merge database settings with defaults
        this.config = {
          ...DEFAULT_CONFIGURATION,
          jackpotConfig: settingsRecord.commission
            ? {
                ...DEFAULT_CONFIGURATION.jackpotConfig,
                // Map commission settings to jackpot config if needed
              }
            : DEFAULT_CONFIGURATION.jackpotConfig,
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
  getConfiguration(): Settings {
    return { ...this.config };
  }
  configureOpenAPI(app: AppOpenAPI) {
    app.doc('/doc', {
      openapi: '3.0.0',
      // security: [
      //   {
      //     bearerHttpAuthentication: {
      //       type: 'http',
      //       scheme: 'Bearer',
      //       bearerFormat: 'JWT',
      //     }
      //   },
      // ],
      info: {
        version: '1.1.10',
        title: 'CashFlow Casino API',
        description:
          'API for CashFlow Casino platform including user management, VIP system, and wallet operations',
      },
      //  components: {
      //   schemas: {
      //     // Manually define each component
      //     User: UserSchema,
      //     VipRank: VipRankSchema,
      //     Wallet: WalletsSchema,
      //     // ... add all your schemas here
      //   }
      // }
    });
    const registry = app.openAPIRegistry;

    // Temporarily commented out due to OpenAPI metadata issues
    // TODO: Fix OpenAPI schema registration
    registry.register('User', OpenAPIUserSchemaWithoutPassword);
    registry.register('VipInfo', OpenAPIVipInfoSchema);
    registry.register('VipRank', OpenAPIVipRankSchema);
    registry.register('Wallet', OpenAPIWalletsSchema);
    registry.register('Game', OpenAPIGamesSchema);

    app.get(
      '/reference',
      Scalar({
        url: '/doc',
        theme: 'kepler',
        authentication: {
          preferredSecurityScheme: 'httpBearer',
          // securitySchemes: {
          //   httpBearer: {
          //     type: "http",
          //     bearerFormat: "JWT",
          //     nameKey: "Authorization",

          //   }
          //       operty) securitySchemes?: Record<string, PartialDeep<{
          // type: "apiKey";
          // name: string;
          // in: "cookie" | "query" | "header";
          // uid: string & $brand<"securityScheme">;
          // nameKey: string;
          // value: string;
          // description?: stri
          // apiKeyHeader: {
          //     value: 'tokenValue'
          // },
          // httpBearer: {
          //   token: "xyz token value",
          // },

          // httpBasic: {
          //     username: 'username',
          //     password: 'password'
          // },
          // flows: {
          //     authorizationCode: {
          //         token: 'auth code token'
          //     }
          // }
          // layout: "classic",
          // defaultHttpClient: {
          //     targetKey: 'js',
          //     clientKey: 'fetch',
          // },
          // },
        },
      }),
    );
  }
  /**
   * Update jackpot configuration
   */
  async updateJackpotConfig(
    group: 'minor' | 'major' | 'mega',
    updates: Partial<Settings['jackpotConfig']['minor']>,
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
  async loadBonuses() {
    console.log('Seeding bonuses...');

    try {
      const _bonuses = await fetch('https://configs.cashflowcasino.com/house/bonuses.seed.json');
      const bonusesData = await _bonuses.json();

      // Read the JSON file
      // const jsonPath = path.join(__dirname, 'json', 'bonuses.seed.json');
      // const bonusesData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

      // Map and prepare bonus data
      const bonusesToInsert = bonusesData.map((bonus: Bonus) => {
        const expireDate = new Date(bonus.expireDate);
        const now = new Date();

        return {
          id: bonus.id,
          name: bonus.name,
          description: bonus.description,
          option: bonus.option,
          percent: bonus.percent,
          multiply: bonus.multiply,
          bonusCap: bonus.bonusCap,
          minBet: bonus.minBet,
          maxBet: bonus.maxBet,
          slot: bonus.slot,
          casino: bonus.casino,
          status: bonus.status,
          autoCalc: bonus.autoCalc,
          expireDate,
          isExpired: expireDate < now,
          banner: bonus.banner,
          particularData: bonus.particularData,
          createdAt: new Date(bonus.createdAt),
          updatedAt: new Date(bonus.updatedAt),
        };
      });

      // Insert bonuses in transaction
      await db.transaction(async (tx) => {
        // Clear existing bonuses
        await tx.delete(schema.bonuses);

        // Insert new bonuses
        await tx.insert(schema.bonuses).values(bonusesToInsert);
      });

      console.log(`✅ Successfully seeded ${bonusesToInsert.length} bonuses.`);
    } catch (error) {
      console.error('❌ Error seeding bonuses:', error);
      throw error;
    }
  }
  async loadVipLevels() {
    // const vipLevel = vipLevels
    const tableNames = ['vip_levels', 'vip_ranks'];
    console.log('💎 Seeding VIP levels...');
    const truncateQuery = `TRUNCATE TABLE ${tableNames.map((name) => `"${name}"`).join(', ')} RESTART IDENTITY CASCADE;`;

    try {
      const levels: any[] = [];

      for (let n = 0; n <= 6; n++) {
        // const cr = constRanks[n];
        // console.log(cr);
        var r: any;
        // if (cr) r = await db.insert(vipRanks).values(cr).returning();
        if (!r) throw new Error('Failed to insert VIP rank');
        if (!r[0]) throw new Error('Failed to get inserted VIP rank ID');
        // console.log(r);
        for (let i = 1; i <= 10; i++) {
          const level = {
            parentId: r[0].id,
            minXpNeeded: 0, //         Int?     @default(0) @map("min_xp_needed")
            levelNumber: i, //         Int?     @default(0) @map("level_number")
            levelName: `${r[0].name} ${i}`, //           String   @map("level_name")
            // parent              VipRank  @relation(fields: [parentId], references: [id])
            spinBonusMultiplier: 1, // Float?   @default(0.1) @map("spin_bonus_multiplier_id")
            // settingId: setting.id,
            id: nanoid(),
            levelUpBonusAmount: 0,
          };
          levels.push(level);
          // await db.insert(schema.vipLevels).values(level);
        }
        // await db.insert(vipLevels).values(levels);
      }
    } catch (e) {
      console.log(e);
    }
  }
  /**
   * Assign game to jackpot group
   */
  async assignGameToJackpotGroup(
    gameId: string,
    group: 'minor' | 'major' | 'mega' | null,
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
    updates: Partial<Settings['vipConfig']>,
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
    updates: Partial<Settings['wageringConfig']>,
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
    updates: Partial<Settings['limits']>,
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
      // await db
      //   .update(settings)
      //   .set({
      //     commission: this.config.jackpotConfig,
      //     rates: this.config.vipConfig,
      //     updatedAt: new Date().toISOString(),
      //   })
      //   .where(eq(settings.id, "default")); // Assuming a default settings record

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
export const configurationManager = ConfigurationManager.getInstance();

/**
 * Get current system configuration
 */
export async function getSettings(): Promise<Settings> {
  return configurationManager.getConfiguration();
}

/**
 * Update jackpot configuration
 */
export async function updateJackpotConfiguration(
  group: 'minor' | 'major' | 'mega',
  config: Partial<Settings['jackpotConfig']['minor']>,
): Promise<{ success: boolean; error?: string }> {
  return configurationManager.updateJackpotConfig(group, config);
}
/**
 * Assign game to jackpot group
 */
export async function assignGameToJackpotGroup(
  gameId: string,
  group: 'minor' | 'major' | 'mega' | null,
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
        eq(games.status, 'ACTIVE'),
        // eq(games.state, true)
      ),
    });

    const config = configurationManager.getConfiguration();

    return allGames.map((game) => ({
      gameId: game.id,
      gameName: game.name,
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
  config: Partial<Settings['vipConfig']>,
): Promise<{ success: boolean; error?: string }> {
  return configurationManager.updateVIPConfig(config);
}

/**
 * Update wagering configuration
 */
export async function updateWageringConfiguration(
  config: Partial<Settings['wageringConfig']>,
): Promise<{ success: boolean; error?: string }> {
  return configurationManager.updateWageringConfig(config);
}

/**
 * Update system limits
 */
export async function updateSystemLimits(
  limits: Partial<Settings['limits']>,
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
export async function resetConfigurationToDefaults(): Promise<{
  success: boolean;
  error?: string;
}> {
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
export function validateConfiguration(config: Partial<Settings>): {
  valid: boolean;
  errors: string[];
} {
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

  if (
    config.vipConfig?.costSharingPercentage !== undefined &&
    (config.vipConfig.costSharingPercentage < 0 || config.vipConfig.costSharingPercentage > 100)
  ) {
    errors.push('Cost sharing percentage must be between 0 and 100');
  }

  // Validate limits
  if (config.limits) {
    if (
      config.limits.maxBetAmount !== undefined &&
      config.limits.maxBetAmount <= config.limits.minBetAmount
    ) {
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
