import type { AppOpenAPI } from '@@/lib/utils/types';
import { createRoute, z } from '@hono/zod-openapi';
import * as controller from '../controllers/player.controller.v2';
import {
  CreateBonusRequestSchema,
  CreateWithdrawalRequestSchema,
  ErrorResponseSchema,
  KycStatusResponseSchema,
  PlayerBalanceResponseSchema,
  PlayerGamesResponseSchema,
  PlayerTransactionsResponseSchema,
  SuccessResponseSchema,
  UpdateAvatarRequestSchema,
  UpdateCurrencyRequestSchema,
  UpdatePasswordRequestSchema,
  UpdateUsernameRequestSchema,
} from '../schema/player.schema';

export const getPlayerBalanceRoute = createRoute({
  method: 'get',
  path: '/balance',
  operationId: 'getPlayerBalance',
  tags: ['User'],
  summary: 'Get Player Balance',
  description:
    'Retrieves the current balance and currency information for the authenticated player.',
  responses: {
    200: {
      description: 'Player balance retrieved successfully.',
      content: {
        'application/json': {
          schema: PlayerBalanceResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request - Invalid parameters or missing authentication.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    500: {
      description: 'Internal Server Error - Failed to retrieve player balance.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const updateUsernameRoute = createRoute({
  method: 'patch',
  path: '/username',
  operationId: 'updatePlayerUsername',
  tags: ['User'],
  summary: 'Update Player Username',
  description:
    'Allows the authenticated player to change their display name. The username must be unique and meet validation requirements.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdateUsernameRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Username updated successfully.',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request - Username already taken, invalid format, or validation failed.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    500: {
      description: 'Internal Server Error - Failed to update username.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const updateCurrencyRoute = createRoute({
  method: 'patch',
  path: '/currency',
  operationId: 'updatePlayerCurrency',
  tags: ['User'],
  summary: 'Update Player Currency',
  description:
    'Updates the preferred currency for the authenticated player. This affects how balances and transactions are displayed.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdateCurrencyRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Currency updated successfully.',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request - Invalid currency code or currency not supported.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    500: {
      description: 'Internal Server Error - Failed to update currency preference.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const updateAvatarRoute = createRoute({
  method: 'patch',
  path: '/avatar',
  operationId: 'updatePlayerAvatar',
  tags: ['User'],
  summary: 'Update Player Avatar',
  description: 'Updates the avatar/profile picture for the authenticated player.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdateAvatarRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Avatar updated successfully.',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request - Invalid avatar URL or image format not supported.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    500: {
      description: 'Internal Server Error - Failed to update avatar.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const updatePasswordRoute = createRoute({
  method: 'patch',
  path: '/password',
  operationId: 'updatePlayerPassword',
  tags: ['User'],
  summary: 'Update Player Password',
  description:
    'Allows the authenticated player to change their password after providing the current password for verification.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdatePasswordRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password updated successfully.',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      description:
        'Bad Request - Current password incorrect, new password too weak, or validation failed.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    500: {
      description: 'Internal Server Error - Failed to update password.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const getPlayerTransactionsRoute = createRoute({
  method: 'post',
  path: '/transactions',
  operationId: 'getPlayerTransactions',
  tags: ['User'],
  summary: 'Get Player Transactions',
  description:
    'Retrieves a list of transactions for the authenticated player based on the provided filter criteria.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z
            .object({
              limit: z.number().optional().openapi({
                description: 'Maximum number of transactions to return.',
                example: 20,
              }),
              offset: z.number().optional().openapi({
                description: 'Number of transactions to skip.',
                example: 0,
              }),
              type: z.string().optional().openapi({
                description: 'Filter by transaction type.',
                example: 'DEPOSIT',
              }),
            })
            .openapi('GetPlayerTransactionsRequest'),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Player transactions retrieved successfully.',
      content: {
        'application/json': {
          schema: PlayerTransactionsResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request - Invalid filter parameters.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    500: {
      description: 'Internal Server Error - Failed to retrieve transactions.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const getPlayerGameRoute = createRoute({
  method: 'get',
  path: '/my-games',
  operationId: 'getPlayerGames',
  tags: ['User'],
  summary: 'Get Player Games',
  description:
    'Retrieves a list of games available to the authenticated player, including game details and status.',
  responses: {
    200: {
      description: 'Player games retrieved successfully.',
      content: {
        'application/json': {
          schema: PlayerGamesResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request - Invalid parameters or missing authentication.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    500: {
      description: 'Internal Server Error - Failed to retrieve player games.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const getPlayerDepositRoute = createRoute({
  method: 'post',
  path: '/deposits',
  operationId: 'getPlayerDeposits',
  tags: ['User'],
  summary: 'Get Player Deposits',
  description:
    'Retrieves a list of deposits for the authenticated player based on the provided filter criteria.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z
            .object({
              limit: z.number().optional().openapi({
                description: 'Maximum number of deposits to return.',
                example: 20,
              }),
              offset: z.number().optional().openapi({
                description: 'Number of deposits to skip.',
                example: 0,
              }),
              status: z.string().optional().openapi({
                description: 'Filter by deposit status.',
                example: 'COMPLETED',
              }),
            })
            .openapi('GetPlayerDepositsRequest'),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Player deposits retrieved successfully.',
      content: {
        'application/json': {
          schema: z
            .array(
              z.object({
                id: z.string().openapi({
                  description: 'Deposit ID',
                  example: 'dep_123',
                }),
                amount: z.number().openapi({
                  description: 'Deposit amount',
                  example: 100.5,
                }),
                status: z.string().openapi({
                  description: 'Deposit status',
                  example: 'COMPLETED',
                }),
                currency: z.string().openapi({
                  description: 'Deposit currency',
                  example: 'USD',
                }),
                createdAt: z.string().openapi({
                  description: 'Creation timestamp',
                  example: '2023-10-01T12:00:00Z',
                }),
                updatedAt: z.string().openapi({
                  description: 'Last update timestamp',
                  example: '2023-10-01T12:00:00Z',
                }),
              }),
            )
            .openapi('PlayerDepositsResponse'),
        },
      },
    },
    400: {
      description: 'Bad Request - Invalid filter parameters.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    500: {
      description: 'Internal Server Error - Failed to retrieve deposits.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createPlayerWithdrawRoute = createRoute({
  method: 'post',
  path: '/withdraw',
  operationId: 'createPlayerWithdrawal',
  tags: ['User'],
  summary: 'Create Player Withdrawal',
  description:
    'Initiates a withdrawal transaction for the authenticated player using the specified payment method.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateWithdrawalRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Withdrawal initiated successfully.',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      description:
        'Bad Request - Invalid withdrawal amount, insufficient funds, unsupported currency, or payment method unavailable.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    500: {
      description: 'Internal Server Error - Failed to process withdrawal.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const createPlayerBonusRoute = createRoute({
  method: 'post',
  path: '/bonus',
  operationId: 'createPlayerBonus',
  tags: ['User'],
  summary: 'Create Player Bonus',
  description:
    'Creates a bonus award for the authenticated player based on the specified bonus type and amount.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateBonusRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Bonus created successfully.',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request - Invalid bonus type, amount, or bonus conditions not met.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    500: {
      description: 'Internal Server Error - Failed to create bonus.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const claimBonusRoute = createRoute({
  method: 'get',
  path: '/bonus/:bonusId/claim',
  operationId: 'claimPlayerBonus',
  tags: ['User'],
  summary: 'Claim Player Bonus',
  description: 'Claims a specific bonus that is available to the authenticated player.',
  request: {
    params: z.object({
      bonusId: z.string().openapi({
        description: 'The unique identifier of the bonus to claim.',
        example: 'bonus_123',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Bonus claimed successfully.',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request - Bonus not found, already claimed, or conditions not met.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    500: {
      description: 'Internal Server Error - Failed to claim bonus.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const getKycRoute = createRoute({
  method: 'get',
  path: '/kyc',
  operationId: 'getPlayerKycStatus',
  tags: ['User'],
  summary: 'Get Player KYC Status',
  description:
    'Retrieves the KYC (Know Your Customer) verification status and document information for the authenticated player.',
  responses: {
    200: {
      description: 'KYC status retrieved successfully.',
      content: {
        'application/json': {
          schema: KycStatusResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request - Invalid parameters or missing authentication.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    500: {
      description: 'Internal Server Error - Failed to retrieve KYC status.',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const generateRoutes = (router: AppOpenAPI) => {
  // router.basePath("/player");
  router.openapi(getPlayerBalanceRoute, controller.getPlayerBalance);
  router.openapi(updateUsernameRoute, controller.updateUsername);
  router.openapi(updateCurrencyRoute, controller.updateCurrency);
  router.openapi(updateAvatarRoute, controller.updateAvatar);
  router.openapi(updatePasswordRoute, controller.updatePassword);
  router.openapi(getPlayerTransactionsRoute, controller.getPlayerTransactions);
  router.openapi(getPlayerGameRoute, controller.getPlayerGame);
  router.openapi(getPlayerDepositRoute, controller.getPlayerDeposit);
  router.openapi(createPlayerWithdrawRoute, controller.getPlayerWithdraw);
  router.openapi(createPlayerBonusRoute, controller.getPlayerBonus);
  router.openapi(claimBonusRoute, controller.claimBonus);
  router.openapi(getKycRoute, controller.getKyc);
  return router.routes;
};
// export default player;
