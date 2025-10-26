// seed/jackpots.ts
import { eq } from 'drizzle-orm';
import { rand } from '@ngneat/falso';
import db from '../database/index';
import * as schema from '../database/schema';

/**
 * Seeds three jackpot groups (Mega, Major, Minor), and then randomly
 * assigns every game in the database to one of these jackpots.
 */
export async function seedJackpots() {
  console.log('- Seeding jackpot groups...');

  // Define the jackpot types to create
  const jackpotTypes = ['MEGA', 'MAJOR', 'MINOR'];
  const createdJackpots = [];

  // Use a transaction to ensure all or nothing is created
  await db.transaction(async (tx) => {
    // 1. Delete existing jackpots to prevent duplicates on re-seed
    await tx.delete(schema.jackpots);

    // 2. Create the new jackpot groups
    for (const type of jackpotTypes) {
      const [newJackpot] = await tx
        .insert(schema.jackpots)
        .values({
          id: `jackpot_${type.toLowerCase()}`, // Deterministic ID
          type: type,
          currentAmountCoins: 100000, // Example starting amount in cents
          seedAmountCoins: 10000,
          contributionRateBasisPoints: 100, // 1% contribution rate
          probabilityPerMillion: 100,
          minimumTimeBetweenWinsMinutes: 60,
          isActive: true,
        })
        .returning();
      createdJackpots.push(newJackpot);
      console.log(`  - Created ${type} jackpot`);
    }
  });

  console.log('- Assigning games to jackpot groups...');
  const allGames = await db.select({ id: schema.games.id }).from(schema.games);
  let updatedCount = 0;

  // 3. Update each game to belong to a random jackpot group
  for (const game of allGames) {
    const randomJackpot: any[] = rand(createdJackpots);
    if (randomJackpot && randomJackpot.id) {
      await db
        .update(schema.games)
        .set({ jpgIds: [randomJackpot.id] }) // Assigning the jackpot ID to the jpgIds array
        .where(eq(schema.games.id, game.id));
      updatedCount++;
    }
  }

  console.log(`- Assigned ${updatedCount} games to jackpot groups.`);
  console.log('✅ Jackpot seeding complete.');

  return createdJackpots;
}