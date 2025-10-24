import { relations, sql } from 'drizzle-orm'
import { boolean, doublePrecision, foreignKey, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const Role = pgEnum('Role', ['USER', 'PLAYER', 'ADMIN', 'VIP', 'MODERATOR', 'SYSTEM', 'OWNER', 'MEMBER', 'OPERATOR', 'SUPPORT_AGENT'])

export const BonusStatus = pgEnum('BonusStatus', ['pending', 'active', 'completed', 'expired', 'cancelled'])

export const SystemEnum = pgEnum('SystemEnum', ['player', 'shop', 'bank', 'jpg', 'refund', 'happyhour', 'pincode', 'handpay', 'interkassa', 'coinbase', 'btcpayserver', 'invite', 'progress', 'tournament', 'daily_entry', 'welcome_bonus', 'sms_bonus', 'wheelfortune'])

export const TypeEnum = pgEnum('TypeEnum', ['add', 'out'])

export const ProgressTypeEnum = pgEnum('ProgressTypeEnum', ['one_pay', 'sum_pay'])

export const LoyaltyFundTransactionType = pgEnum('LoyaltyFundTransactionType', ['CONTRIBUTION', 'PAYOUT'])

export const GameProviderName = pgEnum('GameProviderName', ['pragmaticplay', 'evoplay', 'netent', 'playngo', 'relaxgaming', 'hacksaw', 'bgaming', 'spribe', 'internal', 'redtiger', 'netgame', 'bigfishgames', 'cqnine', 'nolimit', 'kickass'])

export const PaymentMethod = pgEnum('PaymentMethod', ['INSTORE_CASH', 'INSTORE_CARD', 'CASH_APP'])

export const Permission = pgEnum('Permission', ['read', 'write', 'upload', 'manage_players', 'manage_settings', 'launch_game'])

export const Status = pgEnum('Status', ['ACTIVE', 'INACTIVE', 'BANNED'])

export const TournamentStatus = pgEnum('TournamentStatus', ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'])

export const TransactionStatus = pgEnum('TransactionStatus', ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'EXPIRED', 'REJECTED', 'REQUIRES_ACTION', 'ON_HOLD'])

export const TypeOfJackpot = pgEnum('TypeOfJackpot', ['MINOR', 'MAJOR', 'GRAND'])

export const TypeOfTransaction = pgEnum('TypeOfTransaction', ['DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN', 'TRANSFER_SENT', 'TRANSFER_RECEIVED', 'SYSTEM_ADJUSTMENT_CREDIT', 'SYSTEM_ADJUSTMENT_DEBIT', 'TOURNAMENT_BUYIN', 'TOURNAMENT_PRIZE', 'AFFILIATE_COMMISSION', 'REFUND', 'FEE', 'BONUS_AWARD', 'BET_PLACE', 'BET_WIN', 'BET_LOSE', 'BET_REFUND', 'BONUS_WAGER', 'BONUS_CONVERT', 'BONUS_EXPIRED', 'XP_AWARD', 'ADJUSTMENT_ADD', 'ADJUSTMENT_SUB', 'INTERNAL_TRANSFER', 'PRODUCT_PURCHASE', 'REBATE_PAYOUT', 'JACKPOT_WIN', 'JACKPOT_CONTRIBUTION', 'LOYALTY_CASHBACK', 'LEVEL_UP_BONUS'])

export const PlayerRole = pgEnum('PlayerRole', ['PLAYER', 'ADMIN', 'MODERATOR', 'SUPPORT', 'BOT', 'SYSTEM'])

export const GameCategories = pgEnum('game_categories', ['slots', 'fish', 'table', 'live', 'poker', 'lottery', 'virtual', 'other'])

export const MessageType = pgEnum('message_type', ['update:wallet', 'update:vip', 'update:balance', 'update:gameSession'])

export const SessionStatus = pgEnum('session_status', ['ACTIVE', 'COMPLETED', 'EXPIRED', 'ABANDONED', 'TIMEOUT', 'OTP_PENDING'])

export const UpdateType = pgEnum('update_type', ['BINARY', 'OTA'])

export const User = pgTable('user', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	name: text('name').notNull(),
	username: text('username'),
	role: text('role').notNull().default("USER"),
	banned: boolean('banned').notNull(),
	displayUsername: text('displayUsername'),
	two_factor_enabled: boolean('two_factor_enabled').notNull(),
	playerId: text('player_id'),
	email: text('email').notNull().unique(),
	emailVerified: boolean('emailVerified').notNull(),
	passwordHash: text('password_hash').notNull(),
	image: text('image'),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
});

