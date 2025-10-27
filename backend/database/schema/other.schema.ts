import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  real, // Changed from doublePrecision
  boolean,
  uniqueIndex,
  varchar,
  decimal, // Added
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { baseColumns, cents } from "./common.schema"; // Import cents
import {
  players,
  operators,
  games,
  transactions,
  vipRanks,
  ZVipRanksSelectSchema,
} from "./core.schema"; // Import core tables
import {
  depositStatusEnum,
  withdrawalStatusEnum,
  sessionStatusEnum,
  jackpotGroupEnum, // Assuming use of this enum
  kycStatusEnum,
  kycDocumentTypeEnum,
  loyaltyFundTransactionTypeEnum,
  progressTypeEnum,
} from "./enums.schema"; // Corrected import path
import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

// Deposits (from other.schema, refined)
export const deposits = pgTable(
  "deposits",
  {
    // Renamed table to plural
    ...baseColumns,
    playerId: text("player_id").notNull(), // reference defined in relations.ts
    transactionId: text("transaction_id"), // References transactions.id (the credit transaction)
    amount: cents("amount").notNull(),
    bonusAmount: cents("bonus_amount").notNull(),
    status: depositStatusEnum("status").default("PENDING").notNull(),
    paymentMethod: text("payment_method"), // Use paymentMethodEnum?
    referenceId: text("reference_id"), // Added from generated/deposit
    note: text("note"),
    metadata: jsonb("metadata"), // Store provider data, confirmation details, identifiers etc.
    // Removed firstName, lastName, channelsId, idNumber - store in metadata if needed
  },
  (table) => ({
    playerIdx: index("deposits_player_idx").on(table.playerId),
    statusIdx: index("deposits_status_idx").on(table.status),
    refIdx: index("deposits_ref_idx").on(table.referenceId), // Added index
    txIdx: uniqueIndex("deposits_tx_idx").on(table.transactionId), // Added index
  })
);

export const ZDepositsSelectSchema = createSelectSchema(deposits);
export const ZDepositsUpdateSchema = createUpdateSchema(deposits);
export type TDeposits = z.infer<typeof deposits>;
export type TDepositsSelect = typeof deposits.$inferSelect & TDeposits;

// Withdrawals (from other.schema, refined)
export const withdrawals = pgTable(
  "withdrawals",
  {
    // Renamed table to plural
    ...baseColumns,
    playerId: text("player_id")
      .notNull()
      .references(() => players.id),
    transactionId: text("transaction_id"), // References transactions.id (the debit transaction)
    amount: cents("amount").notNull(),
    status: withdrawalStatusEnum("status").default("PENDING").notNull(),
    payoutMethod: text("payout_method"), // Use payoutMethodEnum?
    note: text("note"),
    metadata: jsonb("metadata"), // Store payout details, admin actions, external IDs etc.
    // Removed firstName, lastName, channelsId, idNumber, currencyType - store in metadata
  },
  (table) => ({
    playerIdx: index("withdrawals_player_idx").on(table.playerId),
    statusIdx: index("withdrawals_status_idx").on(table.status),
    txIdx: uniqueIndex("withdrawals_tx_idx").on(table.transactionId), // Added index
  })
);

export const ZWithdrawalsSelectSchema = createSelectSchema(withdrawals);
export const ZWithdrawalsUpdateSchema = createUpdateSchema(withdrawals);
export type TWithdrawals = z.infer<typeof withdrawals>;
export type TWithdrawalsSelect = typeof withdrawals.$inferSelect & TWithdrawals;

// Game Sessions (from other.schema, refined)
export const gameSessions = pgTable(
  "game_sessions",
  {
    ...baseColumns,
    authSessionId: text("auth_session_id"), // Link to main auth session?
    playerId: text("player_id")
      .notNull()
      .references(() => players.id),
    gameId: text("game_id").references(() => games.id),
    gameName: text("game_name"), // Denormalized
    status: sessionStatusEnum("status").default("ACTIVE").notNull(),
    totalWagered: cents("total_wagered").default(0), // Use cents
    totalWon: cents("total_won").default(0), // Use cents
    startingBalance: cents("starting_balance"), // Use cents
    endingBalance: cents("ending_balance"), // Added for completeness
    duration: integer("duration").default(0), // Duration in seconds or ms?
    expiredTime: timestamp("expired_time", { mode: "date", precision: 3 }), // For auto-closing idle sessions
    // Removed totalXpGained, rtp (calculable), endAt (redundant with updatedAt + status=COMPLETED?)
  },
  (table) => ({
    playerIdx: index("game_sessions_player_idx").on(table.playerId),
    statusIdx: index("game_sessions_status_idx").on(table.status),
    authSessionIdx: index("game_sessions_auth_session_idx").on(
      table.authSessionId
    ),
  })
);

