import { badRequestSchema } from '../../utils/constants';
import { createRouter } from '@/config/create-app';
// import { authMiddleware } from "@/middlewares/auth.middleware";
// import { sessionMiddleware } from "@/middlewares/session.middleware";
import { GamesResponseSchema } from './games.schema';
import { createRoute } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent } from 'stoker/openapi/helpers';
import * as controller from './games.controller';
import chalk from 'chalk';
import * as service from './games.service';

// const getGameCategories = createRoute({
//   method: 'get',
//   path: '/games/categories',
//   tags,
//   responses: {
//     200: {
//       description: 'A list of game categories',
//       content: {
//         'application/json': {
//           schema: z.array(z.string()),
//         },
//       },
//     },
//   },
// })
// const getAllGames = createRoute({
//   method: 'get',
//   path: '/games/all',
//   tags,
//   responses: {
//     [HttpStatusCodes.OK]: jsonContent(
//       GamesResponseSchema,
//       'List of all games'
//     ),
//     [HttpStatusCodes.BAD_REQUEST]: jsonContent(badRequestSchema, 'Bad Request'),
//   },
// });
// const getAllGames = createRoute({
//   method: 'get',
//   path: '/games/all',
//   tags,
//   responses: {
//     [HttpStatusCodes.OK]: jsonContent(
//       // GamesSchema,
//       GamesResponseSchema,
//       // z.array(GameSchema),
//       'Top 10 deposits for the authenticated user'
//     ),
//     [HttpStatusCodes.BAD_REQUEST]: jsonContent(badRequestSchema, 'Bad Request'),
//   },
// });
// const checkSession = createRoute({
//   method: 'get',
//   path: '/games/check/session',
//   tags,
//   responses: {
//     [HttpStatusCodes.OK]: jsonContent(
//       z.object({ gameId: z.string() }),
//       'The user object and sets an access token cookie.'
//     ),
//     [HttpStatusCodes.BAD_REQUEST]: jsonContent(badRequestSchema, 'Bad Request'),
//   },
// });

// const searchGames = createRoute({
//   method: 'get',
//   path: '/games/search',
//   tags,
//   request: {
//     query: z.object({
//       game_categories_slug: z.string().optional(),
//       page: z.string().optional(),
//       limit: z.string().optional(),
//     }),
//   },
//   responses: {
//     200: {
//       description: 'A list of games matching the search criteria',
//       content: {
//         'application/json': {
//           schema: z.object({
//             gameId: z.string(),
//           }),
//         },
//       },
//     },
//     [HttpStatusCodes.BAD_REQUEST]: jsonContent(badRequestSchema, 'Bad Request'),
//   },
// });

// const getUserGames = createRoute({
//   method: 'get',
//   path: '/user/games',
//   tags,
//   request: {
//     query: z.object({
//       game_categories_slug: z.string(),
//       page: z.string().optional(),
//       limit: z.string().optional(),
//     }),
//   },
//   responses: {
//     200: {
//       description:
//         'A list of games for the current user (e.g., favorites or history)',
//       content: {
//         'application/json': {
//           schema: z.object({
//             games: z.array(gameResponseSchema), // This might need to be adjusted for history
//             total: z.number(),
//           }),
//         },
//       },
//     },
//   },
// })

// const favoriteGame = createRoute({
//   method: 'post',
//   path: '/user/games/favorite',
//   tags,
//   request: {
//     body: {
//       content: {
//         'application/json': {
//           schema: z.object({
//             add_game: z.string().optional(),
//             del_game: z.string().optional(),
//           }),
//         },
//       },
//     },
//   },
//   responses: {
//     200: {
//       description: 'Success',
//     },
//   },
// })

// const getFavoriteGames = createRoute({
//   method: 'get',
//   path: '/user/games/favorites',
//   tags,
//   responses: {
//     200: {
//       description: 'A list of the user favorite game IDs',
//       content: {
//         'application/json': {
//           schema: z.array(z.string()),
//         },
//       },
//     },
//   },
// })

