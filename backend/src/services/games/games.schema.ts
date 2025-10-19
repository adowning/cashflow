import { z } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent } from 'stoker/openapi/helpers';
import { badRequestSchema } from '../../lib/constants';
// Casino schemas based on controller requirements
export const GameSchema = z
  .object({
    id: z.string().openapi({ description: 'Game ID', example: 'game_123' }),
    name: z
      .string()
      .openapi({ description: 'Game name', example: 'Slot Machine Deluxe' }),
    title: z
      .string()
      .nullable()
      .openapi({ description: 'Game title', example: 'Deluxe Slots' }),
    description: z.string().nullable().openapi({
      description: 'Game description',
      example: 'An exciting slot game',
    }),
    category: z
      .string()
      .openapi({ description: 'Game category', example: 'slots' }),
    tags: z
      .string()
      .nullable()
      .openapi({ description: 'Game tags', example: 'popular,new' }),
    thumbnailUrl: z.string().nullable().openapi({
      description: 'Thumbnail image URL',
      example: 'https://example.com/thumb.jpg',
    }),
    bannerUrl: z.string().nullable().openapi({
      description: 'Banner image URL',
      example: 'https://example.com/banner.jpg',
    }),
    developer: z
      .string()
      .openapi({ description: 'Game developer', example: 'GameProvider Inc' }),
    providerId: z
      .string()
      .nullable()
      .openapi({ description: 'Provider ID', example: 'provider_123' }),
    targetRtp: z
      .number()
      .nullable()
      .openapi({ description: 'Target RTP percentage', example: 96.5 }),
    isFeatured: z
      .boolean()
      .openapi({ description: 'Whether game is featured', example: true }),
    isActive: z
      .boolean()
      .openapi({ description: 'Whether game is active', example: true }),
    createdAt: z.string().openapi({
      description: 'Creation timestamp',
      example: '2023-10-01T12:00:00Z',
    }),
    updatedAt: z.string().openapi({
      description: 'Last update timestamp',
      example: '2023-10-01T12:00:00Z',
    }),
  })
  .openapi('Game');

export const ProviderSchema = z
  .object({
    id: z.string().openapi({ description: 'Provider ID', example: 'prov_123' }),
    name: z
      .string()
      .openapi({ description: 'Provider name', example: 'GameProvider Inc' }),
    code: z.string().openapi({ description: 'Provider code', example: 'GP' }),
    isActive: z
      .boolean()
      .openapi({ description: 'Whether provider is active', example: true }),
    gameCount: z
      .number()
      .openapi({ description: 'Number of games', example: 150 }),
    currencies: z.array(z.string()).openapi({
      description: 'Supported currencies',
      example: ['USD', 'EUR'],
    }),
  })
  .openapi('Provider');

export const SportSchema = z
  .object({
    id: z.string().openapi({ description: 'Sport ID', example: 'sport_123' }),
    name: z
      .string()
      .openapi({ description: 'Sport name', example: 'Football' }),
    code: z.string().openapi({ description: 'Sport code', example: 'FB' }),
    isActive: z
      .boolean()
      .openapi({ description: 'Whether sport is active', example: true }),
    eventCount: z
      .number()
      .openapi({ description: 'Number of events', example: 25 }),
  })
  .openapi('Sport');

// Request schemas for casino operations
export const LaunchGameRequestSchema = z
  .object({
    gameCode: z.string().openapi({
      description: 'The game code to launch.',
      example: 'SLOT001',
    }),
    productCode: z.string().openapi({
      description: 'The product/provider code.',
      example: 'PRAGMATIC',
    }),
    gameType: z.string().openapi({
      description: 'The type of game.',
      example: 'SLOT',
    }),
    language: z.string().optional().openapi({
      description: 'Preferred language code.',
      example: 'en',
    }),
    currency: z.string().openapi({
      description: 'Player currency.',
      example: 'USD',
    }),
  })
  .openapi('LaunchGameRequest');

export const GameSearchRequestSchema = z
  .object({
    name: z.string().openapi({
      description: 'Search term for game name.',
      example: 'slot',
    }),
    gameType: z.string().optional().openapi({
      description: 'Filter by game type.',
      example: 'SLOT',
    }),
    currentPage: z.number().int().positive().openapi({
      description: 'Current page number for pagination.',
      example: 1,
    }),
    perPage: z.number().int().positive().openapi({
      description: 'Number of results per page.',
      example: 20,
    }),
  })
  .openapi('GameSearchRequest');

export const GetGamesRequestSchema = z
  .object({
    productIds: z
      .array(z.string())
      .optional()
      .openapi({
        description: 'Filter by product/provider IDs.',
        example: ['prov_1', 'prov_2'],
      }),
    gameType: z.string().optional().openapi({
      description: 'Filter by game type.',
      example: 'SLOT',
    }),
    currentPage: z.number().int().positive().openapi({
      description: 'Current page number.',
      example: 1,
    }),
    perPage: z.number().int().positive().openapi({
      description: 'Results per page.',
      example: 20,
    }),
  })
  .openapi('GetGamesRequest');

