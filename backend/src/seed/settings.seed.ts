/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import fs from 'fs';
import path from 'path';
import db from '@backend/database';
import * as schema from '../database/schema';
import { fileURLToPath } from 'url';
import type { Setting, VipLevel} from '../database/interfaces';
import { sql } from 'drizzle-orm';
import { updateJackpotConfiguration } from '@backend/services/configuration.service';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedSettings() {
  console.log('Seeding settings...');
  const tableNames = ['settings', 'vip_levels'];

  const truncateQuery = `TRUNCATE TABLE ${tableNames.map((name) => `"${name}"`).join(', ')} RESTART IDENTITY CASCADE;`;
  await db.execute(sql.raw(truncateQuery));
  try {
    // Read the JSON file
    const jsonPath = path.join(__dirname, 'json', 'settings.seed.json');
    const settingsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    // Map and prepare setting data
    const settingsToInsert = settingsData.map((setting: Setting) => ({
      id: setting.id,
      name: setting.name,
      referralCodeCount: setting.referralCodeCount,
      referralCommissionRate: setting.referralCommissionRate,
      rates: setting.rates,
      commission: setting.commission,
      jackpotConfig: setting.jackpotConfig,
      gameGroups: setting.gameGroups,
      vipConfig: setting.vipConfig,
      wageringConfig: setting.wageringConfig,
      systemLimits: setting.systemLimits,
      createdAt: new Date(setting.createdAt!),
      updatedAt: new Date(setting.updatedAt!),
    }));

    // Prepare VIP levels data
    const vipLevelsToInsert = settingsData.flatMap((setting: Setting) =>
      setting.vipLevels?.map((level: VipLevel) => ({
        id: level.id,
        parentId: '1',
        minXpNeeded: level.minXpNeeded,
        levelNumber: level.levelNumber,
        levelName: level.levelName,
        spinBonusMultiplier: level.spinBonusMultiplier,
        levelUpBonusAmount: level.levelUpBonusAmount,
        createdAt: new Date(level.createdAt!),
        updatedAt: new Date(level.updatedAt!),
      })) || []
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

    console.log(`✅ Successfully seeded ${settingsToInsert.length} settings and ${vipLevelsToInsert.length} VIP levels.`);
  } catch (error) {
    console.error('❌ Error seeding settings:', error);
    throw error;
  }
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSettings()
    .then(() => {
      console.log('Settings seeding completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Settings seeding failed:', error);
      process.exit(1);
    });
}
