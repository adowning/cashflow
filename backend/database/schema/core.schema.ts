import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  index,
  real, // Changed from doublePrecision for standard SQL
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns, cents } from './common.schema';
import {
  bonusStatusEnum,
  paymentMethodEnum,
  transactionStatusEnum,
  transactionTypeEnum,
  userStatusEnum, // Renamed from statusEnum for clarity
  gameStatusEnum, // Use the new one
  gameCategoriesEnum,
  kycStatusEnum,
} from './enums.schema';
import { playerBonuses } from './vip.schema'; // Import related tables
// Add imports for tables defined in other files if needed
import { affiliates } from './vip.schema';
import {
  deposits,
  withdrawals,
  gameSessions,
  referralCodes,
  operatorSwitchHistories,
} from './other.schema';
import { kycSubmissions, passwordLogs, jackpotContributions, jackpotWins } from './other.schema'; // Assuming these will be moved/defined
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import type z from 'zod';

// Players: Core user entity - Merged players from core.schema & generated schema
export const players = pgTable(
  'players',
  {
    ...baseColumns,
    playername: text('username').notNull().unique(),
    image: text('image'),
    status: userStatusEnum('status').default('ACTIVE').notNull(),
    avatarUrl: text('avatar_url')
      .default('https://gameui.cashflowcasino.com/public/avatars/avatar-01.webp')
      .notNull(),
    phone: text('phone'), // Added from auth.schema 'users' table
    vipLevel: integer('vip_level').default(1).notNull(),
    vipPoints: integer('vip_points').default(0).notNull(), // Renamed from vipXp for consistency with generated
    vipRankId: text('vip_rank_id'), // Links to vipRanks
    rtgBlockTime: integer('rtg_block_time'), // Added from generated player.service
    kycStatus: kycStatusEnum('kyc_status').default('NOT_STARTED'), // Simple status, link to KYC tables later
    // Affiliate linkage
    invitorId: text('invitor_id'), // References affiliates.id (defined in vip.schema)
    inviteCode: text('invite_code'),
    path: text('path').array(),
    affiliateInit: boolean('affiliate_init').default(false),
    referralInit: boolean('referral_init').default(false),
    lastVipLevelAmount: cents('last_vip_level_amount'),
  },
  (table) => ({
    usernameIdx: uniqueIndex('players_username_idx').on(table.playername),
    statusIdx: index('players_status_idx').on(table.status),
    invitorIdx: index('players_invitor_idx').on(table.invitorId),
  }),
);
// Zod schema for players
export const ZPlayerSelectSchema = createSelectSchema(players);
export const ZPlayerUpdateSchema = createUpdateSchema(players);

export type TPlayer = z.infer<typeof players>;
export type TPlayerSelect = typeof players.$inferSelect & TPlayer;

