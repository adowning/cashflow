import { createRouter } from '@/config/create-app';
import { createRoute, z } from '@hono/zod-openapi';
import * as controller from './dashboard.controller';
import {
  DailyReportSchema,
  TransactionReportSchema,
  GeneralGraphSchema,
  TokenReportSchema,
  UserReportSchema,
  GameReportSchema,
} from './dashboard.schema';

const router = createRouter();

export const getDashboardDataRoute = createRoute({
  method: 'get',
  path: '/statistic/dashboard/{type}',
  tags: ['Dashboard'],
  summary: 'Get various dashboard data',
  request: {
    params: z.object({
      type: z.enum(['daily', 'transaction', 'general', 'token', 'user', 'game']),
    }),
    query: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      sortKey: z.string().optional(),
      sortDirection: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    200: {
      description: 'Dashboard data retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            status: z.string(),
            data: z.union([
              DailyReportSchema,
              TransactionReportSchema,
              GeneralGraphSchema,
              TokenReportSchema,
              UserReportSchema,
              GameReportSchema,
            ]),
          }),
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    500: {
      description: 'Internal Server Error',
    },
  },
});

router.openapi(getDashboardDataRoute, controller.getDashboardData, (result, c) => {
  if (!result.success) {
    return c.json({ error: 'Failed to process request' }, 500);
  }
});

export const dashboardRoutes = router;
