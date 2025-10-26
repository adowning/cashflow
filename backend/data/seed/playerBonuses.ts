// seed/playerBonuses.seed.ts
import { rand, randNumber } from '@ngneat/falso';
import db from '../database/index';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';
import  { nanoid } from 'nanoid';

/**
 * Seeds player bonuses, ensuring each player receives a Welcome Bonus
 * and 1-2 other random bonuses.
 */
export async function seedPlayerBonuses() {
  console.log('🎁 Seeding player bonuses...');

  const allPlayers = await db.select({ id: schema.players.id }).from(schema.players);
  const allBonuses = await db.select().from(schema.bonuses);

  if (allPlayers.length === 0) {
    console.log('- No players found. Skipping player bonus seeding.');
    return;
  }
  if (allBonuses.length === 0) {
    console.log('- No bonuses found. Skipping player bonus seeding.');
    return;
  }

  const welcomeBonus = allBonuses.find(b => b.name === 'Welcome Bonus');
  if (!welcomeBonus) {
    console.warn('- Warning: \'Welcome Bonus\' not found. Players will not be assigned a welcome bonus.');
  }

  // Filter out the welcome bonus from the list of random bonuses to assign
  const otherBonuses = allBonuses.filter(b => b.name !== 'Welcome Bonus');
  const playerBonusesToInsert: (typeof schema.playerBonuses.$inferInsert)[] = [];

  for (const player of allPlayers) {
    // 1. Assign the Welcome Bonus to every player
    if (welcomeBonus) {
      playerBonusesToInsert.push({
        id: nanoid(),
        playerId: player.id,
        bonusId: welcomeBonus.id,
        status: 'active',
        amount: welcomeBonus.bonusCap,
        goalAmount: welcomeBonus.bonusCap * welcomeBonus.multiply,
        processAmount: 0,
        betsIds: [],
        updatedAt: new Date()
      });
    }

    // 2. Assign 1 or 2 additional random bonuses
    const numberOfRandomBonuses = randNumber({ min: 1, max: 2 });
    const assignedBonuses = new Set<string>(); // To prevent assigning the same bonus twice

    for (let i = 0; i < numberOfRandomBonuses; i++) {
      const randomBonus = rand(otherBonuses);
      if (randomBonus && !assignedBonuses.has(randomBonus.id)) {
        playerBonusesToInsert.push({
          id: nanoid(),
          playerId: player.id,
          bonusId: randomBonus.id,
          status: rand(['pending', 'active', 'completed']),
          amount: randomBonus.bonusCap,
          goalAmount: randomBonus.bonusCap * randomBonus.multiply,
          processAmount: 0,
          betsIds: [],
          updatedAt: new Date()
        });
        assignedBonuses.add(randomBonus.id);
      }
    }
  }

  if (playerBonusesToInsert.length > 0) {
    await db.transaction(async (tx) => {
      // Clear existing player bonuses before inserting new ones
      await tx.delete(schema.playerBonuses);
      await tx.insert(schema.playerBonuses).values(playerBonusesToInsert);
    });
    console.log(`✅ Seeded ${playerBonusesToInsert.length} player bonuses for ${allPlayers.length} players.`);
  } else {
    console.log('- No player bonuses to seed.');
  }
}