export const ZGameSessionsSelectSchema = createSelectSchema(gameSessions);
export const ZGameSessionsUpdateSchema = createUpdateSchema(gameSessions);
export type TGameSessions = z.infer<typeof gameSessions>;
export type TGameSessionsSelect = typeof gameSessions.$inferSelect &
  TGameSessions;

// Jackpots (from other.schema, refined)
export const jackpots = pgTable(
  "jackpots",
  {
    id: text("id").primaryKey(), // Use specific ID like 'minor', 'major', 'mega'?
    // ...baseColumns, // Use custom ID instead of base
    group: jackpotGroupEnum("group").notNull().unique(), // Use enum 'minor', 'major', 'mega'
    currentAmount: cents("current_amount").notNull(),
    seedAmount: cents("seed_amount").notNull(),
    maxAmount: cents("max_amount"), // Added from generated
    contributionRate: real("contribution_rate").notNull(), // Added config here
    minBet: cents("min_bet"), // Added config here
    // probabilityPerMillion: integer('probability_per_million'), // RNG logic likely outside DB
    lastWonAmount: cents("last_won_amount"), // Added for consistency
    lastWonAt: timestamp("last_won_at", { mode: "date", precision: 3 }),
    lastWonByPlayerId: text("last_won_by_player_id").references(
      () => players.id
    ),
    totalContributions: cents("total_contributions").default(0), // Added tracking
    totalWins: cents("total_wins").default(0), // Added tracking
    createdAt: timestamp("created_at", { mode: "date", precision: 3 })
      .defaultNow()
      .notNull(), // Add timestamps
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    // Removed type, percent, paySum, startBalance, minimumBetCoins, minimumTimeBetweenWinsMinutes, lastContribution - simplify/move config
  },
  (table) => ({
    groupIdx: uniqueIndex("jackpots_group_idx").on(table.group),
  })
);

export const ZJackpotsSelectSchema = createSelectSchema(jackpots);
export const ZJackpotsUpdateSchema = createUpdateSchema(jackpots);
export type TJackpots = z.infer<typeof jackpots>;
export type TJackpotsSelect = typeof jackpots.$inferSelect & TJackpots;

// Jackpot Contributions (from other.schema, refined)
export const jackpotContributions = pgTable(
  "jackpot_contributions",
  {
    ...baseColumns,
    jackpotGroup: jackpotGroupEnum("jackpot_group").notNull(), // References jackpots.group
    playerId: text("player_id").references(() => players.id),
    gameId: text("game_id").references(() => games.id), // Added game link
    betTransactionId: text("bet_transaction_id").references(
      () => transactions.id
    ), // Link to bet TXN
    wagerAmount: cents("wager_amount"), // Added wager info
    contributionAmount: cents("contribution_amount").notNull(),
  },
  (table) => ({
    jackpotGroupIdx: index("jackpot_contrib_group_idx").on(table.jackpotGroup),
    playerIdx: index("jackpot_contrib_player_idx").on(table.playerId),
    betTxIdx: index("jackpot_contrib_bet_tx_idx").on(table.betTransactionId),
  })
);

export const ZJackpotContributionsSelectSchema =
  createSelectSchema(jackpotContributions);
export const ZJackpotContributionsUpdateSchema =
  createUpdateSchema(jackpotContributions);
export type TJackpotContributions = z.infer<typeof jackpotContributions>;
export type TJackpotContributionsSelect =
  typeof jackpotContributions.$inferSelect & TJackpotContributions;

