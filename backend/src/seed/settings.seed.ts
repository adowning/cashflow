/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import fs from 'fs';
import path from 'path';
import db from '../database/index';
import * as schema from '../types';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedSettings() {
  console.log('Seeding settings...');

  try {
    // Read the JSON file
    const jsonPath = path.join(__dirname, 'json', 'settings.seed.json');
    const settingsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    // Map and prepare setting data
    const settingsToInsert = settingsData.map((setting: any) => ({
      name: setting.name,
      referralCodeCount: setting.referralCodeCount,
      referralCommissionRate: setting.referralCommissionRate,
      rates: setting.rates,
      createdAt: new Date(setting.createdAt),
      updatedAt: new Date(setting.updatedAt),
    }));

    // Insert settings in transaction
    await db.transaction(async (tx) => {
      // Clear existing settings
      await tx.delete(schema.settings);

      // Insert new settings
      await tx.insert(schema.settings).values(settingsToInsert);
    });

    console.log(`✅ Successfully seeded ${settingsToInsert.length} settings.`);
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