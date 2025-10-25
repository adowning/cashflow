import {
  pgEnum,
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';

export const bonusStatusEnum = pgEnum('BonusStatus', [
  'PENDING',
  'ACTIVE',
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
]);

export const balanceTypeEnum = pgEnum('BalanceType', ['real', 'bonus', 'mixed']);
export const paymentMethodEnum = pgEnum('PaymentMethod', [
  'INSTORE_CASH',
  'INSTORE_CARD',
  'CASH_APP',
]);
export const statusEnum = pgEnum('Status', ['ACTIVE', 'INACTIVE', 'BANNED']);
export const transactionStatusEnum = pgEnum('TransactionStatus', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);
export const typeOfTransactionEnum = pgEnum('TypeOfTransaction', [
  'DEPOSIT',
  'WITHDRAWAL',
  'BET',
  'WIN',
  'BONUS_AWARD',
  'BONUS_WAGER',
  'BONUS_CONVERT',
]);

// Players: Core user entity
export const players = pgTable('players', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text('name').notNull(),
  displayUsername: text('display_username').notNull(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  status: statusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
});

// Wallets: Central hub for wallet metadata and links to balances/VIP
export const wallets = pgTable('wallets', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  playerId: text('player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  operatorId: text('operator_id').notNull(), // Links to operators
  currency: text('currency').default('USD').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').default('INSTORE_CASH').notNull(),
  address: text('address'),
  cashtag: text('cashtag'),
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at', { mode: 'date', precision: 3 }),
  // VIP data integrated (to support VIP-service)
  vipLevel: integer('vip_level').default(1).notNull(),
  vipXp: integer('vip_xp').default(0).notNull(),
  vipRankId: text('vip_rank_id'), // Links to vipRanks
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
});

// Balances: Detailed balance data with aggregates (supports balance-management)
export const balances = pgTable('balances', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  walletId: text('wallet_id')
    .notNull()
    .references(() => wallets.id, { onDelete: 'cascade' }),
  currencyId: text('currency_id').notNull(),
  // Core balances
  realBalance: integer('real_balance').default(0).notNull(),
  bonusBalance: integer('bonus_balance').default(0).notNull(),
  totalBalance: integer('total_balance').default(0).notNull(), // Computed: realBalance + bonusBalance
  // Aggregates (pre-computed for quick access in bet-orchestration)
  totalRealBalance: integer('total_real_balance').default(0).notNull(),
  totalBonusBalance: integer('total_bonus_balance').default(0).notNull(),
  totalRealLosses: integer('total_real_losses').default(0).notNull(),
  totalBonusLosses: integer('total_bonus_losses').default(0).notNull(),
  turnover: integer('turnover').default(0).notNull(),
  withdrawable: integer('withdrawable').default(0).notNull(),
  pending: integer('pending').default(0).notNull(),
  lastUpdateTransactionId: text('last_update_transaction_id'), // Nullable
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  // Bonus summary (aggregated for quick access)
  bonuses: jsonb('bonuses')
    .$type<
      Array<{
        id: string;
        amount: number;
        wageringRequirement: number;
        wageredAmount: number;
        expiryDate?: Date;
        gameRestrictions?: string[];
      }>
    >()
    .default([])
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
});

// Player Bonuses: Detailed bonus tracking (supports FIFO and wagering in balance-management)
export const playerBonuses = pgTable('player_bonuses', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  playerId: text('player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  bonusId: text('bonus_id').notNull(), // Links to bonuses
  amount: integer('amount').default(0).notNull(),
  processAmount: integer('process_amount').default(0).notNull(), // Wagered amount
  goalAmount: integer('goal_amount').notNull(), // Wagering requirement
  betsIds: text('bets_ids').array().notNull(),
  status: bonusStatusEnum('status').default('PENDING').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
});

// Bonuses: Bonus definitions (supports bonus creation)
export const bonuses = pgTable('bonuses', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  wageringRequirement: integer('wagering_requirement').notNull(),
  expiryDate: timestamp('expiry_date', { mode: 'date', precision: 3 }).notNull(),
  gameRestrictions: text('game_restrictions').array().default([]).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
});

// Transactions: Bet/win logging (supports bet-orchestration auditing)
export const transactions = pgTable('transactions', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  walletId: text('wallet_id')
    .notNull()
    .references(() => wallets.id, { onDelete: 'cascade' }),
  type: typeOfTransactionEnum('type').notNull(),
  status: transactionStatusEnum('status').default('COMPLETED').notNull(),
  amount: integer('amount').notNull(),
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  bonusBalanceBefore: integer('bonus_balance_before').default(0).notNull(),
  bonusBalanceAfter: integer('bonus_balance_after').default(0).notNull(),
  description: text('description'),
  gameId: text('game_id'),
  gameName: text('game_name'),
  relatedRoundId: text('related_round_id'),
  operatorId: text('operator_id').notNull(),
  playerId: text('player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  processingTime: integer('processing_time').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
});

// VIP Ranks: VIP progression tiers (supports vip-service)
export const vipRanks = pgTable('vip_ranks', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text('name').notNull().unique(),
  minXp: integer('min_xp').notNull(),
  level: integer('level').notNull().unique(),
  icon: text('icon').notNull(),
  // Rewards (e.g., cashback, bonuses)
  dailyCashbackMax: integer('daily_cashback_max').default(0).notNull(),
  monthlyCashbackMax: integer('monthly_cashback_max').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
});

// Supporting Tables (e.g., Games, Operators)
export const operators = pgTable('operators', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text('name').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
});

export const games = pgTable('games', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text('name').notNull(),
  category: text('category').default('slots').notNull(),
  providerId: text('provider_id'),
  isActive: boolean('is_active').default(true).notNull(),
  operatorId: text('operator_id')
    .notNull()
    .references(() => operators.id),
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
});

// Relations (for efficient joins)
export const playersRelations = relations(players, ({ many }) => ({
  wallets: many(wallets),
  playerBonuses: many(playerBonuses),
  transactions: many(transactions),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  player: one(players, { fields: [wallets.playerId], references: [players.id] }),
  balances: many(balances),
  transactions: many(transactions),
  operator: one(operators, { fields: [wallets.operatorId], references: [operators.id] }),
  vipRank: one(vipRanks, { fields: [wallets.vipRankId], references: [vipRanks.id] }),
}));

export const balancesRelations = relations(balances, ({ one }) => ({
  wallet: one(wallets, { fields: [balances.walletId], references: [wallets.id] }),
}));

export const playerBonusesRelations = relations(playerBonuses, ({ one }) => ({
  player: one(players, { fields: [playerBonuses.playerId], references: [players.id] }),
  bonus: one(bonuses, { fields: [playerBonuses.bonusId], references: [bonuses.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallets, { fields: [transactions.walletId], references: [wallets.id] }),
  player: one(players, { fields: [transactions.playerId], references: [players.id] }),
  game: one(games, { fields: [transactions.gameId], references: [games.id] }),
  operator: one(operators, { fields: [transactions.operatorId], references: [operators.id] }),
}));

export const vipRanksRelations = relations(vipRanks, ({ many }) => ({
  wallets: many(wallets),
}));

// Indexes (for performance in services)
export const balancesPlayerIdIdx = index('balances_player_id_idx').on(balances.walletId);
export const transactionsPlayerIdIdx = index('transactions_player_id_idx').on(
  transactions.playerId,
);
export const walletsPlayerIdIdx = index('wallets_player_id_idx').on(wallets.playerId);