// Jackpot Wins (from other.schema, refined)
export const jackpotWins = pgTable(
  "jackpot_wins",
  {
    ...baseColumns,
    jackpotGroup: jackpotGroupEnum("jackpot_group").notNull(), // References jackpots.group
    winnerId: text("winner_id")
      .notNull()
      .references(() => players.id),
    winAmount: cents("win_amount").notNull(),
    gameId: text("game_id").references(() => games.id), // Added game link
    gameSessionId: text("game_session_id").references(() => gameSessions.id), // Optional link
    winTransactionId: text("win_transaction_id").references(
      () => transactions.id
    ), // Link to win TXN
    poolAmountBeforeWin: cents("pool_amount_before_win"), // Added from generated
  },
  (table) => ({
    jackpotGroupIdx: index("jackpot_wins_group_idx").on(table.jackpotGroup),
    winnerIdx: index("jackpot_wins_winner_idx").on(table.winnerId),
    winTxIdx: index("jackpot_wins_win_tx_idx").on(table.winTransactionId),
  })
);

export const ZJackpotWinsSelectSchema = createSelectSchema(jackpotWins);
export const ZJackpotWinsUpdateSchema = createUpdateSchema(jackpotWins);
export type TJackpotWins = z.infer<typeof jackpotWins>;
export type TJackpotWinsSelect = typeof jackpotWins.$inferSelect & TJackpotWins;

// Referral Codes (from other.schema, refined)
export const referralCodes = pgTable(
  "referral_codes",
  {
    ...baseColumns,
    code: text("code").notNull().unique(),
    name: text("name"), // Optional name for tracking campaigns
    ownerId: text("owner_id")
      .notNull()
      .references(() => players.id), // Who owns this code (player or affiliate)
    commissionRate: real("commission_rate"), // Specific rate for this code (overrides default?)
    // Removed playerId (renamed to ownerId for clarity)
  },
  (table) => ({
    codeIdx: uniqueIndex("referral_codes_code_idx").on(table.code),
    ownerIdx: index("referral_codes_owner_idx").on(table.ownerId),
  })
);

export const ZReferralCodesSelectSchema = createSelectSchema(referralCodes);
export const ZReferralCodesUpdateSchema = createUpdateSchema(referralCodes);
export type TReferralCodes = z.infer<typeof referralCodes>;
export type TReferralCodesSelect = typeof referralCodes.$inferSelect &
  TReferralCodes;

// export const settings = pgTable('settings', {
//   ...baseColumns, // Assuming 'id' is the primary key
//   name: text('name').notNull(),
//   referralCodeCount: integer('referral_code_count').notNull(),
//   referralCommissionRate: decimal('referral_commission_rate').notNull(),
//   rates: text('rates').notNull(),
//   commission: jsonb('commission').$type<z.infer<typeof CommissionSchema>>().notNull(),
//   jackpotConfig: jsonb('jackpot_config').$type<z.infer<typeof JackpotConfigSchema>>().notNull(),
//   vipConfig: jsonb('vip_config').$type<z.infer<typeof VipConfigSchema>>().notNull(),
//   wageringConfig: jsonb('wagering_config').$type<z.infer<typeof WageringConfigSchema>>().notNull(),
//   systemLimits: jsonb('system_limits').$type<z.infer<typeof SystemLimitsSchema>>().notNull(),
//   updatedAt: timestamp('udated_at', { withTimezone: true }).defaultNow().notNull(),
// });

// export const ZSettingsSelectSchema = createSelectSchema(settings);
// export const ZSettingsUpdateSchema = createUpdateSchema(settings);
// export type TSettings = z.infer<typeof settings>;
// export type TSettingsSelect = typeof settings.$inferSelect & TSettings;

// KYC Tables (from generated schema)
export const kycSubmissions = pgTable(
  "kyc_submissions",
  {
    ...baseColumns,
    playerId: text("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" })
      .unique(),
    status: kycStatusEnum("status").default("NOT_STARTED").notNull(),
    level: text("level").default("BASIC"), // e.g., BASIC, INTERMEDIATE, ADVANCED
    submittedAt: timestamp("submitted_at", { mode: "date", precision: 3 }),
    verifiedAt: timestamp("verified_at", { mode: "date", precision: 3 }),
    expiryDate: timestamp("expiry_date", { mode: "date", precision: 3 }),
    notes: text("notes"), // Admin notes
  },
  (table) => ({
    playerIdx: uniqueIndex("kyc_submissions_player_idx").on(table.playerId),
    statusIdx: index("kyc_submissions_status_idx").on(table.status),
  })
);