export const Session = pgTable('session', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	expiresAt: timestamp('expiresAt', { precision: 3 }).notNull(),
	token: text('token').notNull().unique(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	userId: text('userId').notNull(),
	playerId: text('playerId').notNull(),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (Session) => ({
	'session_user_fkey': foreignKey({
		name: 'session_user_fkey',
		columns: [Session.userId],
		foreignColumns: [User.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Account = pgTable('account', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	userId: text('userId').notNull(),
	accessToken: text('accessToken'),
	refreshToken: text('refreshToken'),
	idToken: text('idToken'),
	accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { precision: 3 }),
	refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { precision: 3 }),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (Account) => ({
	'account_user_fkey': foreignKey({
		name: 'account_user_fkey',
		columns: [Account.userId],
		foreignColumns: [User.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Verification = pgTable('verification', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expiresAt', { precision: 3 }).notNull(),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
});

export const jwks = pgTable('jwks', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	privateKey: text('privateKey').notNull(),
	passpublicKey: text('passpublicKey').notNull(),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow()
});

export const Player = pgTable('players', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	playername: text('playername').notNull().unique(),
	email: text('email').unique(),
	passwordHash: text('password_hash'),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at', { precision: 3 }),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { precision: 3 }),
	currentGameSessionDataId: text('current_game_session_data_id').unique(),
	currentAuthSessionDataId: text('current_auth_session_data_id').unique(),
	avatarUrl: text('avatar_url').default("avatar-01"),
	role: text('role').notNull().default("PLAYER"),
	phpId: integer('phpId').notNull(),
	isActive: boolean('is_active').notNull().default(true),
	lastLoginAt: timestamp('last_login_at', { precision: 3 }),
	totalXpGained: integer('total_xp_gained').notNull(),
	vipInfoId: text('vip_info_id').unique(),
	deletedAt: timestamp('deleted_at', { precision: 3 }),
	lastSeen: timestamp('last_seen', { precision: 3 }),
	rtgBlockTime: integer('rtg_block_time').notNull(),
	phone: text('phone').unique(),
	path: text('path').array().notNull().default([]),
	invitorId: text('invitor_id'),
	avatar: text('avatar').notNull().default("avatar-01.webp"),
	status: Status('status').notNull().default("ACTIVE"),
	count_balance: integer('count_balance').notNull(),
	count_tournaments: integer('count_tournaments').notNull(),
	count_happyhours: integer('count_happyhours').notNull(),
	count_refunds: integer('count_refunds').notNull(),
	count_progress: integer('count_progress').notNull(),
	count_daily_entries: integer('count_daily_entries').notNull(),
	count_invite: integer('count_invite').notNull(),
	count_welcomebonus: integer('count_welcomebonus').notNull(),
	count_smsbonus: integer('count_smsbonus').notNull(),
	count_wheelfortune: integer('count_wheelfortune').notNull(),
	address: integer('address').notNull(),
	activeWalletId: text('active_wallet_id').unique(),
	activeOperatorId: text('active_operator_id'),
	inviteCode: text('inviteCode'),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (Player) => ({
	'players_ops_fkey': foreignKey({
		name: 'players_ops_fkey',
		columns: [Player.activeOperatorId],
		foreignColumns: [Operators.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Deposit = pgTable('deposit', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	playerId: text('player_id'),
	amount: integer('amount'),
	status: text('status'),
	idNumber: text('id_number'),
	firstName: text('first_name'),
	lastName: text('last_name'),
	channelsId: text('channels_id'),
	note: text('note'),
	currency: text('currency'),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (Deposit) => ({
	'deposit_players_fkey': foreignKey({
		name: 'deposit_players_fkey',
		columns: [Deposit.playerId],
		foreignColumns: [Player.id]
	})
		.onUpdate('cascade')
}));

export const GameSessions = pgTable('game_sessions', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	authSessionId: text('auth_session_id').notNull(),
	playerId: text('player_id').notNull(),
	gameId: text('game_id'),
	gameName: text('game_name'),
	status: SessionStatus('status').notNull().default("ACTIVE"),
	totalWagered: integer('total_wagered').notNull(),
	totalWon: integer('total_won').notNull(),
	totalXpGained: integer('total_xp_gained').notNull(),
	rtp: integer('rtp'),
	duration: integer('duration').notNull(),
	endAt: timestamp('end_at', { precision: 3 }),
	startingBalance: integer('starting_balance').notNull(),
	expiredTime: timestamp('expired_time', { precision: 3 }),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (GameSessions) => ({
	'game_sessions_players_fkey': foreignKey({
		name: 'game_sessions_players_fkey',
		columns: [GameSessions.playerId],
		foreignColumns: [Player.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'game_sessions_game_fkey': foreignKey({
		name: 'game_sessions_game_fkey',
		columns: [GameSessions.gameId],
		foreignColumns: [Games.id]
	})
		.onUpdate('cascade')
}));

export const JackpotContributions = pgTable('jackpot_contributions', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	jackpotId: text('jackpot_id').notNull(),
	playerId: text('player_id'),
	gameSpinId: text('game_spin_id').notNull(),
	contributionAmountCoins: integer('contribution_amount_coins').notNull(),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (JackpotContributions) => ({
	'jackpot_contributions_jackpots_fkey': foreignKey({
		name: 'jackpot_contributions_jackpots_fkey',
		columns: [JackpotContributions.jackpotId],
		foreignColumns: [Jackpots.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'JackpotContributions_jackpotId_gameSpinId_unique_idx': uniqueIndex('JackpotContributions_jackpotId_gameSpinId_key')
		.on(JackpotContributions.jackpotId, JackpotContributions.gameSpinId)
}));

export const JackpotWins = pgTable('jackpot_wins', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	jackpotId: text('jackpot_id').notNull(),
	winnerId: text('winner_id').notNull(),
	winAmountCoins: integer('win_amount_coins').notNull(),
	gameSpinId: text('game_spin_id').notNull().unique(),
	transactionId: text('transaction_id'),
	sessionDataId: text('session_data_id'),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (JackpotWins) => ({
	'jackpot_wins_jackpots_fkey': foreignKey({
		name: 'jackpot_wins_jackpots_fkey',
		columns: [JackpotWins.jackpotId],
		foreignColumns: [Jackpots.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'jackpot_wins_player_fkey': foreignKey({
		name: 'jackpot_wins_player_fkey',
		columns: [JackpotWins.winnerId],
		foreignColumns: [Player.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Jackpots = pgTable('jackpots', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	type: text('type').notNull(),
	currentAmountCoins: integer('current_amount_coins').notNull(),
	percent: integer('percent').notNull().default(1),
	paySum: integer('paySum').notNull().default(5),
	startBalance: integer('startBalance').notNull(),
	playerId: text('playerId'),
	seedAmountCoins: integer('seed_amount_coins').notNull(),
	minimumBetCoins: integer('minimum_bet_coins').notNull().default(1),
	contributionRateBasisPoints: integer('contribution_rate_basis_points').notNull(),
	probabilityPerMillion: integer('probability_per_million').notNull(),
	minimumTimeBetweenWinsMinutes: integer('minimum_time_between_wins_minutes').notNull(),
	lastWonAt: timestamp('last_won_at', { precision: 3 }),
	lastWonBy: text('last_won_by'),
	isActive: boolean('is_active').notNull().default(true),
	lastContribution: integer('lastContribution'),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (Jackpots) => ({
	'jackpots_players_fkey': foreignKey({
		name: 'jackpots_players_fkey',
		columns: [Jackpots.lastWonBy],
		foreignColumns: [Player.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Operators = pgTable('operators', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	name: text('name').notNull().unique(),
	operatorSecret: text('operator_secret').notNull(),
	operatorAccess: text('operator_access').notNull(),
	callbackUrl: text('callback_url').notNull(),
	isActive: boolean('is_active').notNull().default(true),
	allowedIps: text('allowed_ips').notNull(),
	description: text('description'),
	productIds: text('product_ids'),
	balance: integer('balance').notNull(),
	netRevenue: integer('net_revenue').notNull(),
	acceptedPayments: text('accepted_payments').array().notNull(),
	ownerId: text('owner_id'),
	lastUsedAt: timestamp('last_used_at', { precision: 3 }),
	upfrontBankCredits: integer('upfront_bank_credits').notNull().default(10000),
	platformFeeRate: text('platform_fee_rate').notNull().default("0.1500"),
	loyaltyContributionRate: text('loyalty_contribution_rate').notNull().default("0.0500"),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
});

export const OperatorSwitchHistory = pgTable('operator_switch_history', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	playerId: text('player_id').notNull(),
	fromOperatorId: text('from_operator_id'),
	toOperatorId: text('to_operator_id').notNull(),
	switchedAt: timestamp('switched_at', { precision: 3 }).notNull().defaultNow(),
	createdAt: timestamp('created_at', { precision: 3 }).defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).defaultNow()
}, (OperatorSwitchHistory) => ({
	'operator_switch_history_player_fkey': foreignKey({
		name: 'operator_switch_history_player_fkey',
		columns: [OperatorSwitchHistory.playerId],
		foreignColumns: [Player.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'operator_switch_history_fromOperator_fkey': foreignKey({
		name: 'operator_switch_history_fromOperator_fkey',
		columns: [OperatorSwitchHistory.fromOperatorId],
		foreignColumns: [Operators.id]
	})
		.onDelete('set null')
		.onUpdate('cascade'),
	'operator_switch_history_toOperator_fkey': foreignKey({
		name: 'operator_switch_history_toOperator_fkey',
		columns: [OperatorSwitchHistory.toOperatorId],
		foreignColumns: [Operators.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Products = pgTable('products', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	title: text('title').notNull().default("default"),
	productType: text('product_type').notNull().default("bundle"),
	bonusTotalInCredits: integer('bonus_total_in_credits').notNull(),
	isActive: boolean('is_active'),
	priceInCents: integer('price_in_cents').notNull(),
	amountToReceiveInCredits: integer('amount_to_receive_in_credits').notNull(),
	bestValue: integer('best_value').notNull(),
	discountInCents: integer('discount_in_cents').notNull(),
	bonusSpins: integer('bonus_spins').notNull(),
	isPromo: boolean('is_promo'),
	totalDiscountInCents: integer('total_discount_in_cents').notNull(),
	operatorId: text('operator_id'),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (Products) => ({
	'products_operators_fkey': foreignKey({
		name: 'products_operators_fkey',
		columns: [Products.operatorId],
		foreignColumns: [Operators.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Transaction = pgTable('transactions', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	processedAt: timestamp('processed_at', { precision: 3 }),
	walletId: text('wallet_id'),
	type: text('type').notNull(),
	status: text('status').notNull().default("PENDING"),
	amount: integer('amount').notNull(),
	netAmount: integer('net_amount'),
	currencyName: text('currency_name'),
	feeAmount: integer('fee_amount'),
	productId: text('product_id'),
	paymentMethod: text('payment_method'),
	balanceBefore: integer('balance_before'),
	balanceAfter: integer('balance_after'),
	bonusBalanceBefore: integer('bonus_balance_before'),
	bonusBalanceAfter: integer('bonus_balance_after'),
	bonusAmount: integer('bonus_amount'),
	wageringRequirement: integer('wagering_requirement'),
	wageringProgress: integer('wagering_progress'),
	description: text('description'),
	provider: text('provider'),
	providerTxId: text('provider_tx_id'),
	relatedGameId: text('related_game_id'),
	gameName: text('game_name'),
	relatedRoundId: text('related_round_id'),
	operatorId: text('operator_id'),
	playerId: text('player_id').notNull(),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (Transaction) => ({
	'transactions_products_fkey': foreignKey({
		name: 'transactions_products_fkey',
		columns: [Transaction.productId],
		foreignColumns: [Products.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'transactions_wallets_fkey': foreignKey({
		name: 'transactions_wallets_fkey',
		columns: [Transaction.walletId],
		foreignColumns: [Wallet.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const ReferralCode = pgTable('referral_codes', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	code: text('code').notNull().unique(),
	name: text('name'),
	commissionRate: doublePrecision('commission_rate').notNull(),
	playerId: text('player_id').notNull(),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (ReferralCode) => ({
	'referral_codes_player_fkey': foreignKey({
		name: 'referral_codes_player_fkey',
		columns: [ReferralCode.playerId],
		foreignColumns: [Player.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Wallet = pgTable('wallets', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	balance: integer('balance').notNull(),
	paymentMethod: text('payment_method').notNull().default("INSTORE_CASH"),
	currency: text('currency').notNull().default("USD"),
	address: text('address').unique(),
	cashtag: text('cashtag').unique(),
	operatorId: text('operator_id').notNull(),
	lastUsedAt: timestamp('last_used_at', { precision: 3 }),
	userId: text('user_id').notNull(),
	isActive: boolean('isActive').notNull(),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (Wallet) => ({
	'wallets_operator_fkey': foreignKey({
		name: 'wallets_operator_fkey',
		columns: [Wallet.operatorId],
		foreignColumns: [Operators.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'wallets_activeForUser_fkey': foreignKey({
		name: 'wallets_activeForUser_fkey',
		columns: [Wallet.userId],
		foreignColumns: [User.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Withdrawal = pgTable('withdrawals', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	playerId: text('player_id'),
	amount: integer('amount'),
	status: text('status'),
	idNumber: text('id_number'),
	firstName: text('first_name'),
	lastName: text('last_name'),
	channelsId: text('channels_id'),
	note: text('note'),
	currencyType: text('currency_type'),
	currency: text('currency'),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (Withdrawal) => ({
	'withdrawals_players_fkey': foreignKey({
		name: 'withdrawals_players_fkey',
		columns: [Withdrawal.playerId],
		foreignColumns: [Player.id]
	})
		.onUpdate('cascade')
}));

export const VipRank = pgTable('vip_ranks', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	name: text('name').notNull().unique(),
	minXp: integer('min_xp').notNull().unique(),
	icon: text('icon').notNull().unique().default("/images/vip/rank1.avif"),
	dailyCashbackMax: integer('daily_cashback_max').notNull(),
	monthlyCashbackMax: integer('monthly_cashback_max').notNull(),
	wagerBonusCoinPct: integer('wager_bonus_coin_pct').notNull(),
	purchaseBonusCoinPct: integer('purchase_bonus_coin_pct').notNull(),
	levelUpBonusCoinPct: integer('level_up_bonus_coin_pct').notNull(),
	vipSpinMaxAmount: integer('vip_spin_max_amount').notNull().default(5),
	hasConcierge: boolean('has_concierge').notNull(),
	hasVipLoungeAccess: boolean('has_vip_lounge_access').notNull(),
	isInvitationOnly: boolean('is_invitation_only').notNull(),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
});

export const VipInfo = pgTable('vip_info', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	level: integer('level').notNull().default(1),
	xp: integer('xp').notNull(),
	totalXp: integer('total_xp').notNull(),
	playerId: text('player_id').notNull().unique(),
	currentRankid: text('current_rankid'),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (VipInfo) => ({
	'vip_info_vipRank_fkey': foreignKey({
		name: 'vip_info_vipRank_fkey',
		columns: [VipInfo.currentRankid],
		foreignColumns: [VipRank.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'vip_info_players_fkey': foreignKey({
		name: 'vip_info_players_fkey',
		columns: [VipInfo.playerId],
		foreignColumns: [Player.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const VipLevel = pgTable('vip_levels', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	parentId: text('parent_id').notNull(),
	minXpNeeded: integer('min_xp_needed'),
	levelNumber: integer('level_number'),
	levelName: text('level_name').notNull(),
	spinBonusMultiplier: doublePrecision('spin_bonus_multiplier_id').default(0.1),
	settingId: text('setting_id'),
	levelUpBonusAmount: integer('level_up_bonus_amount'),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (VipLevel) => ({
	'vip_levels_parent_fkey': foreignKey({
		name: 'vip_levels_parent_fkey',
		columns: [VipLevel.parentId],
		foreignColumns: [VipRank.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'vip_levels_setting_fkey': foreignKey({
		name: 'vip_levels_setting_fkey',
		columns: [VipLevel.settingId],
		foreignColumns: [Setting.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const VipCashback = pgTable('vip_cashback', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	playerId: text('player_id'),
	amount: integer('amount').notNull(),
	currency: text('currency').notNull(),
	tiersName: text('tiers_name').notNull(),
	type: text('type').notNull(),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (VipCashback) => ({
	'vip_cashback_player_fkey': foreignKey({
		name: 'vip_cashback_player_fkey',
		columns: [VipCashback.playerId],
		foreignColumns: [Player.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const VipLevelUpBonus = pgTable('vip_level_up_bonus', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	playerId: text('player_id').notNull(),
	amount: integer('amount').notNull(),
	levelName: text('level_name').notNull(),
	levelXp: integer('level_xp').notNull(),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (VipLevelUpBonus) => ({
	'vip_level_up_bonus_player_fkey': foreignKey({
		name: 'vip_level_up_bonus_player_fkey',
		columns: [VipLevelUpBonus.playerId],
		foreignColumns: [Player.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const VipSpinReward = pgTable('vip_spin_rewards', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	playerId: text('player_id').notNull(),
	amount: integer('amount').notNull(),
	currency: text('currency').notNull(),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (VipSpinReward) => ({
	'vip_spin_rewards_player_fkey': foreignKey({
		name: 'vip_spin_rewards_player_fkey',
		columns: [VipSpinReward.playerId],
		foreignColumns: [Player.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Affiliate = pgTable('affiliates', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	playername: text('playername').notNull().unique(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	status: text('status').notNull(),
	email: text('email').notNull().unique(),
	role: text('role').notNull(),
	referralCode: text('referral_code').notNull().unique(),
	parentId: text('parent_id'),
	path: text('path').array().notNull().default([]),
	password: text('password').notNull(),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (Affiliate) => ({
	'affiliates_parent_fkey': foreignKey({
		name: 'affiliates_parent_fkey',
		columns: [Affiliate.parentId],
		foreignColumns: [Affiliate.id]
	})
		.onUpdate('cascade')
}));

export const AffiliateLog = pgTable('affiliate_logs', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	invitorId: text('invitor_id').notNull(),
	childId: text('child_id').notNull(),
	currency: text('currency').notNull(),
	referralCode: text('referral_code').notNull(),
	betAmount: doublePrecision('bet_amount').notNull(),
	commissionAmount: doublePrecision('commission_amount').notNull(),
	commissionWager: doublePrecision('commission_wager').notNull(),
	totalReferralAmount: doublePrecision('total_referral_amount').notNull(),
	referralAmount: doublePrecision('referral_amount').notNull(),
	referralWager: doublePrecision('referral_wager').notNull(),
	lastVipLevelAmount: doublePrecision('last_vip_level_amount').notNull(),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (AffiliateLog) => ({
	'affiliate_logs_invitor_fkey': foreignKey({
		name: 'affiliate_logs_invitor_fkey',
		columns: [AffiliateLog.invitorId],
		foreignColumns: [Player.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'affiliate_logs_child_fkey': foreignKey({
		name: 'affiliate_logs_child_fkey',
		columns: [AffiliateLog.childId],
		foreignColumns: [Player.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Setting = pgTable('settings', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	name: text('name').notNull().default("setting"),
	referralCodeCount: integer('referral_code_count').notNull().default(20),
	referralCommissionRate: doublePrecision('referral_commission_rate').notNull().default(0.25),
	rates: text('rates').notNull().default("[{\"USD\": 1}]"),
	jackpotConfig: jsonb('jackpot_config'),
	gameGroups: jsonb('game_groups'),
	vipConfig: jsonb('vip_config'),
	wageringConfig: jsonb('wagering_config'),
	systemLimits: jsonb('system_limits'),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
});

export const Games = pgTable('games', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	name: text('name').notNull().unique(),
	title: text('title'),
	description: text('description'),
	category: text('category').default("slots"),
	tags: text('tags'),
	thumbnailUrl: text('thumbnail_url'),
	bannerUrl: text('banner_url'),
	developer: text('developer').notNull(),
	providerId: text('provider_id'),
	totalWagered: integer('total_wagered'),
	totalWon: integer('total_won'),
	targetRtp: integer('target_rtp').notNull().default(90),
	isFeatured: boolean('is_featured'),
	statIn: integer('stat_in'),
	statOut: integer('stat_out'),
	isActive: boolean('is_active').default(true),
	operatorId: text('operator_id'),
	version: text('version'),
	jpgIds: text('jpg_ids').array().notNull(),
	isHorizontal: boolean('isHorizontal'),
	jpgId: text('jpg_id'),
	label: text('label'),
	device: integer('device'),
	gamebank: text('gamebank'),
	linesPercentConfigSpin: text('lines_percent_config_spin'),
	linesPercentConfigSpinBonus: text('lines_percent_config_spin_bonus'),
	linesPercentConfigBonus: text('lines_percent_config_bonus'),
	linesPercentConfigBonusBonus: text('lines_percent_config_bonus_bonus'),
	rezerv: text('rezerv'),
	cask: text('cask'),
	advanced: text('advanced'),
	bet: text('bet'),
	scaleMode: text('scale_mode'),
	slotViewState: text('slot_view_state'),
	view: text('view'),
	denomination: text('denomination'),
	categoryTemp: text('category_temp'),
	originalId: text('original_id'),
	bids: text('bids').array().notNull(),
	rtpStatIn: integer('rtp_stat_in'),
	rtpStatOut: integer('rtp_stat_out'),
	currentRtp: text('current_rtp'),
	status: integer('status'),
	state: boolean('state').default(true),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (Games) => ({
	'games_operators_fkey': foreignKey({
		name: 'games_operators_fkey',
		columns: [Games.operatorId],
		foreignColumns: [Operators.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Commission = pgTable('commissions', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	master: doublePrecision('master').notNull().default(30),
	affiliate: doublePrecision('affiliate').notNull().default(20),
	subAffiliate: doublePrecision('sub_affiliate').notNull().default(10),
	settingId: text('setting_id').notNull().unique(),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (Commission) => ({
	'commissions_setting_fkey': foreignKey({
		name: 'commissions_setting_fkey',
		columns: [Commission.settingId],
		foreignColumns: [Setting.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const OperatorSettlement = pgTable('operator_settlements', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	operatorId: text('operator_id').notNull(),
	weekStartDate: timestamp('week_start_date', { precision: 3 }).notNull(),
	weekEndDate: timestamp('week_end_date', { precision: 3 }).notNull(),
	totalTurnover: doublePrecision('total_turnover').notNull(),
	totalPayouts: doublePrecision('total_payouts').notNull(),
	grossGamingRevenue: doublePrecision('gross_gaming_revenue').notNull(),
	platformFee: doublePrecision('platform_fee').notNull(),
	loyaltyFundContribution: doublePrecision('loyalty_fund_contribution').notNull(),
	netToOperator: doublePrecision('net_to_operator').notNull(),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (OperatorSettlement) => ({
	'operator_settlements_operator_fkey': foreignKey({
		name: 'operator_settlements_operator_fkey',
		columns: [OperatorSettlement.operatorId],
		foreignColumns: [Operators.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const LoyaltyFundTransaction = pgTable('loyalty_fund_transactions', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	type: LoyaltyFundTransactionType('type').notNull(),
	amount: doublePrecision('amount').notNull(),
	description: text('description'),
	operatorId: text('operator_id'),
	playerId: text('player_id'),
	relatedTransactionId: text('related_transaction_id'),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (LoyaltyFundTransaction) => ({
	'loyalty_fund_transactions_operator_fkey': foreignKey({
		name: 'loyalty_fund_transactions_operator_fkey',
		columns: [LoyaltyFundTransaction.operatorId],
		foreignColumns: [Operators.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'loyalty_fund_transactions_player_fkey': foreignKey({
		name: 'loyalty_fund_transactions_player_fkey',
		columns: [LoyaltyFundTransaction.playerId],
		foreignColumns: [Player.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Balance = pgTable('balances', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	playerId: text('player_id').notNull(),
	currencyId: text('currency_id').notNull(),
	walletId: text('wallet_id'),
	amount: integer('amount').notNull(),
	bonus: integer('bonus').notNull(),
	turnover: integer('turnover').notNull(),
	withdrawable: integer('withdrawable').notNull(),
	pending: integer('pending').notNull(),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (Balance) => ({
	'balances_wallet_fkey': foreignKey({
		name: 'balances_wallet_fkey',
		columns: [Balance.walletId],
		foreignColumns: [Wallet.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const PlayerBonus = pgTable('player_bonuses', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	playerId: text('player_id').notNull(),
	bonusId: text('bonus_id').notNull(),
	amount: integer('amount').notNull(),
	processAmount: integer('process_amount').notNull(),
	goalAmount: integer('goal_amount').notNull(),
	betsIds: text('bets_ids').array().notNull(),
	status: BonusStatus('status').notNull().default("pending"),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
}, (PlayerBonus) => ({
	'player_bonuses_player_fkey': foreignKey({
		name: 'player_bonuses_player_fkey',
		columns: [PlayerBonus.playerId],
		foreignColumns: [Player.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'player_bonuses_bonus_fkey': foreignKey({
		name: 'player_bonuses_bonus_fkey',
		columns: [PlayerBonus.bonusId],
		foreignColumns: [Bonus.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Bonus = pgTable('bonuses', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	name: text('name').notNull(),
	description: text('description').notNull(),
	option: text('option').notNull(),
	percent: integer('percent').notNull(),
	multiply: integer('multiply').notNull(),
	bonusCap: integer('bonus_cap').notNull(),
	minBet: integer('min_bet').notNull(),
	maxBet: integer('max_bet').notNull(),
	slot: boolean('slot').notNull(),
	casino: boolean('casino').notNull(),
	status: boolean('status').notNull(),
	autoCalc: boolean('auto_calc').notNull(),
	expireDate: timestamp('expire_date', { precision: 3 }).notNull(),
	isExpired: boolean('is_expired').notNull(),
	banner: text('banner').notNull(),
	particularData: text('particular_data'),
	createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow()
});

export const Progress = pgTable('progres', {
	id: text('id').notNull().primaryKey().default(sql`cuid(1)`),
	sum: doublePrecision('sum').notNull(),
	type: ProgressTypeEnum('type').notNull(),
	spins: integer('spins').notNull(),
	bet: doublePrecision('bet').notNull(),
	rating: integer('rating').notNull(),
	bonus: doublePrecision('bonus').notNull(),
	day: text('day').notNull(),
	min: integer('min').notNull(),
	max: integer('max').notNull(),
	percent: doublePrecision('percent').notNull(),
	minBalance: doublePrecision('min_balance').notNull(),
	wager: integer('wager').notNull(),
	daysActive: integer('days_active').notNull().default(5),
	status: integer('status').notNull().default(1),
	operatorId: text('operator_id').notNull(),
	createdAt: timestamp('created_at', { precision: 3 }).defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3 }).defaultNow()
});

export const UserRelations = relations(User, ({ many }) => ({
	sessions: many(Session, {
		relationName: 'SessionToUser'
	}),
	accounts: many(Account, {
		relationName: 'AccountToUser'
	}),
	wallets: many(Wallet, {
		relationName: 'UserWallets'
	})
}));

export const SessionRelations = relations(Session, ({ one }) => ({
	user: one(User, {
		relationName: 'SessionToUser',
		fields: [Session.userId],
		references: [User.id]
	})
}));

export const AccountRelations = relations(Account, ({ one }) => ({
	user: one(User, {
		relationName: 'AccountToUser',
		fields: [Account.userId],
		references: [User.id]
	})
}));

export const PlayerRelations = relations(Player, ({ many, one }) => ({
	deposits: many(Deposit, {
		relationName: 'DepositToPlayer'
	}),
	gameSessions: many(GameSessions, {
		relationName: 'GameSessionsToPlayer'
	}),
	jackpotWins: many(JackpotWins, {
		relationName: 'JackpotWinsToPlayer'
	}),
	Jackpots: many(Jackpots, {
		relationName: 'JackpotsToPlayer'
	}),
	loyaltyFundTransactions: many(LoyaltyFundTransaction, {
		relationName: 'LoyaltyFundTransactionToPlayer'
	}),
	vipInfo: many(VipInfo, {
		relationName: 'PlayerToVipInfo'
	}),
	withdrawals: many(Withdrawal, {
		relationName: 'PlayerToWithdrawal'
	}),
	ops: one(Operators, {
		relationName: 'OperatorsToPlayer',
		fields: [Player.activeOperatorId],
		references: [Operators.id]
	}),
	operatorSwitchHistory: many(OperatorSwitchHistory, {
		relationName: 'OperatorSwitchHistoryToPlayer'
	}),
	vipCashbacks: many(VipCashback, {
		relationName: 'PlayerToVipCashback'
	}),
	vipLevelUpBonuses: many(VipLevelUpBonus, {
		relationName: 'PlayerToVipLevelUpBonus'
	}),
	vipSpinRewards: many(VipSpinReward, {
		relationName: 'PlayerToVipSpinReward'
	}),
	affiliateLogsInvited: many(AffiliateLog, {
		relationName: 'Invitor'
	}),
	affiliateLogsReferred: many(AffiliateLog, {
		relationName: 'Child'
	}),
	referralCodes: many(ReferralCode, {
		relationName: 'PlayerToReferralCode'
	}),
	PlayerBonus: many(PlayerBonus, {
		relationName: 'PlayerToPlayerBonus'
	})
}));

export const DepositRelations = relations(Deposit, ({ one }) => ({
	players: one(Player, {
		relationName: 'DepositToPlayer',
		fields: [Deposit.playerId],
		references: [Player.id]
	})
}));

export const GameSessionsRelations = relations(GameSessions, ({ one }) => ({
	players: one(Player, {
		relationName: 'GameSessionsToPlayer',
		fields: [GameSessions.playerId],
		references: [Player.id]
	}),
	game: one(Games, {
		relationName: 'GameSessionsToGames',
		fields: [GameSessions.gameId],
		references: [Games.id]
	})
}));

export const JackpotContributionsRelations = relations(JackpotContributions, ({ one }) => ({
	jackpots: one(Jackpots, {
		relationName: 'JackpotContributionsToJackpots',
		fields: [JackpotContributions.jackpotId],
		references: [Jackpots.id]
	})
}));

export const JackpotWinsRelations = relations(JackpotWins, ({ one }) => ({
	jackpots: one(Jackpots, {
		relationName: 'JackpotWinsToJackpots',
		fields: [JackpotWins.jackpotId],
		references: [Jackpots.id]
	}),
	player: one(Player, {
		relationName: 'JackpotWinsToPlayer',
		fields: [JackpotWins.winnerId],
		references: [Player.id]
	})
}));

export const JackpotsRelations = relations(Jackpots, ({ many, one }) => ({
	jackpotContributions: many(JackpotContributions, {
		relationName: 'JackpotContributionsToJackpots'
	}),
	jackpotWins: many(JackpotWins, {
		relationName: 'JackpotWinsToJackpots'
	}),
	players: one(Player, {
		relationName: 'JackpotsToPlayer',
		fields: [Jackpots.lastWonBy],
		references: [Player.id]
	})
}));

export const OperatorsRelations = relations(Operators, ({ many }) => ({
	games: many(Games, {
		relationName: 'GamesToOperators'
	}),
	products: many(Products, {
		relationName: 'OperatorsToProducts'
	}),
	players: many(Player, {
		relationName: 'OperatorsToPlayer'
	}),
	settlements: many(OperatorSettlement, {
		relationName: 'OperatorSettlementToOperators'
	}),
	loyaltyFundContributions: many(LoyaltyFundTransaction, {
		relationName: 'LoyaltyFundTransactionToOperators'
	}),
	switchedFromHistory: many(OperatorSwitchHistory, {
		relationName: 'SwitchedFrom'
	}),
	switchedToHistory: many(OperatorSwitchHistory, {
		relationName: 'SwitchedTo'
	}),
	wallets: many(Wallet, {
		relationName: 'OperatorsToWallet'
	})
}));

export const OperatorSwitchHistoryRelations = relations(OperatorSwitchHistory, ({ one }) => ({
	player: one(Player, {
		relationName: 'OperatorSwitchHistoryToPlayer',
		fields: [OperatorSwitchHistory.playerId],
		references: [Player.id]
	}),
	fromOperator: one(Operators, {
		relationName: 'SwitchedFrom',
		fields: [OperatorSwitchHistory.fromOperatorId],
		references: [Operators.id]
	}),
	toOperator: one(Operators, {
		relationName: 'SwitchedTo',
		fields: [OperatorSwitchHistory.toOperatorId],
		references: [Operators.id]
	})
}));

export const ProductsRelations = relations(Products, ({ one, many }) => ({
	operators: one(Operators, {
		relationName: 'OperatorsToProducts',
		fields: [Products.operatorId],
		references: [Operators.id]
	}),
	transactions: many(Transaction, {
		relationName: 'ProductsToTransaction'
	})
}));

export const TransactionRelations = relations(Transaction, ({ one }) => ({
	products: one(Products, {
		relationName: 'ProductsToTransaction',
		fields: [Transaction.productId],
		references: [Products.id]
	}),
	wallets: one(Wallet, {
		relationName: 'TransactionToWallet',
		fields: [Transaction.walletId],
		references: [Wallet.id]
	})
}));

export const ReferralCodeRelations = relations(ReferralCode, ({ one }) => ({
	player: one(Player, {
		relationName: 'PlayerToReferralCode',
		fields: [ReferralCode.playerId],
		references: [Player.id]
	})
}));

export const WalletRelations = relations(Wallet, ({ one, many }) => ({
	operator: one(Operators, {
		relationName: 'OperatorsToWallet',
		fields: [Wallet.operatorId],
		references: [Operators.id]
	}),
	transactions: many(Transaction, {
		relationName: 'TransactionToWallet'
	}),
	balances: many(Balance, {
		relationName: 'WalletBalances'
	}),
	activeForUser: one(User, {
		relationName: 'UserWallets',
		fields: [Wallet.userId],
		references: [User.id]
	})
}));

export const WithdrawalRelations = relations(Withdrawal, ({ one }) => ({
	players: one(Player, {
		relationName: 'PlayerToWithdrawal',
		fields: [Withdrawal.playerId],
		references: [Player.id]
	})
}));

export const VipRankRelations = relations(VipRank, ({ many }) => ({
	vipInfo: many(VipInfo, {
		relationName: 'VipInfoToVipRank'
	}),
	levels: many(VipLevel, {
		relationName: 'VipLevelToVipRank'
	})
}));

export const VipInfoRelations = relations(VipInfo, ({ one }) => ({
	vipRank: one(VipRank, {
		relationName: 'VipInfoToVipRank',
		fields: [VipInfo.currentRankid],
		references: [VipRank.id]
	}),
	players: one(Player, {
		relationName: 'PlayerToVipInfo',
		fields: [VipInfo.playerId],
		references: [Player.id]
	})
}));

export const VipLevelRelations = relations(VipLevel, ({ one }) => ({
	parent: one(VipRank, {
		relationName: 'VipLevelToVipRank',
		fields: [VipLevel.parentId],
		references: [VipRank.id]
	}),
	setting: one(Setting, {
		relationName: 'SettingToVipLevel',
		fields: [VipLevel.settingId],
		references: [Setting.id]
	})
}));

export const VipCashbackRelations = relations(VipCashback, ({ one }) => ({
	player: one(Player, {
		relationName: 'PlayerToVipCashback',
		fields: [VipCashback.playerId],
		references: [Player.id]
	})
}));

export const VipLevelUpBonusRelations = relations(VipLevelUpBonus, ({ one }) => ({
	player: one(Player, {
		relationName: 'PlayerToVipLevelUpBonus',
		fields: [VipLevelUpBonus.playerId],
		references: [Player.id]
	})
}));

export const VipSpinRewardRelations = relations(VipSpinReward, ({ one }) => ({
	player: one(Player, {
		relationName: 'PlayerToVipSpinReward',
		fields: [VipSpinReward.playerId],
		references: [Player.id]
	})
}));

export const AffiliateRelations = relations(Affiliate, ({ one, many }) => ({
	parent: one(Affiliate, {
		relationName: 'AffiliateTree',
		fields: [Affiliate.parentId],
		references: [Affiliate.id]
	}),
	children: many(Affiliate, {
		relationName: 'AffiliateTree'
	})
}));

export const AffiliateLogRelations = relations(AffiliateLog, ({ one }) => ({
	invitor: one(Player, {
		relationName: 'Invitor',
		fields: [AffiliateLog.invitorId],
		references: [Player.id]
	}),
	child: one(Player, {
		relationName: 'Child',
		fields: [AffiliateLog.childId],
		references: [Player.id]
	})
}));

export const SettingRelations = relations(Setting, ({ many }) => ({
	commission: many(Commission, {
		relationName: 'CommissionToSetting'
	}),
	vipLevels: many(VipLevel, {
		relationName: 'SettingToVipLevel'
	})
}));

export const GamesRelations = relations(Games, ({ one, many }) => ({
	operators: one(Operators, {
		relationName: 'GamesToOperators',
		fields: [Games.operatorId],
		references: [Operators.id]
	}),
	gameSessions: many(GameSessions, {
		relationName: 'GameSessionsToGames'
	})
}));

export const CommissionRelations = relations(Commission, ({ one }) => ({
	setting: one(Setting, {
		relationName: 'CommissionToSetting',
		fields: [Commission.settingId],
		references: [Setting.id]
	})
}));

export const OperatorSettlementRelations = relations(OperatorSettlement, ({ one }) => ({
	operator: one(Operators, {
		relationName: 'OperatorSettlementToOperators',
		fields: [OperatorSettlement.operatorId],
		references: [Operators.id]
	})
}));

export const LoyaltyFundTransactionRelations = relations(LoyaltyFundTransaction, ({ one }) => ({
	operator: one(Operators, {
		relationName: 'LoyaltyFundTransactionToOperators',
		fields: [LoyaltyFundTransaction.operatorId],
		references: [Operators.id]
	}),
	player: one(Player, {
		relationName: 'LoyaltyFundTransactionToPlayer',
		fields: [LoyaltyFundTransaction.playerId],
		references: [Player.id]
	})
}));

export const BalanceRelations = relations(Balance, ({ one }) => ({
	wallet: one(Wallet, {
		relationName: 'WalletBalances',
		fields: [Balance.walletId],
		references: [Wallet.id]
	})
}));

export const PlayerBonusRelations = relations(PlayerBonus, ({ one }) => ({
	player: one(Player, {
		relationName: 'PlayerToPlayerBonus',
		fields: [PlayerBonus.playerId],
		references: [Player.id]
	}),
	bonus: one(Bonus, {
		relationName: 'BonusToPlayerBonus',
		fields: [PlayerBonus.bonusId],
		references: [Bonus.id]
	})
}));

export const BonusRelations = relations(Bonus, ({ many }) => ({
	playerBonuses: many(PlayerBonus, {
		relationName: 'BonusToPlayerBonus'
	})
}));