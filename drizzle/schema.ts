import { pgTable, text, timestamp, boolean, doublePrecision, integer, jsonb, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const bonusStatus = pgEnum("BonusStatus", ['pending', 'active', 'completed', 'expired', 'cancelled'])
export const gameProviderName = pgEnum("GameProviderName", ['pragmaticplay', 'evoplay', 'netent', 'playngo', 'relaxgaming', 'hacksaw', 'bgaming', 'spribe', 'internal', 'redtiger', 'netgame', 'bigfishgames', 'cqnine', 'nolimit', 'kickass'])
export const loyaltyFundTransactionType = pgEnum("LoyaltyFundTransactionType", ['CONTRIBUTION', 'PAYOUT'])
export const paymentMethod = pgEnum("PaymentMethod", ['INSTORE_CASH', 'INSTORE_CARD', 'CASH_APP'])
export const permission = pgEnum("Permission", ['read', 'write', 'upload', 'manage_players', 'manage_settings', 'launch_game'])
export const playerRole = pgEnum("PlayerRole", ['PLAYER', 'ADMIN', 'MODERATOR', 'SUPPORT', 'BOT', 'SYSTEM'])
export const progressTypeEnum = pgEnum("ProgressTypeEnum", ['one_pay', 'sum_pay'])
export const role = pgEnum("Role", ['USER', 'PLAYER', 'ADMIN', 'VIP', 'MODERATOR', 'SYSTEM', 'OWNER', 'MEMBER', 'OPERATOR', 'SUPPORT_AGENT'])
export const status = pgEnum("Status", ['ACTIVE', 'INACTIVE', 'BANNED'])
export const systemEnum = pgEnum("SystemEnum", ['player', 'shop', 'bank', 'jpg', 'refund', 'happyhour', 'pincode', 'handpay', 'interkassa', 'coinbase', 'btcpayserver', 'invite', 'progress', 'tournament', 'daily_entry', 'welcome_bonus', 'sms_bonus', 'wheelfortune'])
export const tournamentStatus = pgEnum("TournamentStatus", ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
export const transactionStatus = pgEnum("TransactionStatus", ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'EXPIRED', 'REJECTED', 'REQUIRES_ACTION', 'ON_HOLD'])
export const typeEnum = pgEnum("TypeEnum", ['add', 'out'])
export const typeOfJackpot = pgEnum("TypeOfJackpot", ['MINOR', 'MAJOR', 'GRAND'])
export const typeOfTransaction = pgEnum("TypeOfTransaction", ['DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN', 'TRANSFER_SENT', 'TRANSFER_RECEIVED', 'SYSTEM_ADJUSTMENT_CREDIT', 'SYSTEM_ADJUSTMENT_DEBIT', 'TOURNAMENT_BUYIN', 'TOURNAMENT_PRIZE', 'AFFILIATE_COMMISSION', 'REFUND', 'FEE', 'BONUS_AWARD', 'BET_PLACE', 'BET_WIN', 'BET_LOSE', 'BET_REFUND', 'BONUS_WAGER', 'BONUS_CONVERT', 'BONUS_EXPIRED', 'XP_AWARD', 'ADJUSTMENT_ADD', 'ADJUSTMENT_SUB', 'INTERNAL_TRANSFER', 'PRODUCT_PURCHASE', 'REBATE_PAYOUT', 'JACKPOT_WIN', 'JACKPOT_CONTRIBUTION', 'LOYALTY_CASHBACK', 'LEVEL_UP_BONUS'])
export const gameCategories = pgEnum("game_categories", ['slots', 'fish', 'table', 'live', 'poker', 'lottery', 'virtual', 'other'])
export const messageType = pgEnum("message_type", ['update:wallet', 'update:vip', 'update:balance', 'update:gameSession'])
export const sessionStatus = pgEnum("session_status", ['ACTIVE', 'COMPLETED', 'EXPIRED', 'ABANDONED', 'TIMEOUT', 'OTP_PENDING'])
export const updateType = pgEnum("update_type", ['BINARY', 'OTA'])


export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ precision: 3, mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ precision: 3, mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	token: text().notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull(),
	playerId: text().notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	username: text(),
	role: text().default('USER').notNull(),
	banned: boolean().default(false).notNull(),
	displayUsername: text(),
	twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
	playerId: text("player_id"),
	email: text().notNull(),
	emailVerified: boolean().notNull(),
	passwordHash: text("password_hash").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const affiliateLogs = pgTable("affiliate_logs", {
	id: text().primaryKey().notNull(),
	invitorId: text("invitor_id").notNull(),
	childId: text("child_id").notNull(),
	currency: text().notNull(),
	referralCode: text("referral_code").notNull(),
	betAmount: doublePrecision("bet_amount").default(0).notNull(),
	commissionAmount: doublePrecision("commission_amount").default(0).notNull(),
	commissionWager: doublePrecision("commission_wager").default(0).notNull(),
	totalReferralAmount: doublePrecision("total_referral_amount").default(0).notNull(),
	referralAmount: doublePrecision("referral_amount").default(0).notNull(),
	referralWager: doublePrecision("referral_wager").default(0).notNull(),
	lastVipLevelAmount: doublePrecision("last_vip_level_amount").default(0).notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const affiliates = pgTable("affiliates", {
	id: text().primaryKey().notNull(),
	playername: text().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	status: text().notNull(),
	email: text().notNull(),
	role: text().notNull(),
	referralCode: text("referral_code").notNull(),
	parentId: text("parent_id"),
	path: text().array().default([""]).notNull(),
	password: text().notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const balances = pgTable("balances", {
	id: text().primaryKey().notNull(),
	playerId: text("player_id").notNull(),
	currencyId: text("currency_id").notNull(),
	walletId: text("wallet_id"),
	amount: integer().default(0).notNull(),
	bonus: integer().default(0).notNull(),
	turnover: integer().default(0).notNull(),
	withdrawable: integer().default(0).notNull(),
	pending: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const bonuses = pgTable("bonuses", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	option: text().notNull(),
	percent: integer().notNull(),
	multiply: integer().notNull(),
	bonusCap: integer("bonus_cap").notNull(),
	minBet: integer("min_bet").notNull(),
	maxBet: integer("max_bet").notNull(),
	slot: boolean().notNull(),
	casino: boolean().notNull(),
	status: boolean().notNull(),
	autoCalc: boolean("auto_calc").notNull(),
	expireDate: timestamp("expire_date", { precision: 3, mode: 'string' }).notNull(),
	isExpired: boolean("is_expired").default(false).notNull(),
	banner: text().notNull(),
	particularData: text("particular_data"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const commissions = pgTable("commissions", {
	id: text().primaryKey().notNull(),
	master: doublePrecision().default(30).notNull(),
	affiliate: doublePrecision().default(20).notNull(),
	subAffiliate: doublePrecision("sub_affiliate").default(10).notNull(),
	settingId: text("setting_id").notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const deposit = pgTable("deposit", {
	id: text().primaryKey().notNull(),
	playerId: text("player_id"),
	amount: integer(),
	status: text(),
	idNumber: text("id_number"),
	firstName: text("first_name"),
	lastName: text("last_name"),
	channelsId: text("channels_id"),
	note: text(),
	currency: text(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const gameSessions = pgTable("game_sessions", {
	id: text().primaryKey().notNull(),
	authSessionId: text("auth_session_id").notNull(),
	playerId: text("player_id").notNull(),
	gameId: text("game_id"),
	gameName: text("game_name"),
	status: sessionStatus().default('ACTIVE').notNull(),
	totalWagered: integer("total_wagered").default(0).notNull(),
	totalWon: integer("total_won").default(0).notNull(),
	totalXpGained: integer("total_xp_gained").default(0).notNull(),
	rtp: integer().default(0).notNull(),
	duration: integer().default(0).notNull(),
	endAt: timestamp("end_at", { precision: 3, mode: 'string' }),
	startingBalance: integer("starting_balance").default(0).notNull(),
	expiredTime: timestamp("expired_time", { precision: 3, mode: 'string' }),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const games = pgTable("games", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	title: text(),
	description: text(),
	category: text().default('slots').notNull(),
	tags: text(),
	thumbnailUrl: text("thumbnail_url"),
	bannerUrl: text("banner_url"),
	developer: text().notNull(),
	providerId: text("provider_id"),
	totalWagered: integer("total_wagered"),
	totalWon: integer("total_won"),
	targetRtp: integer("target_rtp").default(90).notNull(),
	isFeatured: boolean("is_featured"),
	statIn: integer("stat_in").default(0).notNull(),
	statOut: integer("stat_out").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	operatorId: text("operator_id"),
	version: text(),
	jpgIds: text("jpg_ids").array().notNull(),
	isHorizontal: boolean().default(false).notNull(),
	jpgId: text("jpg_id"),
	label: text(),
	device: integer(),
	gamebank: text(),
	linesPercentConfigSpin: text("lines_percent_config_spin"),
	linesPercentConfigSpinBonus: text("lines_percent_config_spin_bonus"),
	linesPercentConfigBonus: text("lines_percent_config_bonus"),
	linesPercentConfigBonusBonus: text("lines_percent_config_bonus_bonus"),
	rezerv: text(),
	cask: text(),
	advanced: text(),
	bet: text(),
	scaleMode: text("scale_mode"),
	slotViewState: text("slot_view_state"),
	view: text(),
	denomination: text(),
	categoryTemp: text("category_temp"),
	originalId: text("original_id"),
	bids: text().array().notNull(),
	rtpStatIn: integer("rtp_stat_in"),
	rtpStatOut: integer("rtp_stat_out"),
	currentRtp: text("current_rtp"),
	status: integer().default(0).notNull(),
	state: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const jackpotContributions = pgTable("jackpot_contributions", {
	id: text().primaryKey().notNull(),
	jackpotId: text("jackpot_id").notNull(),
	playerId: text("player_id"),
	gameSpinId: text("game_spin_id").notNull(),
	contributionAmountCoins: integer("contribution_amount_coins").notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const jackpotWins = pgTable("jackpot_wins", {
	id: text().primaryKey().notNull(),
	jackpotId: text("jackpot_id").notNull(),
	winnerId: text("winner_id").notNull(),
	winAmountCoins: integer("win_amount_coins").notNull(),
	gameSpinId: text("game_spin_id").notNull(),
	transactionId: text("transaction_id"),
	sessionDataId: text("session_data_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const jackpots = pgTable("jackpots", {
	id: text().primaryKey().notNull(),
	type: text().notNull(),
	currentAmountCoins: integer("current_amount_coins").notNull(),
	percent: integer().default(1).notNull(),
	paySum: integer().default(5).notNull(),
	startBalance: integer().default(0).notNull(),
	playerId: text(),
	seedAmountCoins: integer("seed_amount_coins").notNull(),
	minimumBetCoins: integer("minimum_bet_coins").default(1).notNull(),
	contributionRateBasisPoints: integer("contribution_rate_basis_points").notNull(),
	probabilityPerMillion: integer("probability_per_million").notNull(),
	minimumTimeBetweenWinsMinutes: integer("minimum_time_between_wins_minutes").notNull(),
	lastWonAt: timestamp("last_won_at", { precision: 3, mode: 'string' }),
	lastWonBy: text("last_won_by"),
	isActive: boolean("is_active").default(true).notNull(),
	lastContribution: integer(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const jwks = pgTable("jwks", {
	id: text().primaryKey().notNull(),
	privateKey: text().notNull(),
	passpublicKey: text().notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const loyaltyFundTransactions = pgTable("loyalty_fund_transactions", {
	id: text().primaryKey().notNull(),
	type: loyaltyFundTransactionType().notNull(),
	amount: doublePrecision().notNull(),
	description: text(),
	operatorId: text("operator_id"),
	playerId: text("player_id"),
	relatedTransactionId: text("related_transaction_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const operatorSettlements = pgTable("operator_settlements", {
	id: text().primaryKey().notNull(),
	operatorId: text("operator_id").notNull(),
	weekStartDate: timestamp("week_start_date", { precision: 3, mode: 'string' }).notNull(),
	weekEndDate: timestamp("week_end_date", { precision: 3, mode: 'string' }).notNull(),
	totalTurnover: doublePrecision("total_turnover").default(0).notNull(),
	totalPayouts: doublePrecision("total_payouts").default(0).notNull(),
	grossGamingRevenue: doublePrecision("gross_gaming_revenue").notNull(),
	platformFee: doublePrecision("platform_fee").notNull(),
	loyaltyFundContribution: doublePrecision("loyalty_fund_contribution").notNull(),
	netToOperator: doublePrecision("net_to_operator").notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const operatorSwitchHistory = pgTable("operator_switch_history", {
	id: text().primaryKey().notNull(),
	playerId: text("player_id").notNull(),
	fromOperatorId: text("from_operator_id"),
	toOperatorId: text("to_operator_id").notNull(),
	switchedAt: timestamp("switched_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const operators = pgTable("operators", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	operatorSecret: text("operator_secret").notNull(),
	operatorAccess: text("operator_access").notNull(),
	callbackUrl: text("callback_url").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	allowedIps: text("allowed_ips").notNull(),
	description: text(),
	productIds: text("product_ids"),
	balance: integer().notNull(),
	netRevenue: integer("net_revenue").default(0).notNull(),
	acceptedPayments: text("accepted_payments").array().notNull(),
	ownerId: text("owner_id"),
	lastUsedAt: timestamp("last_used_at", { precision: 3, mode: 'string' }),
	upfrontBankCredits: integer("upfront_bank_credits").default(10000).notNull(),
	platformFeeRate: text("platform_fee_rate").default('0.1500').notNull(),
	loyaltyContributionRate: text("loyalty_contribution_rate").default('0.0500').notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const playerBonuses = pgTable("player_bonuses", {
	id: text().primaryKey().notNull(),
	playerId: text("player_id").notNull(),
	bonusId: text("bonus_id").notNull(),
	amount: integer().default(0).notNull(),
	processAmount: integer("process_amount").default(0).notNull(),
	goalAmount: integer("goal_amount").notNull(),
	betsIds: text("bets_ids").array().notNull(),
	status: bonusStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const players = pgTable("players", {
	id: text().primaryKey().notNull(),
	playername: text().notNull(),
	email: text(),
	passwordHash: text("password_hash"),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { precision: 3, mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { precision: 3, mode: 'string' }),
	currentGameSessionDataId: text("current_game_session_data_id"),
	currentAuthSessionDataId: text("current_auth_session_data_id"),
	avatarUrl: text("avatar_url").default('avatar-01').notNull(),
	role: text().default('PLAYER').notNull(),
	phpId: integer().default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	lastLoginAt: timestamp("last_login_at", { precision: 3, mode: 'string' }),
	totalXpGained: integer("total_xp_gained").notNull(),
	vipInfoId: text("vip_info_id"),
	deletedAt: timestamp("deleted_at", { precision: 3, mode: 'string' }),
	lastSeen: timestamp("last_seen", { precision: 3, mode: 'string' }),
	rtgBlockTime: integer("rtg_block_time").default(0).notNull(),
	phone: text(),
	path: text().array().default([""]).notNull(),
	invitorId: text("invitor_id"),
	avatar: text().default('avatar-01.webp').notNull(),
	status: status().default('ACTIVE').notNull(),
	countBalance: integer("count_balance").default(0).notNull(),
	countTournaments: integer("count_tournaments").default(0).notNull(),
	countHappyhours: integer("count_happyhours").default(0).notNull(),
	countRefunds: integer("count_refunds").default(0).notNull(),
	countProgress: integer("count_progress").default(0).notNull(),
	countDailyEntries: integer("count_daily_entries").default(0).notNull(),
	countInvite: integer("count_invite").default(0).notNull(),
	countWelcomebonus: integer("count_welcomebonus").default(0).notNull(),
	countSmsbonus: integer("count_smsbonus").default(0).notNull(),
	countWheelfortune: integer("count_wheelfortune").default(0).notNull(),
	address: integer().default(0).notNull(),
	activeWalletId: text("active_wallet_id"),
	activeOperatorId: text("active_operator_id"),
	inviteCode: text(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const products = pgTable("products", {
	id: text().primaryKey().notNull(),
	title: text().default('default').notNull(),
	productType: text("product_type").default('bundle').notNull(),
	bonusTotalInCredits: integer("bonus_total_in_credits").notNull(),
	isActive: boolean("is_active"),
	priceInCents: integer("price_in_cents").notNull(),
	amountToReceiveInCredits: integer("amount_to_receive_in_credits").notNull(),
	bestValue: integer("best_value").notNull(),
	discountInCents: integer("discount_in_cents").notNull(),
	bonusSpins: integer("bonus_spins").notNull(),
	isPromo: boolean("is_promo"),
	totalDiscountInCents: integer("total_discount_in_cents").notNull(),
	operatorId: text("operator_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const progres = pgTable("progres", {
	id: text().primaryKey().notNull(),
	sum: doublePrecision().default(0).notNull(),
	type: progressTypeEnum().notNull(),
	spins: integer().default(0).notNull(),
	bet: doublePrecision().notNull(),
	rating: integer().notNull(),
	bonus: doublePrecision().default(0).notNull(),
	day: text().notNull(),
	min: integer().notNull(),
	max: integer().notNull(),
	percent: doublePrecision().notNull(),
	minBalance: doublePrecision("min_balance").notNull(),
	wager: integer().notNull(),
	daysActive: integer("days_active").default(5).notNull(),
	status: integer().default(1).notNull(),
	operatorId: text("operator_id").notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const referralCodes = pgTable("referral_codes", {
	id: text().primaryKey().notNull(),
	code: text().notNull(),
	name: text().default(').notNull(),
	commissionRate: doublePrecision("commission_rate").notNull(),
	playerId: text("player_id").notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const settings = pgTable("settings", {
	id: text().primaryKey().notNull(),
	name: text().default('setting').notNull(),
	referralCodeCount: integer("referral_code_count").default(20).notNull(),
	referralCommissionRate: doublePrecision("referral_commission_rate").default(0.25).notNull(),
	rates: text().default('[{"USD": 1}]').notNull(),
	jackpotConfig: jsonb("jackpot_config"),
	gameGroups: jsonb("game_groups"),
	vipConfig: jsonb("vip_config"),
	wageringConfig: jsonb("wagering_config"),
	systemLimits: jsonb("system_limits"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
	id: text().primaryKey().notNull(),
	processedAt: timestamp("processed_at", { precision: 3, mode: 'string' }),
	walletId: text("wallet_id"),
	type: text().notNull(),
	status: text().default('PENDING').notNull(),
	amount: integer().notNull(),
	netAmount: integer("net_amount"),
	currencyName: text("currency_name"),
	feeAmount: integer("fee_amount"),
	productId: text("product_id"),
	paymentMethod: text("payment_method"),
	balanceBefore: integer("balance_before"),
	balanceAfter: integer("balance_after"),
	bonusBalanceBefore: integer("bonus_balance_before"),
	bonusBalanceAfter: integer("bonus_balance_after"),
	bonusAmount: integer("bonus_amount"),
	wageringRequirement: integer("wagering_requirement"),
	wageringProgress: integer("wagering_progress"),
	description: text(),
	provider: text(),
	providerTxId: text("provider_tx_id"),
	relatedGameId: text("related_game_id"),
	gameName: text("game_name"),
	relatedRoundId: text("related_round_id"),
	operatorId: text("operator_id"),
	playerId: text("player_id").notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const vipCashback = pgTable("vip_cashback", {
	id: text().primaryKey().notNull(),
	playerId: text("player_id"),
	amount: integer().notNull(),
	currency: text().notNull(),
	tiersName: text("tiers_name").notNull(),
	type: text().notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const vipInfo = pgTable("vip_info", {
	id: text().primaryKey().notNull(),
	level: integer().default(1).notNull(),
	xp: integer().notNull(),
	totalXp: integer("total_xp").notNull(),
	playerId: text("player_id").notNull(),
	currentRankid: text("current_rankid"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const vipLevelUpBonus = pgTable("vip_level_up_bonus", {
	id: text().primaryKey().notNull(),
	playerId: text("player_id").notNull(),
	amount: integer().notNull(),
	levelName: text("level_name").notNull(),
	levelXp: integer("level_xp").notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const vipLevels = pgTable("vip_levels", {
	id: text().primaryKey().notNull(),
	parentId: text("parent_id").notNull(),
	minXpNeeded: integer("min_xp_needed").default(0).notNull(),
	levelNumber: integer("level_number").default(0).notNull(),
	levelName: text("level_name").notNull(),
	spinBonusMultiplierId: doublePrecision("spin_bonus_multiplier_id").default(0.1).notNull(),
	settingId: text("setting_id"),
	levelUpBonusAmount: integer("level_up_bonus_amount"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const vipRanks = pgTable("vip_ranks", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	minXp: integer("min_xp").notNull(),
	icon: text().default('/images/vip/rank1.avif').notNull(),
	dailyCashbackMax: integer("daily_cashback_max").notNull(),
	monthlyCashbackMax: integer("monthly_cashback_max").notNull(),
	wagerBonusCoinPct: integer("wager_bonus_coin_pct").notNull(),
	purchaseBonusCoinPct: integer("purchase_bonus_coin_pct").notNull(),
	levelUpBonusCoinPct: integer("level_up_bonus_coin_pct").notNull(),
	vipSpinMaxAmount: integer("vip_spin_max_amount").default(5).notNull(),
	hasConcierge: boolean("has_concierge").notNull(),
	hasVipLoungeAccess: boolean("has_vip_lounge_access").notNull(),
	isInvitationOnly: boolean("is_invitation_only").notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const vipSpinRewards = pgTable("vip_spin_rewards", {
	id: text().primaryKey().notNull(),
	playerId: text("player_id").notNull(),
	amount: integer().notNull(),
	currency: text().notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const wallets = pgTable("wallets", {
	id: text().primaryKey().notNull(),
	balance: integer().default(0).notNull(),
	paymentMethod: text("payment_method").default('INSTORE_CASH').notNull(),
	currency: text().default('USD').notNull(),
	address: text(),
	cashtag: text(),
	operatorId: text("operator_id").notNull(),
	lastUsedAt: timestamp("last_used_at", { precision: 3, mode: 'string' }),
	userId: text("user_id").notNull(),
	isActive: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const withdrawals = pgTable("withdrawals", {
	id: text().primaryKey().notNull(),
	playerId: text("player_id"),
	amount: integer(),
	status: text(),
	idNumber: text("id_number"),
	firstName: text("first_name"),
	lastName: text("last_name"),
	channelsId: text("channels_id"),
	note: text(),
	currencyType: text("currency_type"),
	currency: text(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});