export const ZKycSubmissionsSelectSchema = createSelectSchema(kycSubmissions);
export const ZKycSubmissionsUpdateSchema = createUpdateSchema(kycSubmissions);
export type TKycSubmissions = z.infer<typeof kycSubmissions>;
export type TKycSubmissionsSelect = typeof kycSubmissions.$inferSelect &
  TKycSubmissions;

export const kycDocuments = pgTable(
  "kyc_documents",
  {
    ...baseColumns,
    submissionId: text("submission_id")
      .notNull()
      .references(() => kycSubmissions.id, { onDelete: "cascade" }),
    playerId: text("player_id")
      .notNull()
      .references(() => players.id), // Denormalized
    type: kycDocumentTypeEnum("type").notNull(),
    status: kycStatusEnum("status").default("PENDING").notNull(),
    documentNumber: text("document_number"),
    expiryDate: timestamp("expiry_date", { mode: "date", precision: 3 }),
    issueDate: timestamp("issue_date", { mode: "date", precision: 3 }),
    issuingCountry: varchar("issuing_country", { length: 2 }),

    frontImageUrl: text("front_image_url"),
    backImageUrl: text("back_image_url"),
    selfieImageUrl: text("selfie_image_url"),
    rejectionReason: text("rejection_reason"),
    verifiedAt: timestamp("verified_at", { mode: "date", precision: 3 }),
    // uploadedAt is covered by createdAt from baseColumns
  },
  (table) => ({
    submissionIdx: index("kyc_documents_submission_idx").on(table.submissionId),
    playerTypeIdx: index("kyc_documents_player_type_idx").on(
      table.playerId,
      table.type
    ),
  })
);

export const ZKycDocumentsSelectSchema = createSelectSchema(kycDocuments);
export const ZKycDocumentsUpdateSchema = createUpdateSchema(kycDocuments);
export type TKycDocuments = z.infer<typeof kycDocuments>;
export type TKycDocumentsSelect = typeof kycDocuments.$inferSelect &
  TKycDocuments;

// Password Logs (from generated schema)
export const passwordLogs = pgTable(
  "password_logs",
  {
    ...baseColumns,
    userId: text("user_id")
      .notNull()
      .references(() => players.id), // Changed to userId for consistency
    actorId: text("actor_id").references(() => players.id), // Who changed it
    ip: text("ip"),
    userAgent: text("user_agent"),
    device: text("device"),
    os: text("os"),
    browser: text("browser"),
    countryCode: varchar("country_code", { length: 2 }),
    countryName: text("country_name"),
  },
  (table) => ({
    userIdx: index("password_logs_user_idx").on(table.userId),
    actorIdx: index("password_logs_actor_idx").on(table.actorId),
  })
);

export const ZPasswordLogsSelectSchema = createSelectSchema(passwordLogs);
export const ZPasswordLogsUpdateSchema = createUpdateSchema(passwordLogs);
export type TPasswordLogs = z.infer<typeof passwordLogs>;
export type TPasswordLogsSelect = typeof passwordLogs.$inferSelect &
  TPasswordLogs;

