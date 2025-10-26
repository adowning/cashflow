import { z } from '@hono/zod-openapi';

export const DailyReportSchema = z.object({
  activePlayer: z.number().openapi({
    description: 'Number of active players today.',
    example: 150,
  }),
  newPlayer: z.number().openapi({
    description: 'Number of new players today.',
    example: 25,
  }),
  turnOver: z.number().openapi({
    description: 'Total turnover for the day.',
    example: 12500.50,
  }),
  ggr: z.number().openapi({
    description: 'Gross Gaming Revenue for the day.',
    example: 1250.75,
  }),
});

export const TransactionReportSchema = z.object({
    deposit: z.number().openapi({
        description: 'Total deposits.',
        example: 5000,
    }),
    withdraw: z.number().openapi({
        description: 'Total withdrawals.',
        example: 2000,
    }),
    cashback: z.number().openapi({
        description: 'Total cashback awarded.',
        example: 500,
    }),
    reward: z.number().openapi({
        description: 'Total affiliate rewards.',
        example: 1000,
    }),
});

export const GeneralGraphSchema = z.object({
    time: z.array(z.string()).openapi({
        description: 'Time labels for the graph.',
        example: ['2023-10-01', '2023-10-02'],
    }),
    turnOver: z.array(z.number()).openapi({
        description: 'Turnover data points.',
        example: [1000, 1200],
    }),
    ggr: z.array(z.number()).openapi({
        description: 'GGR data points.',
        example: [100, 120],
    }),
    activePlayer: z.array(z.number()).openapi({
        description: 'Active player data points.',
        example: [50, 55],
    }),
    newPlayer: z.array(z.number()).openapi({
        description: 'New player data points.',
        example: [5, 7],
    }),
});

export const TokenReportSchema = z.array(z.object({
    symbol: z.string(),
    deposit: z.number(),
    withdraw: z.number(),
    balance: z.number(),
    turnover: z.number(),
    ggr: z.number(),
}));

export const UserReportSchema = z.array(z.object({
    username: z.string(),
    winRate: z.string(),
    turnover: z.number(),
    ggr: z.number(),
}));

export const GameReportSchema = z.array(z.object({
    name: z.string(),
    winRate: z.string(),
    turnover: z.number(),
    ggr: z.number(),
}));
