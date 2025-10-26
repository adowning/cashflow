import { sql } from 'drizzle-orm';
import { pgTable, pgView } from 'drizzle-orm/pg-core';
import { text, integer, timestamp, real, boolean } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Player Balance View
/**
 * The core balance for each player.
 * Stores all balances, wagering requirements, and statistical totals.
 * All monetary values are stored in cents (integers).
 */
export const playerBalancesView = pgTable('player_balances', {
  playerId: text('player_id').primaryKey(),

  // Balances
  realBalance: integer('real_balance').default(0).notNull(),
  bonusBalance: integer('bonus_balance').default(0).notNull(),
  freeSpinsRemaining: integer('free_spins_remaining').default(0).notNull(),

  // Wagering Requirements (in cents)
  depositWRRemaining: integer('deposit_wr_remaining').default(0).notNull(),
  bonusWRRemaining: integer('bonus_wr_remaining').default(0).notNull(),

  // Lifetime Statistics (in cents, except for free_spin_wins_count)
  totalDeposited: integer('total_deposited').default(0).notNull(),
  totalWithdrawn: integer('total_withdrawn').default(0).notNull(),
  totalWagered: integer('total_wagered').default(0).notNull(),
  totalWon: integer('total_won').default(0).notNull(),
  totalBonusGranted: integer('total_bonus_granted').default(0).notNull(),
  totalFreeSpinWins: integer('total_free_spin_wins').default(0).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// --- 2. ZOD SCHEMAS (VALIDATION & TYPES) ---

// Drizzle-derived types
// export const PlayerBalanceSchema = createSelectSchema(playerBalancesView);
// export type PlayerBalance = z.infer<typeof PlayerBalanceSchema>;

// export const PlatformSettingsSchema = createSelectSchema(platformSettings);

// export type PlatformSettings = z.infer<typeof PlatformSettingsSchema>;
export const transactionHistoryView = pgView('transaction_history_view', {
  transactionId: text('transaction_id').notNull(),
  playerId: text('player_id'),
  playerName: text('player_name'),
  type: text('type'),
  amount: integer('amount').default(0),
  status: text('status'),
  balanceBefore: integer('balance_before').default(0),
  balanceAfter: integer('balance_after').default(0),
  bonusBalanceBefore: integer('bonus_balance_before').default(0),
  bonusBalanceAfter: integer('bonus_balance_after').default(0),
  description: text('description'),
  gameId: text('game_id'),
  gameName: text('game_name'),
  operatorId: text('operator_id'),
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 }),
}).as(sql`
  SELECT
    t.id as transaction_id,
    t.playerId as player_id,
    p.name as player_name,
    t.type,
    t.amount,
    t.status,
    t.realBalanceBefore as balance_before,
    t.realBalanceAfter as balance_after,
    t.bonusBalanceBefore as bonus_balance_before,
    t.bonusBalanceAfter as bonus_balance_after,
    t.description,
    t.gameId as game_id,
    t.gameName as game_name,
    t.operatorId as operator_id,
    t.createdAt as created_at
  FROM transactions t
  JOIN players p ON t.playerId = p.id
`);

export const ZTransactionHistoryViewSelectSchema = createSelectSchema(transactionHistoryView);
export type TTransactionHistoryView = z.infer<typeof transactionHistoryView>;
export type TTransactionHistoryViewSelect = typeof transactionHistoryView.$inferSelect &
  TTransactionHistoryView;

// VIP Progress View
export const vipProgressView = pgView('vip_progress_view', {
  playerId: text('player_id').notNull(),
  playerName: text('player_name'),
  vipLevel: integer('vip_level').default(1),
  vipXp: integer('vip_xp').default(0),
  vipRankId: text('vip_rank_id'),
  rankName: text('rank_name'),
  minXp: integer('min_xp').default(0),
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 }),
}).as(sql`
  SELECT
    p.id as player_id,
    p.name as player_name,
    COALESCE(p.vipLevel, 1) as vip_level,
    COALESCE(p.vipPoints, 0) as vip_xp,
    p.vipRankId as vip_rank_id,
    vr.name as rank_name,
    vr.minXp as min_xp,
    p.createdAt as created_at
  FROM players p
  LEFT JOIN vipRanks vr ON p.vipRankId = vr.id
`);

export const ZVipProgressViewSelectSchema = createSelectSchema(vipProgressView);
export type TVipProgressView = z.infer<typeof vipProgressView>;
export type TVipProgressViewSelect = typeof vipProgressView.$inferSelect & TVipProgressView;
// Bonus Summary View
export const bonusSummaryView = pgView('bonus_summary_view', {
  playerId: text('player_id').notNull(),
  playerName: text('player_name'),
  bonusId: text('bonus_id'),
  bonusName: text('bonus_name'),
  amount: integer('amount').default(0),
  processAmount: integer('process_amount').default(0),
  goalAmount: integer('goal_amount').default(0),
  status: text('status'),
  expiryDate: timestamp('expiry_date', { mode: 'date', precision: 3 }),
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 }),
}).as(sql`
  SELECT
    pb.playerId as player_id,
    p.name as player_name,
    pb.bonusId as bonus_id,
    b.name as bonus_name,
    pb.awardedAmount as amount,
    pb.wageringProgress as process_amount,
    pb.wageringRequired as goal_amount,
    pb.status,
    b.expiryDays as expiry_date,
    pb.createdAt as created_at
  FROM playerBonuses pb
  JOIN players p ON pb.playerId = p.id
  JOIN bonuses b ON pb.bonusId = b.id
`);

export const ZBonusSummaryViewSelectSchema = createSelectSchema(bonusSummaryView);
export type TBonusSummaryView = z.infer<typeof bonusSummaryView>;
export type TBonusSummaryViewSelect = typeof bonusSummaryView.$inferSelect & TBonusSummaryView;
