/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import fs from 'fs';
import path from 'path';
import db from '../database/index';
import * as schema from '../database/schema';

export async function seedBonuses() {
  console.log('Seeding bonuses...');

  try {
    // Read the JSON file
    const jsonPath = path.join(__dirname, 'json', 'bonuses.seed.json');
    const bonusesData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

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

// Allow running this script directly
if (require.main === module) {
  seedBonuses()
    .then(() => {
      console.log('Bonuses seeding completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Bonuses seeding failed:', error);
      process.exit(1);
    });
}
