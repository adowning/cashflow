import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  index,
  real,
  uniqueIndex, // Added for games.name
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { baseColumns, cents } from "./common.schema";
import {
  bonusStatusEnum,
  paymentMethodEnum,
  transactionStatusEnum,
  transactionTypeEnum,
  userStatusEnum,
  gameStatusEnum,
  gameCategoriesEnum,
  kycStatusEnum,
} from "./enums.schema";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type z from "zod";
// createId is now imported in common.schema.ts, but not needed here directly
// import { createId } from "@paralleldrive/cuid2";

// Players: Core user entity - Merged players from core.schema & generated schema
export const players = pgTable(
  "players",
  {
    ...baseColumns,
    // Renamed from playername for clarity
    playername: text("username").notNull().unique(),
    image: text("image"),
    status: userStatusEnum("status").default("ACTIVE").notNull(),
    avatarUrl: text("avatar_url")
      .default(
        "https://gameui.cashflowcasino.com/public/avatars/avatar-01.webp"
      )
      .notNull(),
    phone: text("phone"),
    referralCode: text("referral_code"),
    vipLevel: integer("vip_level").default(1).notNull(),
    vipPoints: integer("vip_points").default(0).notNull(),
    vipRankId: text("vip_rank_id"), // Links to vipRanks
    rtgBlockTime: integer("rtg_block_time"),
    kycStatus: kycStatusEnum("kyc_status").default("NOT_STARTED"),
    // Affiliate linkage
    invitorId: text("invitor_id"), // References affiliates.id (defined in vip.schema)
    inviteCode: text("invite_code"),
    path: text("path").array(),
    isAffiliate: boolean("is_affiliate").default(false),
    referralInit: boolean("referral_init").default(false),
    lastVipLevelAmount: cents("last_vip_level_amount"),
  },
  (t) => ({
    // Indexes are defined within a callback function
    statusIdx: index("players_status_idx").on(t.status),
    invitorIdx: index("players_invitor_idx").on(t.invitorId),
    // unique index on username is automatically created by .unique()
  })
);
// Zod schema for players
export const ZPlayerSelectSchema = createSelectSchema(players);
export const ZPlayerUpdateSchema = createUpdateSchema(players);

// Clearer type exports
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

