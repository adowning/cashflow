import type { Settings } from "@/database/schema/other.schema.js";

/**
 * Mock Configuration Manager
 * Provides default settings since the real one wasn't provided.
 */
class ConfigurationManager {
  private settings: Settings;

  constructor() {
    // Load default settings
    this.settings = {
      id: "default-settings",
      name: "Default Settings",
      default: true,
      referralCodeCount: 5,
      depositWRMultiplier: 1, // 1x deposit wagering
      bonusWRMultiplier: 30, // 30x bonus wagering
      freeSpinWRMultiplier: 30, // 30x free spin win wagering
      avgFreeSpinWinValue: 15, // 15 cents avg free spin win
      referralCommissionRate: 0.1,
      rates: { master: 0.1, affiliate: 0.7, subaffiliate: 0.3 },
      commission: { master: 0.3, affiliate: 0.2, subAffiliate: 0.1 },
      jackpotConfig: {
        minor: { rate: 0.01, seedAmount: 1000, maxAmount: 10000 },
        major: { rate: 0.005, seedAmount: 10000, maxAmount: 100000 },
        mega: { rate: 0.001, seedAmount: 100000, maxAmount: 1000000 },
      },
      vipConfig: {
        pointsPerDollar: 1,
        levelMultipliers: {},
        costSharingPercentage: 0,
        vipLevels: [],
        vipRanks: [],
      },
      wageringConfig: {
        defaultWageringMultiplier: 30,
        maxBonusBetPercentage: 0.1,
        bonusExpiryDays: 30,
      },
      systemLimits: {
        maxBetAmount: 100000,
        maxDailyLoss: 1000000,
        maxSessionLoss: 500000,
        minBetAmount: 10,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  getConfiguration(): Settings {
    // In a real app, this might fetch from DB or cache
    return this.settings;
  }
}

export const configurationManager = new ConfigurationManager();
