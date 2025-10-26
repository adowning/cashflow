import chalk from 'chalk';
import type { Context } from 'hono';
// import { AuthSessionType } from "~/types";
import type { AppRouteHandler } from '../../utils/types';
import * as service from './games.service';
import type { getAllGamesRoute } from './games.router';
// export function getGameCategories(c: Context) {
//   const data = service.findGameCategories()
//   return c.json(data)
// }

// export async function getAllGames(c: Context)
// {
//   console.log(chalk.yellow('get all games started'));
//   const data = await service.findAllGames();
//   return c.json(data);
// }
export const getAllGames: AppRouteHandler<typeof getAllGamesRoute> = async (c) => {
  console.log(chalk.yellow('get all games started'));
  const data = await service.findAllGames();
  return c.json(data);
};

export async function searchGames(c: Context) {
  const { game_categories_slug, page, limit } = c.req.query();
  const data = await service.searchGames({
    game_categories_slug,
    page: page ? Number.parseInt(page) : 1,
    limit: limit ? Number.parseInt(limit) : 10,
  });
  return c.json(data);
}

// export async function getUserGames(c: Context) {
//   const { game_categories_slug, page, limit } = c.req.query()
//   const user = c.get('user') as User
//   const data = await service.findUserGames(user.id, {
//     game_categories_slug,
//     page: page ? Number.parseInt(page) : 1,
//     limit: limit ? Number.parseInt(limit) : 10,
//   })
//   return c.json(data)
// }

// export async function favoriteGame(c: Context) {
//   const user = c.get('user') as User
//   const { add_game, del_game } = await c.req.json()
//   if (add_game) {
//     await service.addFavoriteGame(user.id, add_game)
//   } else if (del_game) {
//     await service.removeFavoriteGame(user.id, del_game)
//   }
//   return c.json({ message: 'Success' })
// }

// export async function getFavoriteGames(c: Context) {
//   const user = c.get('user') as User
//   const data = await service.findFavoriteGames(user.id)
//   return c.json(data)
// }

// export const enterGame: AppRouteHandler<any> = async (c) =>
// {
//   console.log(chalk.blue('=== enterGame function called ==='));
//   console.log(
//     chalk.blue(
//       'Type validation: AppRouteHandler<EnterGameRoute> applied successfully'
//     )
//   );

//   const user = c.get('user') as User;
//   const authSession = c.get('authSession') as AuthSessions;
//   // const token = c.get("token") as unknown as string;
//   const token = authSession.phpToken || 'token';
//   const gameId = c.req.param('id');
//   const wallet = c.get('wallet');
//   const balance = wallet.balance;
//   console.log(
//     chalk.blue(
//       `Game entry request - User ID: ${user.id}, Game ID: ${gameId}, Balance: ${balance}`
//     )
//   );
//   const data = await service.enterGame({ context: c, user, gameId, token, balance });
//   if (data === null) {
//     console.log(chalk.red('Game entry failed: data is null'));
//     return c.json(
//       { message: HttpStatusPhrases.BAD_REQUEST },
//       HttpStatusCodes.BAD_REQUEST
//     );
//   }
//   if (!data.gameConfig) {
//     console.log(chalk.red('Game entry failed: gameConfig is missing'));
//     return c.json(
//       { message: HttpStatusPhrases.BAD_REQUEST },
//       HttpStatusCodes.BAD_REQUEST
//     );
//   }
//   console.log(chalk.yellow('enter game ended webUrl: ', data.webUrl));
//   console.log(
//     chalk.green('Game entry successful - returning 200 response with game data')
//   );
//   return c.json(
//     { webUrl: data.webUrl as string, gameConfig: data.gameConfig },
//     200
//   );
// };

// export async function checkSession(c: Context)
// {
//   const user = c.get('user') as User;
//   const data = await service.checkSession(user);
//   if (data === null) {
//     return c.json(
//       { message: HttpStatusPhrases.BAD_REQUEST },
//       HttpStatusCodes.BAD_REQUEST
//     );
//   } else {
//     return c.json({ gameId: data }, 200);
//   }
// }
// export async function leaveGame(c: Context)
// {
//   const authSession = c.get('authSession') as AuthSessions;
//   await service.leaveGame(authSession.id);
//   return c.json({ message: 'Success' });
// }

// export async function getGameHistory(c: Context) {
//   const user = c.get('user') as User
//   const data = await service.findGameHistory(user.id)
//   return c.json(data)
// }
// export async function topWins(c: Context) {
//   const data = await service.findTopWins()
//   return c.json(data)
// }