// Balances: Holds actual monetary values, linked directly to Player
export const balances = pgTable("balances", {
  // Use player ID as primary key assuming one balance record per player
  playerId: text("player_id")
    .primaryKey()
    .references(() => players.id, { onDelete: "cascade" }),
  realBalance: cents("real_balance").default(0).notNull(),
  bonusBalance: cents("bonus_balance").default(0).notNull(),
  // Aggregate/calculated fields
  turnover: cents("turnover").default(0),
  withdrawable: cents("withdrawable").default(0),
  pending: cents("pending").default(0),
  updatedAt: timestamp("updated_at", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`), // Need separate updatedAt
});

// Zod schemas for balances
export const ZBalancesSelectSchema = createSelectSchema(balances);
export const ZBalancesUpdateSchema = createUpdateSchema(balances);

export type Balance = typeof balances.$inferSelect;
export type NewBalance = typeof balances.$inferInsert;

// Operators: (From core.schema)
export const operators = pgTable("operators", {
  ...baseColumns,
  name: text("name").notNull().unique(),
});

// Zod schemas for operators
export const ZOperatorsSelectSchema = createSelectSchema(operators);
export const ZOperatorsUpdateSchema = createUpdateSchema(operators);

export type Operator = typeof operators.$inferSelect;
export type NewOperator = typeof operators.$inferInsert;

// Games: Merged from core.schema and generated schema
export const games = pgTable(
  "games",
  {
    // Use standardized base columns
    ...baseColumns,
    // Name is no longer PK, but should be unique
    name: text("name").notNull(),
    title: text("title"),
    description: text("description"),
    category: gameCategoriesEnum("category").default("SLOTS").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    bannerUrl: text("banner_url"),
    developer: text("developer"),
    operatorId: text("operator_id").references(() => operators.id),
    targetRtp: real("target_rtp"),
    status: gameStatusEnum("status").default("ACTIVE").notNull(),
    minBet: cents("min_bet").default(100),
    maxBet: cents("max_bet").default(100000),
    isFeatured: boolean("is_featured").default(false),
    jackpotGroup: text("jackpot_group"),
    goldsvetData: jsonb("goldsvet_data"),
    // Removed manual updatedAt, it's in baseColumns
  },
  (t) => ({
    // Add unique index for name
    categoryIdx: index("games_category_idx").on(t.category),
    operatorIdx: index("games_operator_idx").on(t.operatorId),
    statusIdx: index("games_status_idx").on(t.status),
  })
);

// Zod schemas for games
export const ZGamesSelectSchema = createSelectSchema(games);
export const ZGamesUpdateSchema = createUpdateSchema(games);

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;

// Transactions: Central log - Merged core.schema and generated schema
export const transactions = pgTable(
  "transactions",
  {
    // Use standardized base columns
    ...baseColumns,
    // Removed manual id, createdAt, updatedAt
    playerId: text("player_id")
      .notNull()
      .references(() => players.id),
    relatedId: text("related_id"),
    sessionId: text("session_id"),
    tnxId: text("tnx_id").unique(),
    type: transactionTypeEnum("type").notNull(),
    typeDescription: text("type_description"),
    status: transactionStatusEnum("status").default("COMPLETED").notNull(),
    wagerAmount: cents("wager_amount"),
    // Balance Snapshots (CRITICAL for audit)
    realBalanceBefore: cents("real_balance_before").notNull(),
    realBalanceAfter: cents("real_balance_after").notNull(),
    bonusBalanceBefore: cents("bonus_balance_before").notNull(),
    bonusBalanceAfter: cents("bonus_balance_after").notNull(),
    // References
    // IMPORTANT: Changed to reference games.id instead of games.name
    gameId: text("game_id").references(() => games.id),
    gameName: text("game_name"), // Denormalized
    provider: text("provider"), // Denormalized game provider (developer)
    category: text("category"), // Denormalized game category
    operatorId: text("operator_id").references(() => operators.id),
    // Contributions
    ggrContribution: cents("ggr_contribution"),
    jackpotContribution: cents("jackpot_contribution"),
    vipPointsAdded: integer("vip_points_added"),
    // Metadata
    processingTime: integer("processing_time"),
    metadata: jsonb("metadata"),
    // Affiliate Tracking
    affiliateName: text("affiliate_id"),
    path: text("path").array(),
  },
  (t) => ({
    playerIdx: index("transactions_player_idx").on(t.playerId),
    typeIdx: index("transactions_type_idx").on(t.type),
    statusIdx: index("transactions_status_idx").on(t.status),
    gameIdx: index("transactions_game_idx").on(t.gameId),
  })
);

// Zod schemas for transactions
export const ZTransactionsSelectSchema = createSelectSchema(transactions);
export const ZTransactionsUpdateSchema = createUpdateSchema(transactions);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

// VIP Ranks: Configuration for levels (from core.schema)
export const vipRanks = pgTable("vip_ranks", {
  ...baseColumns,
  name: text("name").notNull().unique(),
  minXp: integer("min_xp").notNull(),
  level: integer("level").notNull().unique(),
  icon: text("icon"),
  // Rewards
  dailyCashbackMax: cents("daily_cashback_max").default(0),
  monthlyCashbackMax: cents("monthly_cashback_max").default(0),
  benefits: jsonb("benefits"),
  multiplier: real("multiplier").default(1.0),
});

// Zod schemas for vipRanks
export const ZVipRanksSelectSchema = createSelectSchema(vipRanks);
export const ZVipRanksUpdateSchema = createUpdateSchema(vipRanks);

export type VipRank = typeof vipRanks.$inferSelect;
export type NewVipRank = typeof vipRanks.$inferInsert;

// --- Relations ---
// ALL relations definitions are removed from this file.
// They should be defined in a central `schema/relations.ts` file
// to avoid circular dependencies.