// Balances: Holds actual monetary values, linked directly to Player
export const balances = pgTable(
  'balances',
  {
    // Use player ID as primary key assuming one balance record per player
    playerId: text('player_id')
      .primaryKey()
      .references(() => players.id, { onDelete: 'cascade' }),
    realBalance: cents('real_balance').default(0).notNull(),
    bonusBalance: cents('bonus_balance').default(0).notNull(),
    // Aggregate/calculated fields - consider if these are truly needed or calculable on the fly
    turnover: cents('turnover').default(0),
    withdrawable: cents('withdrawable').default(0), // Can be calculated based on balances and wagering
    pending: cents('pending').default(0), // Pending withdrawal amount?
    updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`), // Need separate updatedAt
  },
  (table) => ({
    // Add index if querying by other fields becomes common
  }),
);

// Zod schemas for balances
export const ZBalancesSelectSchema = createSelectSchema(balances);
export const ZBalancesUpdateSchema = createUpdateSchema(balances);

export type TBalances = z.infer<typeof balances>;
export type TBalancesSelect = typeof balances.$inferSelect & TBalances;

// Operators: (From core.schema)
export const operators = pgTable(
  'operators',
  {
    ...baseColumns,
    name: text('name').notNull().unique(),
  },
  (table) => ({
    nameIdx: uniqueIndex('operators_name_idx').on(table.name),
  }),
);

// Zod schemas for operators
export const ZOperatorsSelectSchema = createSelectSchema(operators);
export const ZOperatorsUpdateSchema = createUpdateSchema(operators);

export type TOperators = z.infer<typeof operators>;
export type TOperatorsSelect = typeof operators.$inferSelect & TOperators;

// Games: Merged from core.schema and generated schema
export const games = pgTable(
  'games',
  {
    ...baseColumns,
    name: text('name').notNull(),
    title: text('title'), // Added from generated
    description: text('description'), // Added from generated
    category: gameCategoriesEnum('category').default('SLOTS').notNull(),
    tags: text('tags'), // Added from generated
    thumbnailUrl: text('thumbnail_url'), // Added from generated
    bannerUrl: text('banner_url'), // Added from generated
    developer: text('developer'), // Added from generated
    providerId: text('provider_id'),
    operatorId: text('operator_id').references(() => operators.id),
    targetRtp: real('target_rtp'), // Added from generated
    status: gameStatusEnum('status').default('ACTIVE').notNull(), // Use enum from generated
    minBet: cents('min_bet').default(100), // Added from generated
    maxBet: cents('max_bet').default(100000), // Added from generated
    isFeatured: boolean('is_featured').default(false), // Added from generated
    jackpotGroup: text('jackpot_group'), // Added jackpot link from generated
    // Removed isActive (use status), state (use status)
  },
  (table) => ({
    nameIdx: index('games_name_idx').on(table.name),
    categoryIdx: index('games_category_idx').on(table.category),
    operatorIdx: index('games_operator_idx').on(table.operatorId),
    statusIdx: index('games_status_idx').on(table.status),
  }),
);

// Zod schemas for games
export const ZGamesSelectSchema = createSelectSchema(games);
export const ZGamesUpdateSchema = createUpdateSchema(games);

export type TGames = z.infer<typeof games>;
export type TGamesSelect = typeof games.$inferSelect & TGames;

// Transactions: Central log - Merged core.schema and generated schema
export const transactions = pgTable(
  'transactions',
  {
    ...baseColumns, // Includes id, createdAt, updatedAt etc.
    playerId: text('player_id')
      .notNull()
      .references(() => players.id),
    relatedId: text('related_id'), // Link to bet round, deposit, withdrawal, bonus etc.
    sessionId: text('session_id'), // Link to game_sessions or auth sessions
    tnxId: text('tnx_id').unique(), // External or unique transaction ID (optional?)
    type: transactionTypeEnum('type').notNull(),
    typeDescription: text('type_description'), // Added from generated
    status: transactionStatusEnum('status').default('COMPLETED').notNull(),
    amount: cents('amount').notNull(), // Net change or specific amount (e.g., win amount)
    wagerAmount: cents('wager_amount'), // Specifically for BET/BONUS types
    // Balance Snapshots (CRITICAL for audit)
    realBalanceBefore: cents('real_balance_before').notNull(),
    realBalanceAfter: cents('real_balance_after').notNull(),
    bonusBalanceBefore: cents('bonus_balance_before').notNull(),
    bonusBalanceAfter: cents('bonus_balance_after').notNull(),
    // References
    gameId: text('game_id').references(() => games.id),
    gameName: text('game_name'), // Denormalized
    provider: text('provider'), // Denormalized game provider (developer)
    category: text('category'), // Denormalized game category
    operatorId: text('operator_id').references(() => operators.id),
    // Contributions
    ggrContribution: cents('ggr_contribution'),
    jackpotContribution: cents('jackpot_contribution'),
    vipPointsAdded: integer('vip_points_added'),
    // Metadata
    processingTime: integer('processing_time'), // Bet processing time in ms
    metadata: jsonb('metadata'), // Extra data (game outcome, payout details, admin notes)
    // Affiliate Tracking
    affiliateId: text('affiliate_id'), // References affiliates.id (defined in vip.schema)
    path: text('path').array(), // Affiliate path if applicable

    // Removed redundant balance fields (balanceBefore/After are totals)
    // Removed betsIds (should be linked via relatedId or specific bet table if needed)
  },
  (table) => ({
    playerIdx: index('transactions_player_idx').on(table.playerId),
    typeIdx: index('transactions_type_idx').on(table.type),
    statusIdx: index('transactions_status_idx').on(table.status),
    createdAtIdx: index('transactions_created_at_idx').on(table.createdAt),
    gameIdx: index('transactions_game_idx').on(table.gameId),
    relatedIdx: index('transactions_related_idx').on(table.relatedId),
  }),
);

// Zod schemas for transactions
export const ZTransactionsSelectSchema = createSelectSchema(transactions);
export const ZTransactionsUpdateSchema = createUpdateSchema(transactions);

export type TTransactions = z.infer<typeof transactions>;
export type TTransactionsSelect = typeof transactions.$inferSelect & TTransactions;

// VIP Ranks: Configuration for levels (from core.schema)
export const vipRanks = pgTable(
  'vip_ranks',
  {
    ...baseColumns,
    name: text('name').notNull().unique(),
    minXp: integer('min_xp').notNull(),
    level: integer('level').notNull().unique(),
    icon: text('icon'), // Make nullable?
    // Rewards (consider moving to separate benefits table or JSONB)
    dailyCashbackMax: cents('daily_cashback_max').default(0), // Use cents
    monthlyCashbackMax: cents('monthly_cashback_max').default(0), // Use cents
    benefits: jsonb('benefits'), // Store other benefits like { "freeSpins": 10, "prioritySupport": true }
    multiplier: real('multiplier').default(1.0), // XP multiplier (from generated vipLevels)
  },
  (table) => ({
    levelIdx: uniqueIndex('vip_ranks_level_idx').on(table.level),
  }),
);

// Zod schemas for vipRanks
export const ZVipRanksSelectSchema = createSelectSchema(vipRanks);
export const ZVipRanksUpdateSchema = createUpdateSchema(vipRanks);

export type TVipRanks = z.infer<typeof vipRanks>;
export type TVipRanksSelect = typeof vipRanks.$inferSelect & TVipRanks;

// --- Relations ---

export const playersRelations = relations(players, ({ one, many }) => ({
  balance: one(balances, {
    // Direct link to balance
    fields: [players.id],
    references: [balances.playerId],
  }),
  playerBonuses: many(playerBonuses), // Defined in vip.schema
  transactions: many(transactions),
  deposits: many(deposits), // Defined in other.schema
  withdrawals: many(withdrawals), // Defined in other.schema
  gameSessions: many(gameSessions), // Defined in other.schema
  kycSubmission: one(kycSubmissions, {
    // Defined later
    fields: [players.id],
    references: [kycSubmissions.playerId],
  }),
  affiliateProfile: one(affiliates, {
    // Defined in vip.schema
    fields: [players.id],
    references: [affiliates.id],
  }),
  invitedBy: one(affiliates, {
    // Defined in vip.schema
    fields: [players.invitorId],
    references: [affiliates.id],
    relationName: 'invitedByAffiliate',
  }),
  referralCodes: many(referralCodes), // Defined in other.schema
  passwordLogs: many(passwordLogs), // Defined later
}));

export const balancesRelations = relations(balances, ({ one }) => ({
  player: one(players, {
    fields: [balances.playerId],
    references: [players.id],
  }),
}));

export const operatorsRelations = relations(operators, ({ many }) => ({
  games: many(games),
  transactions: many(transactions),
  operatorSwitchHistoriesFrom: many(operatorSwitchHistories, { relationName: 'SwitchedFrom' }), // Defined in other.schema
  operatorSwitchHistoriesTo: many(operatorSwitchHistories, { relationName: 'SwitchedTo' }), // Defined in other.schema
  // Add relations from other.schema if needed (products, settlements, etc.)
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  operator: one(operators, {
    fields: [games.operatorId],
    references: [operators.id],
  }),
  transactions: many(transactions),
  gameSessions: many(gameSessions), // Defined in other.schema
  jackpotContributions: many(jackpotContributions), // Defined later
  jackpotWins: many(jackpotWins), // Defined later
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  player: one(players, {
    fields: [transactions.playerId],
    references: [players.id],
  }),
  game: one(games, {
    fields: [transactions.gameId],
    references: [games.id],
  }),
  operator: one(operators, {
    fields: [transactions.operatorId],
    references: [operators.id],
  }),
  // Add links to deposit, withdrawal, playerBonus if `relatedId` is used that way
  session: one(gameSessions, {
    // Link to game session if applicable
    fields: [transactions.sessionId],
    references: [gameSessions.id], // Assuming sessionId links here
  }),
}));

export const vipRanksRelations = relations(vipRanks, ({ many }) => ({
  players: many(players, { relationName: 'PlayerVipRank' }), // If vipRankId added to players
}));
