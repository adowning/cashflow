import {
  pgTable,
  text,
  integer,
  jsonb,
  real, // Changed from doublePrecision
  uniqueIndex, // Added
  index,
  boolean,
  timestamp,
  type AnyPgColumn,
  varchar,
  doublePrecision, // Added
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns, cents } from './common.schema';
import { bonusStatusEnum, userRoleEnum } from './enums.schema'; // Corrected import path
import { players, vipRanks } from './core.schema'; // Import core tables
import { createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from 'zod';

// vipLevels renamed to vipRanks in core.schema - remove vipLevels here if redundant
export const vipLevels = pgTable('vip_levels', {
  parentId: text('parent_id').notNull(),
  minXpNeeded: integer('min_xp_needed').default(0).notNull(),
  levelNumber: integer('level_number').default(0).notNull(),
  levelName: text('level_name').notNull(),
  levelUpBonusAmount: integer('level_up_bonus_amount').default(0).notNull(),
  spinBonusMultiplier: doublePrecision('spin_bonus_multiplier_id').default(0.1).notNull(),
  settingId: text('setting_id'),
});

// Bonuses: Bonus definitions (Merged from core.schema and generated)
export const bonuses = pgTable(
  'bonuses',
  {
    ...baseColumns,
    name: text('name').notNull(),
    type: text('type').notNull(), // Use bonusTypeEnum? Requires definition in enums.ts
    description: text('description'),
    amount: cents('amount'), // Fixed amount for certain bonus types
    percentage: real('percentage'), // For match bonuses
    maxAmount: cents('max_amount'), // Cap for percentage bonuses
    wageringMultiplier: real('wagering_multiplier').notNull(),
    expiryDays: integer('expiry_days'),
    maxBet: cents('max_bet'), // Max bet allowed with bonus
    // Game Restrictions
    allowedGameTypes: text('allowed_game_types').array(),
    excludedGameIds: text('excluded_game_ids').array(),
    slot: boolean('slot').default(true), // Eligible for slots?
    casino: boolean('casino').default(true), // Eligible for table games?
    // Contribution/Multipliers
    contributionPercentage: real('contribution_percentage').default(100),
    vipPointsMultiplier: real('vip_points_multiplier').default(1.0),
    // Removed wageringRequirement (use wageringMultiplier), gameRestrictions array (use specific fields)
  },
  (table) => ({
    nameIdx: uniqueIndex('bonuses_name_idx').on(table.name),
  }),
);

export const ZBonusesSelectSchema = createSelectSchema(bonuses);
export const ZBonusesUpdateSchema = createUpdateSchema(bonuses);
export type TBonuses = z.infer<typeof bonuses>;
export type TBonusesSelect = typeof bonuses.$inferSelect & TBonuses;

// Player Bonuses: Specific bonus instances for players (Merged from core.schema and generated)
export const playerBonuses = pgTable(
  'player_bonuses',
  {
    ...baseColumns,
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    bonusId: text('bonus_id')
      .notNull()
      .references(() => bonuses.id),
    status: bonusStatusEnum('status').default('ACTIVE').notNull(), // Changed default to ACTIVE
    awardedAmount: cents('awarded_amount').notNull(),
    wageringRequired: cents('wagering_required').notNull(),
    wageringProgress: cents('wagering_progress').default(0).notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date', precision: 3 }),
    activatedAt: timestamp('activated_at', { mode: 'date', precision: 3 }),
    completedAt: timestamp('completed_at', { mode: 'date', precision: 3 }),
    // Removed amount, processAmount, goalAmount (redundant with awardedAmount, wageringProgress, wageringRequired)
    // Removed betsIds (can be inferred from transactions linked via relatedId if necessary)
  },
  (table) => ({
    playerBonusIdx: index('player_bonuses_player_bonus_idx').on(table.playerId, table.bonusId),
    statusIdx: index('player_bonuses_status_idx').on(table.status),
    expiresAtIdx: index('player_bonuses_expires_idx').on(table.expiresAt),
  }),
);

export const ZPlayerBonusesSelectSchema = createSelectSchema(playerBonuses);
export const ZPlayerBonusesUpdateSchema = createUpdateSchema(playerBonuses);
export type TPlayerBonuses = z.infer<typeof playerBonuses>;
export type TPlayerBonusesSelect = typeof playerBonuses.$inferSelect & TPlayerBonuses;

// Affiliates: Can be players with specific role/data
export const affiliates = pgTable(
  'affiliates',
  {
    id: text('id')
      .primaryKey()
      .references(() => players.id, { onDelete: 'cascade' }), // Link to players table ID
    referralCode: text('referral_code').notNull().unique(),
    parentId: text('parent_id').references((): AnyPgColumn => affiliates.id), // Self-reference
    path: text('path').array(), // Hierarchy path
    commissionRate: real('commission_rate'), // Custom rate override?
    // Inherits name, email, status etc. from players table
    // createdAt/updatedAt also inherited via baseColumns on players
  },
  (table) => ({
    referralCodeIdx: uniqueIndex('affiliates_ref_code_idx').on(table.referralCode),
    parentIdx: index('affiliates_parent_idx').on(table.parentId),
  }),
);

export const ZAffiliatesSelectSchema = createSelectSchema(affiliates);
export const ZAffiliatesUpdateSchema = createUpdateSchema(affiliates);
export type TAffiliates = z.infer<typeof affiliates>;
export type TAffiliatesSelect = typeof affiliates.$inferSelect & TAffiliates;

// Affiliate Logs: Tracks commissionable events (Merged from vip.schema and generated)
export const affiliateLogs = pgTable(
  'affiliate_logs',
  {
    ...baseColumns,
    betTransactionId: text('bet_transaction_id'), // References transactions.id - MAKE NOT NULL?
    invitorId: text('invitor_id')
      .notNull()
      .references(() => affiliates.id), // Affiliate who earned
    childId: text('child_id')
      .notNull()
      .references(() => players.id), // Player who bet
    referralCode: text('referral_code'), // Denormalized code used
    tier: integer('tier'), // Hierarchy level (0 = direct, 1 = sub, etc.)
    betAmount: cents('bet_amount'), // Original wager
    ggrAmount: cents('ggr_amount'), // GGR from this bet
    commissionRate: real('commission_rate'), // Rate applied
    commissionAmount: cents('commission_amount'), // Calculated commission
    payoutId: text('payout_id'), // References affiliatePayouts.id
    // Removed redundant fields like commissionWager, totalReferralAmount, etc. unless their specific purpose is clarified
  },
  (table) => ({
    invitorDateIdx: index('affiliate_logs_invitor_date_idx').on(table.invitorId, table.createdAt),
    childIdx: index('affiliate_logs_child_idx').on(table.childId),
    payoutIdx: index('affiliate_logs_payout_idx').on(table.payoutId),
    betTxIdx: index('affiliate_logs_bet_tx_idx').on(table.betTransactionId),
  }),
);

export const ZAffiliateLogsSelectSchema = createSelectSchema(affiliateLogs);
export const ZAffiliateLogsUpdateSchema = createUpdateSchema(affiliateLogs);
export type TAffiliateLogs = z.infer<typeof affiliateLogs>;
export type TAffiliateLogsSelect = typeof affiliateLogs.$inferSelect & TAffiliateLogs;

// Affiliate Payouts: Tracks payout batches (From generated)
export const affiliatePayouts = pgTable(
  'affiliate_payouts',
  {
    ...baseColumns,
    affiliateId: text('affiliate_id')
      .notNull()
      .references(() => affiliates.id),
    weekStart: timestamp('week_start', { mode: 'date', precision: 3 }).notNull(),
    weekEnd: timestamp('week_end', { mode: 'date', precision: 3 }).notNull(),
    totalGGR: cents('total_ggr').notNull(),
    commissionRate: real('commission_rate').notNull(),
    commissionAmount: cents('commission_amount').notNull(),
    status: varchar('status', { length: 20 }).default('PENDING'), // PENDING, PROCESSING, PAID, FAILED

    transactionId: text('transaction_id'), // References transactions.id (the payout transaction)
    paidAt: timestamp('paid_at', { mode: 'date', precision: 3 }),
  },
  (table) => ({
    affiliateWeekIdx: index('affiliate_payouts_week_idx').on(table.affiliateId, table.weekStart),
    statusIdx: index('affiliate_payouts_status_idx').on(table.status),
  }),
);

export const ZAffiliatePayoutsSelectSchema = createSelectSchema(affiliatePayouts);
export const ZAffiliatePayoutsUpdateSchema = createUpdateSchema(affiliatePayouts);
export type TAffiliatePayouts = z.infer<typeof affiliatePayouts>;
export type TAffiliatePayoutsSelect = typeof affiliatePayouts.$inferSelect & TAffiliatePayouts;

// VIP Specific Reward/Log Tables (From vip.schema)
// Keeping these separate for clarity, link to players table

export const vipCashbacks = pgTable(
  'vip_cashbacks',
  {
    ...baseColumns,
    playerId: text('player_id')
      .notNull()
      .references(() => players.id),
    amount: cents('amount').notNull(),
    periodStart: timestamp('period_start', { mode: 'date', precision: 3 }),
    periodEnd: timestamp('period_end', { mode: 'date', precision: 3 }),
    vipLevel: integer('vip_level'), // Level at time of cashback
    type: text('type').notNull(), // e.g., 'DAILY', 'WEEKLY', 'MONTHLY'
    transactionId: text('transaction_id'), // Link to transaction crediting cashback
  },
  (table) => ({
    playerPeriodIdx: index('vip_cashbacks_player_period_idx').on(table.playerId, table.periodStart),
  }),
);

export const ZVipCashbacksSelectSchema = createSelectSchema(vipCashbacks);
export const ZVipCashbacksUpdateSchema = createUpdateSchema(vipCashbacks);
export type TVipCashbacks = z.infer<typeof vipCashbacks>;
export type TVipCashbacksSelect = typeof vipCashbacks.$inferSelect & TVipCashbacks;

export const vipLevelUpBonuses = pgTable(
  'vip_level_up_bonuses',
  {
    ...baseColumns,
    playerId: text('player_id')
      .notNull()
      .references(() => players.id),
    amount: cents('amount').notNull(), // Bonus amount credited
    vipLevelAchieved: integer('vip_level_achieved').notNull(),
    transactionId: text('transaction_id'), // Link to transaction crediting bonus
  },
  (table) => ({
    playerLevelIdx: index('vip_levelup_player_level_idx').on(
      table.playerId,
      table.vipLevelAchieved,
    ),
  }),
);

export const ZVipLevelUpBonusesSelectSchema = createSelectSchema(vipLevelUpBonuses);
export const ZVipLevelUpBonusesUpdateSchema = createUpdateSchema(vipLevelUpBonuses);
export type TVipLevelUpBonuses = z.infer<typeof vipLevelUpBonuses>;
export type TVipLevelUpBonusesSelect = typeof vipLevelUpBonuses.$inferSelect & TVipLevelUpBonuses;

export const vipSpinRewards = pgTable(
  'vip_spin_rewards',
  {
    ...baseColumns,
    playerId: text('player_id')
      .notNull()
      .references(() => players.id),
    spinCount: integer('spin_count').notNull(),
    gameId: text('game_id'), // Optional: specific game for spins
    reason: text('reason'), // e.g., 'LevelUp', 'Promotion'
    claimed: boolean('claimed').default(false),
    expiresAt: timestamp('expires_at', { mode: 'date', precision: 3 }),
  },
  (table) => ({
    playerIdx: index('vip_spin_rewards_player_idx').on(table.playerId),
  }),
);

export const ZVipSpinRewardsSelectSchema = createSelectSchema(vipSpinRewards);
export const ZVipSpinRewardsUpdateSchema = createUpdateSchema(vipSpinRewards);
export type TVipSpinRewards = z.infer<typeof vipSpinRewards>;
export type TVipSpinRewardsSelect = typeof vipSpinRewards.$inferSelect & TVipSpinRewards;

// Commissions (Structure for different affiliate levels - from vip.schema)
export const commissions = pgTable(
  'commissions',
  {
    ...baseColumns,
    level: integer('level').notNull().unique(), // e.g., 0 for master, 1 for affiliate, 2 for sub
    name: text('name').notNull(), // e.g., 'Master', 'Affiliate', 'Sub-Affiliate'
    rate: real('rate').notNull(), // Commission percentage (e.g., 30.0 for 30%)
    // settingId: text('setting_id').references(() => settings.id), // Link to main settings potentially
  },
  (table) => ({
    levelIdx: uniqueIndex('commissions_level_idx').on(table.level),
  }),
);

export const ZCommissionsSelectSchema = createSelectSchema(commissions);
export const ZCommissionsUpdateSchema = createUpdateSchema(commissions);
export type TCommissions = z.infer<typeof commissions>;
export type TCommissionsSelect = typeof commissions.$inferSelect & TCommissions;

// --- Relations ---

export const bonusesRelations = relations(bonuses, ({ many }) => ({
  playerBonuses: many(playerBonuses),
}));

export const playerBonusesRelations = relations(playerBonuses, ({ one }) => ({
  player: one(players, {
    fields: [playerBonuses.playerId],
    references: [players.id],
  }),
  bonus: one(bonuses, {
    fields: [playerBonuses.bonusId],
    references: [bonuses.id],
  }),
}));

export const affiliatesRelations = relations(affiliates, ({ one, many }) => ({
  player: one(players, {
    // Link back to the player record
    fields: [affiliates.id],
    references: [players.id],
  }),
  parent: one(affiliates, {
    fields: [affiliates.parentId],
    references: [affiliates.id],
    relationName: 'parentAffiliate',
  }),
  children: many(affiliates, {
    // Children affiliates of this affiliate
    relationName: 'parentAffiliate',
  }),
  invitedPlayers: many(players, {
    // Players directly invited by this affiliate
    relationName: 'invitedByAffiliate',
  }),
  logs: many(affiliateLogs),
  payouts: many(affiliatePayouts),
}));

export const affiliateLogsRelations = relations(affiliateLogs, ({ one }) => ({
  betTransaction: one(transactions, {
    // Import 'transactions' from core.schema
    fields: [affiliateLogs.betTransactionId],
    references: [transactions.id],
  }),
  invitor: one(affiliates, {
    fields: [affiliateLogs.invitorId],
    references: [affiliates.id],
  }),
  child: one(players, {
    fields: [affiliateLogs.childId],
    references: [players.id],
  }),
  payout: one(affiliatePayouts, {
    fields: [affiliateLogs.payoutId],
    references: [affiliatePayouts.id],
  }),
}));

export const affiliatePayoutRelations = relations(affiliatePayouts, ({ one, many }) => ({
  affiliate: one(affiliates, {
    fields: [affiliatePayouts.affiliateId],
    references: [affiliates.id],
  }),
  logsIncluded: many(affiliateLogs),
  payoutTransaction: one(transactions, {
    // Import 'transactions' from core.schema
    fields: [affiliatePayouts.transactionId],
    references: [transactions.id],
  }),
}));

export const vipCashbacksRelations = relations(vipCashbacks, ({ one }) => ({
  player: one(players, {
    fields: [vipCashbacks.playerId],
    references: [players.id],
  }),
  transaction: one(transactions, {
    // Import 'transactions' from core.schema
    fields: [vipCashbacks.transactionId],
    references: [transactions.id],
  }),
}));

export const vipLevelUpBonusesRelations = relations(vipLevelUpBonuses, ({ one }) => ({
  player: one(players, {
    fields: [vipLevelUpBonuses.playerId],
    references: [players.id],
  }),
  transaction: one(transactions, {
    // Import 'transactions' from core.schema
    fields: [vipLevelUpBonuses.transactionId],
    references: [transactions.id],
  }),
}));

export const vipSpinRewardsRelations = relations(vipSpinRewards, ({ one }) => ({
  player: one(players, {
    fields: [vipSpinRewards.playerId],
    references: [players.id],
  }),
  game: one(games, {
    // Import 'games' from core.schema
    fields: [vipSpinRewards.gameId],
    references: [games.id],
  }),
}));

// export const commissionsRelations = relations(commissions, ({ one }) => ({
//   setting: one(settings, {
//     fields: [commissions.settingId],
//     references: [settings.id],
//   }),
// }));

// Need to import transactions if not already done
import { transactions } from './core.schema';
import { games } from './core.schema';