export const GetAllGameListRequestSchema = z
  .object({
    // productCode: z.string().openapi({
    // 	description: "Product/provider code.",
    // 	example: "PRAGMATIC",
    // }),
    currentPage: z.number().int().positive().openapi({
      description: 'Current page number.',
      example: 1,
    }),
    perPage: z.number().int().positive().openapi({
      description: 'Results per page.',
      example: 20,
    }),
  })
  .openapi('GetAllGameListRequest');

export const UpdateGameRequestSchema = z
  .object({
    name: z.string().optional().openapi({
      description: 'New game name.',
      example: 'Updated Slot Game',
    }),
    title: z.string().optional().openapi({
      description: 'New game title.',
      example: 'Updated Title',
    }),
    description: z.string().optional().openapi({
      description: 'New game description.',
      example: 'Updated description',
    }),
    isActive: z.boolean().optional().openapi({
      description: 'Whether game should be active.',
      example: true,
    }),
    isFeatured: z.boolean().optional().openapi({
      description: 'Whether game should be featured.',
      example: false,
    }),
  })
  .openapi('UpdateGameRequest');

// Response schemas
export const LaunchGameResponseSchema = z
  .object({
    status: z.boolean().openapi({
      description: 'Launch success status.',
      example: true,
    }),
    url: z.string().optional().openapi({
      description: 'Game launch URL.',
      example: 'https://games.example.com/launch/123',
    }),
    message: z.string().optional().openapi({
      description: 'Status message.',
      example: 'Game launched successfully',
    }),
  })
  .openapi('LaunchGameResponse');

export const ProvidersResponseSchema = z.array(ProviderSchema).openapi({
  description: 'List of active game providers.',
});

export const GamesResponseSchema = z
  .object({
    data: z.array(GameSchema).openapi({
      description: 'List of games.',
    }),
    total: z.number().openapi({
      description: 'Total number of games.',
      example: 150,
    }),
    currentPage: z.number().openapi({
      description: 'Current page number.',
      example: 1,
    }),
    totalPages: z.number().openapi({
      description: 'Total number of pages.',
      example: 8,
    }),
  })
  .openapi('GamesResponse');

export const SportsResponseSchema = z.array(SportSchema).openapi({
  description: 'List of available sports.',
});

export const GameDetailResponseSchema = z
  .object({
    id: z.string().openapi({ description: 'Game ID', example: 'game_123' }),
    name: z
      .string()
      .openapi({ description: 'Game name', example: 'Slot Machine Deluxe' }),
    title: z
      .string()
      .nullable()
      .openapi({ description: 'Game title', example: 'Deluxe Slots' }),
    description: z.string().nullable().openapi({
      description: 'Game description',
      example: 'An exciting slot game',
    }),
    category: z
      .string()
      .openapi({ description: 'Game category', example: 'slots' }),
    developer: z
      .string()
      .openapi({ description: 'Game developer', example: 'GameProvider Inc' }),
    thumbnailUrl: z.string().nullable().openapi({
      description: 'Thumbnail URL',
      example: 'https://example.com/thumb.jpg',
    }),
    bannerUrl: z.string().nullable().openapi({
      description: 'Banner URL',
      example: 'https://example.com/banner.jpg',
    }),
    targetRtp: z
      .number()
      .nullable()
      .openapi({ description: 'Target RTP', example: 96.5 }),
    isFeatured: z
      .boolean()
      .openapi({ description: 'Featured status', example: true }),
    isActive: z
      .boolean()
      .openapi({ description: 'Active status', example: true }),
    supportCurrency: z
      .string()
      .openapi({ description: 'Supported currencies', example: 'USD,EUR' }),
  })
  .openapi('GameDetailResponse');

export const GameSearchResponseSchema = z
  .object({
    data: z.array(GameSchema).openapi({
      description: 'Search results.',
    }),
    count: z.number().openapi({
      description: 'Total number of results.',
      example: 25,
    }),
  })
  .openapi('GameSearchResponse');

export const RecentBigWinResponseSchema = z
  .array(
    z.object({
      id: z.string().openapi({ description: 'Win ID', example: 'win_123' }),
      gameName: z
        .string()
        .openapi({ description: 'Game name', example: 'Slot Machine Deluxe' }),
      playerName: z
        .string()
        .openapi({ description: 'Player name', example: 'john_doe' }),
      amount: z
        .number()
        .openapi({ description: 'Win amount', example: 1500.5 }),
      currency: z.string().openapi({ description: 'Currency', example: 'USD' }),
      timestamp: z.string().openapi({
        description: 'Win timestamp',
        example: '2023-10-01T12:00:00Z',
      }),
    }),
  )
  .openapi('RecentBigWinResponse');

// Generic response schemas
export const SuccessResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().openapi({ example: 'Operation was successful.' }),
  })
  .openapi('SuccessResponse');

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      description: 'Error message.',
      example: 'Invalid request parameters',
    }),
    code: z.string().optional().openapi({
      description: 'Error code for programmatic handling.',
      example: 'VALIDATION_ERROR',
    }),
  })
  .openapi('ErrorResponse');
createRoute({
  method: 'get',
  path: '/games/all',
  tags: ['Games'],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      GamesResponseSchema,
      'List of all games'
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(badRequestSchema, 'Bad Request'),
  },
});

