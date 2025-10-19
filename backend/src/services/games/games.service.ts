// import { SessionManager } from '@/lib/session.manager';
// import db, { games, gameSpins } from '@cashflow/shared-types';
// import type { User } from '@cashflow/shared-types/';
import chalk from 'chalk';
import { desc, eq, gt, sql } from 'drizzle-orm';
import type { Context } from 'hono';
// import * as defaultConfig from './configs/default.config';
// import * as kickassConfig from './configs/kickass.config';
// import * as netentConfig from './configs/netent.config';
// import * as netgameConfig from './configs/netgame.config';
// import * as nolimitConfig from './configs/nolimit.config';
// import * as redtigerConfig from './configs/redtiger.config';
// import * as SWConfig from './configs/SW.config';

/**
 * Game configuration object containing provider-specific settings
 */
// export interface GameConfig
// {
//   readonly authToken: string;
//   readonly gameSessionId: string;
//   readonly userId: string;
//   readonly gameName: string;
//   readonly lobbyUrl: string;
//   readonly depositUrl: string;
//   readonly operator?: string;
//   readonly provider?: string;
//   readonly lang?: string;
//   readonly currency?: string;
//   readonly mode?: string;
//   readonly device?: string;
//   readonly rgsApiBase?: string;
//   readonly cdn?: string;
//   readonly baseCdn?: string;
// }

// /**
//  * Parameters for entering a game session
//  */
// export interface EnterGameParams
// {
//   readonly context: Context;
//   readonly user: User;
//   readonly gameId: string;
//   readonly token: string;
//   readonly balance: number;
// }

// /**
//  * Result of entering a game session
//  */
// export interface EnterGameResult
// {
//   readonly webUrl: string;
//   readonly gameConfig: GameConfig;
// }

// const developerConfigs: Record<
//   string,
//   { getGameConfig: Function; getWebUrl: Function }
// > = {
//   netent: netentConfig,
//   netgame: netgameConfig,
//   kickass: kickassConfig,
//   SW: SWConfig,
//   nolimit: nolimitConfig,
//   redtiger: redtigerConfig,
// };

export async function findAllGames()
{
  return await db.query.games.findMany({
    columns: {
      id: true,
      name: true,
      title: true,
      category: true,
      developer: true,
      thumbnailUrl: true,
      isFeatured: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: desc(games.name),
  });
}

export async function searchGames(params: {
  game_categories_slug?: string;
  page: number;
  limit: number;
})
{
  const where = params.game_categories_slug
    ? eq(games.category, params.game_categories_slug)
    : undefined;
  const _games = await db.query.games.findMany({
    where,
    limit: params.limit,
    offset: (params.page - 1) * params.limit,
  });
  const totalCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(games)
    .where(where);
  return { games: _games, total: totalCount[0]?.count || 0 };
}

// export async function checkSession(user: User): Promise<string | null>
// {
//   if (!user) {
//     return null;
//   }
//   const sessionId = user.currentGameSessionDataId;
//   if (sessionId === null) {
//     return null;
//   }
//   const result = await SessionManager.getGameSession(sessionId);
//   if (!result) {
//     return null;
//   } else {
//     return result.gameId;
//   }
// }
// /**
//  * Initiates a game session for the authenticated user
//  * @param params - The parameters required to enter a game
//  * @returns The game session details including web URL and configuration, or null if failed
//  */
// export async function enterGame(
//   params: EnterGameParams
// ): Promise<EnterGameResult | null>
// {
//   const { context: c, user, gameId, token, balance } = params;
//   console.log(
//     chalk.yellow(
//       `[DEBUG] Game entry: User=${user.id}, Game=${gameId}, Balance=${balance}`
//     )
//   );

//   // Step 1: Find the game
//   const game = await db.query.games.findFirst({ where: eq(games.id, gameId) });
//   if (!game) {
//     console.log(chalk.red(`[DEBUG] ❌ Game not found: ${gameId}`));
//     return null;
//   }

//   // Step 2: Start game session
//   const result = await SessionManager.startGameSession(c, game.name);
//   if (!result) {
//     console.log(
//       chalk.red(`[DEBUG] ❌ Session creation failed for game: ${game.name}`)
//     );
//     return null;
//   }

//   // Step 3: Get configuration
//   const config = developerConfigs[game.developer] || defaultConfig;
//   // Generate the clean URL and the rich config object
//   const webUrl = config.getWebUrl(game);
//   const gameConfig = config.getGameConfig(user, game, token, result, balance);

//   console.log(chalk.green(`[DEBUG] ✅ Game entry success: ${webUrl}`));
//   return { webUrl, gameConfig };
// }

// export function leaveGame(authSessionId: string)
// {
//   // This logic would involve updating the game session status to COMPLETED or ABANDONED
//   // and persisting any final data from cache to the database.
//   console.log(`Leaving game for auth session: ${authSessionId}`);
// }

// export async function findTopWins()
// {
//   const result = await db
//     .select()
//     .from(gameSpins)
//     .where(gt(gameSpins.grossWinAmount, 1))
//     .orderBy(desc(gameSpins.grossWinAmount), desc(gameSpins.createdAt));

//   // Group by playerName and gameName for equal distribution
//   const groupedByPlayerAndGame = new Map<string, any[]>();

//   result.forEach((spin) =>
//   {
//     const key = `${spin.playerName}-${spin.gameName}`;
//     if (!groupedByPlayerAndGame.has(key)) {
//       groupedByPlayerAndGame.set(key, []);
//     }
//     groupedByPlayerAndGame.get(key)!.push(spin);
//   });

//   const games: any[] = [];
//   const maxPerGroup = 3; // Limit entries per player-game combination

//   // First pass: take top entries from each group for distribution
//   for (const spins of groupedByPlayerAndGame.values()) {
//     // Sort by grossWinAmount desc, then createdAt desc
//     spins.sort(
//       (a, b) =>
//         b.grossWinAmount - a.grossWinAmount ||
//         new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//     );

//     // Take up to maxPerGroup from this combination
//     const entriesToAdd = spins.slice(0, maxPerGroup);
//     games.push(...entriesToAdd);
//   }

//   // Sort final results by grossWinAmount desc, then createdAt desc
//   games.sort(
//     (a, b) =>
//       b.grossWinAmount - a.grossWinAmount ||
//       new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//   );

//   // Limit to 30 results
//   return games.slice(0, 30);
// }