// --- Keep potentially useful tables from original other.schema, review necessity ---
// Operator Switch History
export const operatorSwitchHistories = pgTable(
  "operator_switch_history",
  {
    ...baseColumns,
    playerId: text("player_id")
      .notNull()
      .references(() => players.id),
    fromOperatorId: text("from_operator_id").references(() => operators.id),
    toOperatorId: text("to_operator_id")
      .notNull()
      .references(() => operators.id),
    switchedAt: timestamp("switched_at", { mode: "date", precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    playerIdx: index("op_switch_player_idx").on(table.playerId),
    switchedAtIdx: index("op_switch_time_idx").on(table.switchedAt),
  })
);

export const ZOperatorSwitchHistoriesSelectSchema = createSelectSchema(
  operatorSwitchHistories
);
export const ZOperatorSwitchHistoriesUpdateSchema = createUpdateSchema(
  operatorSwitchHistories
);
export type TOperatorSwitchHistories = z.infer<typeof operatorSwitchHistories>;
export type TOperatorSwitchHistoriesSelect =
  typeof operatorSwitchHistories.$inferSelect & TOperatorSwitchHistories;

// Products (If selling credits/bundles)
export const products = pgTable(
  "products",
  {
    ...baseColumns,
    title: text("title").notNull(),
    productType: text("product_type").default("bundle").notNull(), // e.g., 'bundle', 'credits'
    priceInCents: cents("price_in_cents").notNull(),
    amountToReceiveInCredits: cents("amount_to_receive_in_credits").notNull(),
    bonusTotalInCredits: cents("bonus_total_in_credits").default(0),
    bonusSpins: integer("bonus_spins").default(0),
    isPromo: boolean("is_promo").default(false),
    operatorId: text("operator_id").references(() => operators.id), // Operator specific product?
    // Removed bestValue, discountInCents, totalDiscountInCents (calculable or less critical)
  },
  (table) => ({
    typeIdx: index("products_type_idx").on(table.productType),
  })
);

export const ZProductsSelectSchema = createSelectSchema(products);
export const ZProductsUpdateSchema = createUpdateSchema(products);
export type TProducts = z.infer<typeof products>;
export type TProductsSelect = typeof products.$inferSelect & TProducts;

// Operator Settlements
export const operatorSettlements = pgTable(
  "operator_settlements",
  {
    ...baseColumns,
    operatorId: text("operator_id")
      .notNull()
      .references(() => operators.id),
    periodStartDate: timestamp("period_start_date", {
      mode: "date",
      precision: 3,
    }).notNull(),
    periodEndDate: timestamp("period_end_date", {
      mode: "date",
      precision: 3,
    }).notNull(),
    totalTurnover: cents("total_turnover").default(0),
    totalPayouts: cents("total_payouts").default(0), // Player winnings
    grossGamingRevenue: cents("gross_gaming_revenue"), // turnover - payouts
    platformFee: cents("platform_fee"), // Amount charged by platform
    loyaltyFundContribution: cents("loyalty_fund_contribution"), // Amount contributed to loyalty
    netToOperator: cents("net_to_operator"), // GGR - fees - contributions
    status: text("status").default("PENDING"), // PENDING, PAID
  },
  (table) => ({
    operatorPeriodIdx: index("op_settlement_period_idx").on(
      table.operatorId,
      table.periodStartDate
    ),
  })
);

export const ZOperatorSettlementsSelectSchema =
  createSelectSchema(operatorSettlements);
export const ZOperatorSettlementsUpdateSchema =
  createUpdateSchema(operatorSettlements);
export type TOperatorSettlements = z.infer<typeof operatorSettlements>;
export type TOperatorSettlementsSelect =
  typeof operatorSettlements.$inferSelect & TOperatorSettlements;

// Loyalty Fund Transactions
export const loyaltyFundTransactions = pgTable(
  "loyalty_fund_transactions",
  {
    ...baseColumns,
    type: loyaltyFundTransactionTypeEnum("type").notNull(), // CONTRIBUTION, PAYOUT
    amount: cents("amount").notNull(),
    description: text("description"),
    operatorId: text("operator_id").references(() => operators.id), // Contribution from operator
    playerId: text("player_id").references(() => players.id), // Payout to player
    relatedTransactionId: text("related_transaction_id"), // Link to settlement or payout TXN
  },
  (table) => ({
    typeIdx: index("loyalty_type_idx").on(table.type),
    operatorIdx: index("loyalty_operator_idx").on(table.operatorId),
    playerIdx: index("loyalty_player_idx").on(table.playerId),
  })
);

export const ZLoyaltyFundTransactionsSelectSchema = createSelectSchema(
  loyaltyFundTransactions
);
export const ZLoyaltyFundTransactionsUpdateSchema = createUpdateSchema(
  loyaltyFundTransactions
);
export type TLoyaltyFundTransactions = z.infer<typeof loyaltyFundTransactions>;
export type TLoyaltyFundTransactionsSelect =
  typeof loyaltyFundTransactions.$inferSelect & TLoyaltyFundTransactions;

// --- Relations for tables in this file ---
// Relations are moved to a separate relations file to avoid circular dependencies

export const BonusSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  option: z.string(),
  percent: z.number(),
  multiply: z.number(),
  bonusCap: z.number(),
  minBet: z.number(),
  maxBet: z.number(),
  minVipLevel: z.number(),
  maxVipLevel: z.number(),
  slot: z.boolean(),
  casino: z.boolean(),
  isActive: z.boolean(),
  autoCalc: z.boolean(),
  expireDate: z.coerce.date(),
  banner: z.string(),
  particularData: z.union([z.null(), z.string()]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Bonus = z.infer<typeof BonusSchema>;

export const ProductElementSchema = z.object({
  title: z.string(),
  productType: z.string(),
  bonusTotalInCredits: z.number(),
  discountInCents: z.number(),
  bestValue: z.number(),
  amountToReceiveInCredits: z.number(),
  totalDiscountInCents: z.number(),
  bonusSpins: z.number(),
  isPromo: z.boolean(),
  description: z.string(),
  url: z.string(),
  priceInCents: z.number(),
});
export type ProductElement = z.infer<typeof ProductElementSchema>;

export const ParentIdSchema = z.enum([
  "bronze-tier",
  "diamond-tier",
  "gold-tier",
  "platinum-tier",
  "silver-tier",
]);
export type ParentId = z.infer<typeof ParentIdSchema>;

export const CommissionSchema = z.object({
  master: z.number(),
  affiliate: z.number(),
  subAffiliate: z.number(),
});
export type Commission = z.infer<typeof CommissionSchema>;

export const MajorSchema = z.object({
  rate: z.number(),
  seedAmount: z.number(),
  maxAmount: z.number(),
});
export type Major = z.infer<typeof MajorSchema>;

export const SystemLimitsSchema = z.object({
  maxBetAmount: z.number(),
  maxDailyLoss: z.number(),
  maxSessionLoss: z.number(),
  minBetAmount: z.number(),
});
export type SystemLimits = z.infer<typeof SystemLimitsSchema>;

export const VipLevelSchema = z.object({
  id: z.string(),
  parent_id: ParentIdSchema,
  level_name: z.string(),
  xp: z.number(),
  settingId: z.string(),
  dailyBonusMultiplier: z.number(),
});
export type VipLevel = z.infer<typeof VipLevelSchema>;

// export const VipRankSchema = z.object({
//   id: z.number(),
//   level: z.number(),
//   name: z.string(),
//   icon: z.string(),
//   depositExp: z.number(),
//   minXp: z.number(),
//   uprankAward: z.number(),
//   weekAward: z.number().optional(),
//   hasConcierge: z.boolean(),
//   hasVipLoungeAccess: z.boolean(),
//   isInvitationOnly: z.boolean(),
//   xpForNext: z.number(),
//   dailyBonusCoinPct: z.number(),
//   hourlyBonusCoinPct: z.number(),
//   levelUpBonusCoinPct: z.number(),
//   purchaseBonusCoinPct: z.number(),
//   wagerBonusCoinPct: z.number(),
//   dailyCashbackMax: z.number(),
//   monthlyCashbackMax: z.number(),
// });
// export type VipRank = z.infer<typeof VipRankSchema>;

export const WageringConfigSchema = z.object({
  defaultWageringMultiplier: z.number(),
  maxBonusBetPercentage: z.number(),
  bonusExpiryDays: z.number(),
});
export type WageringConfig = z.infer<typeof WageringConfigSchema>;

export const JackpotConfigSchema = z.object({
  minor: MajorSchema,
  major: MajorSchema,
  mega: MajorSchema,
});
export type JackpotConfig = z.infer<typeof JackpotConfigSchema>;

export const VipConfigSchema = z.object({
  pointsPerDollar: z.number(),
  levelMultipliers: z.record(z.string(), z.number()),
  costSharingPercentage: z.number(),
  vipLevels: z.array(VipLevelSchema),
  vipRanks: z.array(ZVipRanksSelectSchema),
});
export type VipConfig = z.infer<typeof VipConfigSchema>;

export const SettingSchema = z.object({
  id: z.string(),
  name: z.string(),
  default: z.boolean(),
  referralCodeCount: z.number().default(0),
  depositWRMultiplier: z.number().default(1),
  bonusWRMultiplier: z.number().default(30),
  freeSpinWRMultiplier: z.number().default(30),
  avgFreeSpinWinValue: z.number().default(15),
  referralCommissionRate: z.number(),
  rates: z.json(),
  commission: CommissionSchema,
  jackpotConfig: JackpotConfigSchema,
  vipConfig: VipConfigSchema,
  wageringConfig: WageringConfigSchema,
  systemLimits: SystemLimitsSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Settings = z.infer<typeof SettingSchema>;
