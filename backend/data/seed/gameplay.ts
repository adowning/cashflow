import { rand, randAmount, randNumber, randPastDate } from '@ngneat/falso';
import {
  type BetOutcome,
  type BetRequest,
  processBet,
  processBetOutcome,
} from '../services/gameplay/bet-orchestration.service';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import db from '../database/index';
import * as schema from '../database/schema';

export async function seedGameSpins(operatorId: string) {
  console.log('🔄 Seeding game sessions and spins...');

  const userSessions = await db.query.authSessions.findMany({ limit: 10 });
  const allPlayers = await db.query.players.findMany();
  const allGames = await db.query.games.findMany({
    columns: { id: true, name: true },
  });

  if (userSessions.length === 0 || allGames.length === 0) {
    console.log('⚠️ Cannot seed game sessions without auth sessions and games. Skipping.');
    return;
  }

  const sessionsToInsert: (typeof schema.gameSessions.$inferInsert)[] = [];
  for (const userSession of userSessions) {
    const player = allPlayers.find((id) => userSession.userId);
    console.log(player);
    const sessionCount = randNumber({ min: 1, max: 5 });
    for (let i = 0; i < sessionCount; i++) {
      const createdAt = randPastDate({ years: 1 });
      const g = rand(allGames) as any;
      const sessionData: typeof schema.gameSessions.$inferInsert = {
        id: nanoid(),
        playerId: userSession.userId,
        authSessionId: userSession.id as string,
        gameId: g.id,
        // invitorId: player?.invitorId,
        status: 'ACTIVE',
        gameName: g.name,
        createdAt: createdAt,

        // endAt: new Date(createdAt.getTime() + randNumber({ min: 60000, max: 3600000 })),
        expiredTime: new Date(createdAt.getTime() + randNumber({ min: 60000, max: 3600000 })),
      };
      sessionsToInsert.push(sessionData);
    }
  }

  if (sessionsToInsert.length === 0) {
    console.log('ℹ️ No new game sessions to seed.');
    return;
  }

  console.log(`🌱 Creating ${sessionsToInsert.length} game sessions...`);
  const createdSessions = await db.insert(schema.gameSessions).values(sessionsToInsert).returning();

  const spinsToInsert: any[] = [];

  for (const session of createdSessions) {
    const spinCount = randNumber({ min: 1, max: 5 });
    const user = await db.query.players.findFirst({
      where: (users, { eq }) => eq(schema.players.id, session.playerId),
    });
    const game = allGames.find((g) => g.id === session.gameId);

    if (!user || !game) {
      throw new Error('no game found');
    }

    // Ensure user has sufficient balance for betting
    const existingBalances = await db.query.balances.findFirst({
      where: (balances, { eq }) => eq(schema.balances.playerId, user.id),
    });

    if (existingBalances) {
      // Update existing balances with sufficient balance if needed
      const minBalance = 100000; // $1000 in cents
      console.log(
        'DEBUG: Checking if balance needs update:',
        existingBalances.realBalance,
        '<',
        minBalance,
      );
      if (existingBalances.realBalance < minBalance) {
        await db
          .update(schema.balances)
          .set({ realBalance: minBalance })
          .where(eq(schema.balances.playerId, existingBalances.playerId));

        // Also update the balances table
        await db
          .update(schema.balances)
          .set({
            realBalance: minBalance,
            // amount: minBalance,

            // withdrawable: minBalance,
            // updatedAt: new Date(),
          })
          .where(eq(schema.balances.playerId, existingBalances.playerId));
      }
    } else {
      // Create new balances with sufficient balance
      console.log('DEBUG: Creating new balance for player:', user.id);
      const initialBalance = 100000; // $1000 in cents

      await db.insert(schema.balances).values({
        playerId: user.id,
        realBalance: initialBalance,
        bonusBalance: 0,
        turnover: 0,
        withdrawable: initialBalance,
        pending: 0,
        updatedAt: new Date(),
      });
    }

    for (let i = 0; i < spinCount; i++) {
      // const wagerAmount = randFloat({ min: 0.1, max: 5, fraction: 2 }) * 100
      const wagerAmount = Math.floor(randAmount({ min: 1, max: 10, fraction: 2 }) * 100);
      const grossWinAmount = Math.floor(
        rand([0, 0, 0, randAmount({ min: 10, max: 100, fraction: 2 })]) * 100,
      );
      const player = allPlayers.find((id) => user.id);
      if (!player) throw new Error('no player');
      spinsToInsert.push({
        playerName: user.playername,
        gameName: game.name,
        spinData: `${game.name}::${grossWinAmount}`, //{ lines: 10, multiplier: grossWinAmount > 0 ? grossWinAmount / wagerAmount : 0 },
        grossWinAmount,
        wagerAmount,
        invitorId: player.invitorId,
        operatorId,
        gameId: game.id,
        spinNumber: i + 1,
        playerAvatar: user.avatarUrl,
        sessionId: session.id,
        userId: user.id,
        occurredAt: randPastDate({ years: 1 }),
      });
    }
  }
  // export interface BetRequest
  // {
  //   userId: string;
  //   gameId: string;
  //   wagerAmount: number; // Amount in cents
  //   operatorId?: string;
  //   sessionId?: string;
  //   affiliateId?: string;
  // }

  // export interface BetOutcome
  // {
  //   userId: string;
  //   gameId: string;
  //   wagerAmount: number;
  //   winAmount: number;
  //   balanceType: 'real' | 'bonus' | 'mixed';
  //   newBalance: number;

  //   // System contributions
  //   jackpotContribution: number;
  //   vipPointsEarned: number;
  //   ggrContribution: number;

  //   // Status
  //   success: boolean;
  //   error?: string;

  //   // Metadata
  //   transactionId?: string;
  //   processingTime: number;
  // }
  if (spinsToInsert.length > 0) {
    console.log('Starting bet processing loop...');
    for await (const spin of spinsToInsert) {
      console.log('Processing spin:', {
        userId: spin.userId,
        gameId: spin.gameId,
        wagerAmount: spin.wagerAmount,
        grossWinAmount: spin.grossWinAmount,
      });

      const br: BetRequest = {
        userId: spin.userId as string,
        gameId: spin.gameId as string,
        wagerAmount: spin.wagerAmount as number,
        operatorId: spin.operatorId as string,
        sessionId: spin.sessionId as string,
        affiliateId: spin.invitorId,
      };
      if (!spin.wagerAmount) throw new Error();

      const bo: BetOutcome = {
        userId: spin.userId as string,
        gameId: spin.gameId as string,
        wagerAmount: spin.wagerAmount as number,
        winAmount: spin.grossWinAmount,
        balanceType: rand(['bonus', 'real']),
        newBalance: 0,
        jackpotContribution: rand([0, 0, 0, 0, 0, 0.01, 0.02, 0.05, 0.1]),
        vipPointsEarned: (spin.wagerAmount * 1 + spin.grossWinAmount) & 2,
        ggrContribution: 5,
        success: true,
        processingTime: Date.now(),
      };
      const pbo: BetOutcome = await processBetOutcome(br, bo);
      if (!pbo.success) throw new Error(pbo.error);
      console.log(pbo);
      // await processBet(br, bo)
      // DO NOT CHANGE THE NEXT 3 LINES
      if (!pbo.success) {
        process.exit;
      }
    }
    // await db.insert(gameSpins).values(spinsToInsert);

    console.log(`✅ Seeded ${spinsToInsert.length} game spins.`);
  } else {
    console.log('ℹ️  No new game spins to seed.');
  }
}