// const enterGame = createRoute({
//   method: 'post',
//   path: '/games/{id}/enter',
//   middleware: [authMiddleware, sessionMiddleware],
//   tags,
//   request: {
//     params: z.object({
//       id: z.string(),
//     }),
//   },
//   responses: {
//     200: {
//       description: 'Game session details',
//       content: {
//         'application/json': {
//           schema: z.object({
//             webUrl: z
//               .string()
//               .openapi({ example: '/games/nolimit/index.html' }),
//             gameConfig: z
//               .object({
//                 authToken: z.string(),
//                 gameSessionId: z.string(),
//                 userId: z.string(),
//                 gameName: z.string(),
//                 lobbyUrl: z.string(),
//                 depositUrl: z.string(),
//                 operator: z.string().optional(),
//                 provider: z.string().optional(),
//                 lang: z.string().optional(),
//                 currency: z.string().optional(),
//                 mode: z.string().optional(),
//                 device: z.string().optional(),
//                 rgsApiBase: z.string().optional(),
//                 cdn: z.string().optional(),
//                 baseCdn: z.string().optional(),
//               })
//               .openapi({
//                 example: {
//                   authToken: 'jwt-token-here',
//                   gameSessionId: 'session-id-123',
//                   userId: 'user-id-456',
//                   gameName: 'FireInTheHole2',
//                   lobbyUrl: 'https://example.com/lobby',
//                   depositUrl: 'https://example.com/deposit',
//                 },
//               }),
//           }),
//         },
//       },
//       [HttpStatusCodes.BAD_REQUEST]: jsonContent(
//         badRequestSchema,
//         'Bad Request'
//       ),
//       404: {
//         description: 'Not Found',
//         content: {
//           'application/json': {
//             schema: notFoundSchema,
//           },
//         },
//       },
//     },
//   },
// });

// const leaveGame = createRoute({
//   method: 'post',
//   path: '/games/leave',
//   middleware: [authMiddleware, sessionMiddleware],
//   tags,
//   responses: {
//     200: {
//       description: 'Success',
//     },
//   },
// });
// const getTopWins = createRoute({
//   method: 'get',
//   path: '/gamespins/topwins',
//   tags,
//   summary: 'Get the active wallet for the authenticated user',
//   responses: {
//     [HttpStatusCodes.OK]: jsonContent(
//       z.array(GameSpinsSchema),
//       'The list of topwins'
//     ),
//   },
// });

// export const getAllGamesRoute = createRouter().get({

//   method: 'get',
//   path: '/games/all',
//   tags: ['Games'],
//   responses: {
//     [HttpStatusCodes.OK]: jsonContent(
//       GamesResponseSchema,
//       'List of all games'
//     ),
//     [HttpStatusCodes.BAD_REQUEST]: jsonContent(badRequestSchema, 'Bad Request'),
//   },
// },

// )
const router = createRouter().get('/games/all', async (c) => {
  console.log(chalk.yellow('get all games started'));
  const data = await service.findAllGames();
  return c.json(data);
});

export default router;
// const router = createRouter();

// Public routes - no authentication or session required
// router.openapi(getAllGames, controller.getAllGames);
// router.openapi(getGameCategories, controller.getGameCategories as any)
// router.openapi(getAllGamesRoute, controller.getAllGames);
// Routes that require authentication but not a game session
// router.openapi(searchGames, controller.searchGames);
// router.openapi(getUserGames, controller.getUserGames as any)
// router.openapi(favoriteGame, controller.favoriteGame)
// router.openapi(getFavoriteGames, controller.getFavoriteGames as any)

// Routes that require both authentication and a game session
// router.openapi(enterGame, controller.enterGame);
// router.openapi(leaveGame, controller.leaveGame);
// router.openapi(checkSession, controller.checkSession);
// router.openapi(getTopWins, controller.getTopWins);

// export const gameRoutes = router;
