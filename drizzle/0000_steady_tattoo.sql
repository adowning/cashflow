CREATE TYPE "public"."BonusStatus" AS ENUM('pending', 'active', 'completed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."game_categories" AS ENUM('slots', 'fish', 'table', 'live', 'poker', 'lottery', 'virtual', 'other');--> statement-breakpoint
CREATE TYPE "public"."GameProviderName" AS ENUM('pragmaticplay', 'evoplay', 'netent', 'playngo', 'relaxgaming', 'hacksaw', 'bgaming', 'spribe', 'internal', 'redtiger', 'netgame', 'bigfishgames', 'cqnine', 'nolimit', 'kickass');--> statement-breakpoint
CREATE TYPE "public"."LoyaltyFundTransactionType" AS ENUM('CONTRIBUTION', 'PAYOUT');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('update:wallet', 'update:vip', 'update:balance', 'update:gameSession');--> statement-breakpoint
CREATE TYPE "public"."PaymentMethod" AS ENUM('INSTORE_CASH', 'INSTORE_CARD', 'CASH_APP');--> statement-breakpoint
CREATE TYPE "public"."Permission" AS ENUM('read', 'write', 'upload', 'manage_players', 'manage_settings', 'launch_game');--> statement-breakpoint
CREATE TYPE "public"."PlayerRole" AS ENUM('PLAYER', 'ADMIN', 'MODERATOR', 'SUPPORT', 'BOT', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."ProgressTypeEnum" AS ENUM('one_pay', 'sum_pay');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('PLAYER', 'ADMIN', 'VIP', 'MODERATOR', 'SYSTEM', 'OWNER', 'MEMBER', 'OPERATOR', 'SUPPORT_AGENT');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('ACTIVE', 'COMPLETED', 'EXPIRED', 'ABANDONED', 'TIMEOUT', 'OTP_PENDING');--> statement-breakpoint
CREATE TYPE "public"."Status" AS ENUM('ACTIVE', 'INACTIVE', 'BANNED');--> statement-breakpoint
CREATE TYPE "public"."SystemEnum" AS ENUM('player', 'shop', 'bank', 'jpg', 'refund', 'happyhour', 'pincode', 'handpay', 'interkassa', 'coinbase', 'btcpayserver', 'invite', 'progress', 'tournament', 'daily_entry', 'welcome_bonus', 'sms_bonus', 'wheelfortune');--> statement-breakpoint
CREATE TYPE "public"."TournamentStatus" AS ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."TransactionStatus" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'EXPIRED', 'REJECTED', 'REQUIRES_ACTION', 'ON_HOLD');--> statement-breakpoint
CREATE TYPE "public"."TypeEnum" AS ENUM('add', 'out');--> statement-breakpoint
CREATE TYPE "public"."TypeOfJackpot" AS ENUM('MINOR', 'MAJOR', 'GRAND');--> statement-breakpoint
CREATE TYPE "public"."TypeOfTransaction" AS ENUM('DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN', 'TRANSFER_SENT', 'TRANSFER_RECEIVED', 'SYSTEM_ADJUSTMENT_CREDIT', 'SYSTEM_ADJUSTMENT_DEBIT', 'TOURNAMENT_BUYIN', 'TOURNAMENT_PRIZE', 'AFFILIATE_COMMISSION', 'REFUND', 'FEE', 'BONUS_AWARD', 'BET_PLACE', 'BET_WIN', 'BET_LOSE', 'BET_REFUND', 'BONUS_WAGER', 'BONUS_CONVERT', 'BONUS_EXPIRED', 'XP_AWARD', 'ADJUSTMENT_ADD', 'ADJUSTMENT_SUB', 'INTERNAL_TRANSFER', 'PRODUCT_PURCHASE', 'REBATE_PAYOUT', 'JACKPOT_WIN', 'JACKPOT_CONTRIBUTION', 'LOYALTY_CASHBACK', 'LEVEL_UP_BONUS');--> statement-breakpoint
CREATE TYPE "public"."update_type" AS ENUM('BINARY', 'OTA');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp (3),
	"refreshTokenExpiresAt" timestamp (3),
	"scope" text,
	"password" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "affiliate_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"invitor_id" text NOT NULL,
	"child_id" text NOT NULL,
	"currency" text NOT NULL,
	"referral_code" text NOT NULL,
	"bet_amount" double precision DEFAULT 0 NOT NULL,
	"commission_amount" double precision DEFAULT 0 NOT NULL,
	"commission_wager" double precision DEFAULT 0 NOT NULL,
	"total_referral_amount" double precision DEFAULT 0 NOT NULL,
	"referral_amount" double precision DEFAULT 0 NOT NULL,
	"referral_wager" double precision DEFAULT 0 NOT NULL,
	"last_vip_level_amount" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "affiliates" (
	"id" text PRIMARY KEY NOT NULL,
	"playername" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"status" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"referral_code" text NOT NULL,
	"parent_id" text,
	"path" text[] DEFAULT '{}' NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "balances" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"currency_id" text NOT NULL,
	"wallet_id" text,
	"amount" integer DEFAULT 0 NOT NULL,
	"bonus" integer DEFAULT 0 NOT NULL,
	"turnover" integer DEFAULT 0 NOT NULL,
	"withdrawable" integer DEFAULT 0 NOT NULL,
	"pending" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "bonuses" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"option" text NOT NULL,
	"percent" integer NOT NULL,
	"multiply" integer NOT NULL,
	"bonus_cap" integer NOT NULL,
	"min_bet" integer NOT NULL,
	"max_bet" integer NOT NULL,
	"slot" boolean NOT NULL,
	"casino" boolean NOT NULL,
	"status" boolean NOT NULL,
	"auto_calc" boolean NOT NULL,
	"expire_date" timestamp (3) NOT NULL,
	"is_expired" boolean DEFAULT false NOT NULL,
	"banner" text NOT NULL,
	"particular_data" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" text PRIMARY KEY NOT NULL,
	"master" double precision DEFAULT 30 NOT NULL,
	"affiliate" double precision DEFAULT 20 NOT NULL,
	"sub_affiliate" double precision DEFAULT 10 NOT NULL,
	"setting_id" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" text,
	"amount" integer,
	"status" text,
	"id_number" text,
	"first_name" text,
	"last_name" text,
	"channels_id" text,
	"note" text,
	"currency" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"auth_session_id" text NOT NULL,
	"player_id" text NOT NULL,
	"game_id" text,
	"game_name" text,
	"status" "session_status" DEFAULT 'ACTIVE' NOT NULL,
	"total_wagered" integer DEFAULT 0 NOT NULL,
	"total_won" integer DEFAULT 0 NOT NULL,
	"total_xp_gained" integer DEFAULT 0 NOT NULL,
	"rtp" integer DEFAULT 0 NOT NULL,
	"duration" integer DEFAULT 0 NOT NULL,
	"end_at" timestamp (3),
	"starting_balance" integer DEFAULT 0 NOT NULL,
	"expired_time" timestamp (3),
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"description" text,
	"category" text DEFAULT 'slots' NOT NULL,
	"tags" text,
	"thumbnail_url" text,
	"banner_url" text,
	"developer" text NOT NULL,
	"provider_id" text,
	"total_wagered" integer,
	"total_won" integer,
	"target_rtp" integer DEFAULT 90 NOT NULL,
	"is_featured" boolean,
	"stat_in" integer DEFAULT 0 NOT NULL,
	"stat_out" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"operator_id" text,
	"version" text,
	"jpg_ids" text[] NOT NULL,
	"isHorizontal" boolean DEFAULT false NOT NULL,
	"jpg_id" text,
	"label" text,
	"device" integer,
	"gamebank" text,
	"lines_percent_config_spin" text,
	"lines_percent_config_spin_bonus" text,
	"lines_percent_config_bonus" text,
	"lines_percent_config_bonus_bonus" text,
	"rezerv" text,
	"cask" text,
	"advanced" text,
	"bet" text,
	"scale_mode" text,
	"slot_view_state" text,
	"view" text,
	"denomination" text,
	"category_temp" text,
	"original_id" text,
	"bids" text[] NOT NULL,
	"rtp_stat_in" integer,
	"rtp_stat_out" integer,
	"current_rtp" text,
	"status" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "jackpot_contributions" (
	"id" text PRIMARY KEY NOT NULL,
	"jackpot_id" text NOT NULL,
	"player_id" text,
	"game_spin_id" text NOT NULL,
	"contribution_amount_coins" integer NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "jackpot_wins" (
	"id" text PRIMARY KEY NOT NULL,
	"jackpot_id" text NOT NULL,
	"winner_id" text NOT NULL,
	"win_amount_coins" integer NOT NULL,
	"game_spin_id" text NOT NULL,
	"transaction_id" text,
	"session_data_id" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "jackpots" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"current_amount_coins" integer NOT NULL,
	"percent" integer DEFAULT 1 NOT NULL,
	"paySum" integer DEFAULT 5 NOT NULL,
	"startBalance" integer DEFAULT 0 NOT NULL,
	"playerId" text,
	"seed_amount_coins" integer NOT NULL,
	"minimum_bet_coins" integer DEFAULT 1 NOT NULL,
	"contribution_rate_basis_points" integer NOT NULL,
	"probability_per_million" integer NOT NULL,
	"minimum_time_between_wins_minutes" integer NOT NULL,
	"last_won_at" timestamp (3),
	"last_won_by" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"lastContribution" integer,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "loyalty_fund_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "LoyaltyFundTransactionType" NOT NULL,
	"amount" double precision NOT NULL,
	"description" text,
	"operator_id" text,
	"player_id" text,
	"related_transaction_id" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "operator_settlements" (
	"id" text PRIMARY KEY NOT NULL,
	"operator_id" text NOT NULL,
	"week_start_date" timestamp (3) NOT NULL,
	"week_end_date" timestamp (3) NOT NULL,
	"total_turnover" double precision DEFAULT 0 NOT NULL,
	"total_payouts" double precision DEFAULT 0 NOT NULL,
	"gross_gaming_revenue" double precision NOT NULL,
	"platform_fee" double precision NOT NULL,
	"loyalty_fund_contribution" double precision NOT NULL,
	"net_to_operator" double precision NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "operator_switch_history" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"from_operator_id" text,
	"to_operator_id" text NOT NULL,
	"switched_at" timestamp (3) DEFAULT now() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "operators" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"operator_secret" text NOT NULL,
	"operator_access" text NOT NULL,
	"callback_url" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"allowed_ips" text NOT NULL,
	"description" text,
	"product_ids" text,
	"balance" integer NOT NULL,
	"net_revenue" integer DEFAULT 0 NOT NULL,
	"accepted_payments" text[] NOT NULL,
	"owner_id" text,
	"last_used_at" timestamp (3),
	"upfront_bank_credits" integer DEFAULT 10000 NOT NULL,
	"platform_fee_rate" text DEFAULT '0.1500' NOT NULL,
	"loyalty_contribution_rate" text DEFAULT '0.0500' NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "player_bonuses" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"bonus_id" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"process_amount" integer DEFAULT 0 NOT NULL,
	"goal_amount" integer NOT NULL,
	"bets_ids" text[] NOT NULL,
	"status" "BonusStatus" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" text PRIMARY KEY NOT NULL,
	"playername" text NOT NULL,
	"email" text,
	"password_hash" text,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp (3),
	"refresh_token_expires_at" timestamp (3),
	"current_game_session_data_id" text,
	"current_auth_session_data_id" text,
	"avatar_url" text DEFAULT 'avatar-01' NOT NULL,
	"role" text DEFAULT 'PLAYER' NOT NULL,
	"phpId" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp (3),
	"total_xp_gained" integer NOT NULL,
	"vip_info_id" text,
	"deleted_at" timestamp (3),
	"last_seen" timestamp (3),
	"rtg_block_time" integer DEFAULT 0 NOT NULL,
	"phone" text,
	"path" text[] DEFAULT '{}' NOT NULL,
	"invitor_id" text,
	"avatar" text DEFAULT 'avatar-01.webp' NOT NULL,
	"status" "Status" DEFAULT 'ACTIVE' NOT NULL,
	"count_balance" integer DEFAULT 0 NOT NULL,
	"count_tournaments" integer DEFAULT 0 NOT NULL,
	"count_happyhours" integer DEFAULT 0 NOT NULL,
	"count_refunds" integer DEFAULT 0 NOT NULL,
	"count_progress" integer DEFAULT 0 NOT NULL,
	"count_daily_entries" integer DEFAULT 0 NOT NULL,
	"count_invite" integer DEFAULT 0 NOT NULL,
	"count_welcomebonus" integer DEFAULT 0 NOT NULL,
	"count_smsbonus" integer DEFAULT 0 NOT NULL,
	"count_wheelfortune" integer DEFAULT 0 NOT NULL,
	"address" integer DEFAULT 0 NOT NULL,
	"active_wallet_id" text,
	"active_operator_id" text,
	"inviteCode" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text DEFAULT 'default' NOT NULL,
	"product_type" text DEFAULT 'bundle' NOT NULL,
	"bonus_total_in_credits" integer NOT NULL,
	"is_active" boolean,
	"price_in_cents" integer NOT NULL,
	"amount_to_receive_in_credits" integer NOT NULL,
	"best_value" integer NOT NULL,
	"discount_in_cents" integer NOT NULL,
	"bonus_spins" integer NOT NULL,
	"is_promo" boolean,
	"total_discount_in_cents" integer NOT NULL,
	"operator_id" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "progres" (
	"id" text PRIMARY KEY NOT NULL,
	"sum" double precision DEFAULT 0 NOT NULL,
	"type" "ProgressTypeEnum" NOT NULL,
	"spins" integer DEFAULT 0 NOT NULL,
	"bet" double precision NOT NULL,
	"rating" integer NOT NULL,
	"bonus" double precision DEFAULT 0 NOT NULL,
	"day" text NOT NULL,
	"min" integer NOT NULL,
	"max" integer NOT NULL,
	"percent" double precision NOT NULL,
	"min_balance" double precision NOT NULL,
	"wager" integer NOT NULL,
	"days_active" integer DEFAULT 5 NOT NULL,
	"status" integer DEFAULT 1 NOT NULL,
	"operator_id" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"commission_rate" double precision NOT NULL,
	"player_id" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"token" text NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	"playerId" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'setting' NOT NULL,
	"referral_code_count" integer DEFAULT 20 NOT NULL,
	"referral_commission_rate" double precision DEFAULT 0.25 NOT NULL,
	"rates" text DEFAULT '[{"USD": 1}]' NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"processed_at" timestamp (3),
	"wallet_id" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"amount" integer NOT NULL,
	"net_amount" integer,
	"currency_name" text,
	"fee_amount" integer,
	"product_id" text,
	"payment_method" text,
	"balance_before" integer,
	"balance_after" integer,
	"bonus_balance_before" integer,
	"bonus_balance_after" integer,
	"bonus_amount" integer,
	"wagering_requirement" integer,
	"wagering_progress" integer,
	"description" text,
	"provider" text,
	"provider_tx_id" text,
	"related_game_id" text,
	"related_round_id" text,
	"operator_id" text,
	"player_id" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"passwordHash" text NOT NULL,
	"image" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "vip_cashback" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" text,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"tiers_name" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "vip_info" (
	"id" text PRIMARY KEY NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer NOT NULL,
	"total_xp" integer NOT NULL,
	"player_id" text NOT NULL,
	"current_rankid" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "vip_level_up_bonus" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"amount" integer NOT NULL,
	"level_name" text NOT NULL,
	"level_xp" integer NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "vip_levels" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_id" text NOT NULL,
	"min_xp_needed" integer DEFAULT 0 NOT NULL,
	"level_number" integer DEFAULT 0 NOT NULL,
	"level_name" text NOT NULL,
	"spin_bonus_multiplier_id" double precision DEFAULT 0.1 NOT NULL,
	"setting_id" text,
	"level_up_bonus_amount" integer,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "vip_ranks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"min_xp" integer NOT NULL,
	"icon" text DEFAULT '/images/vip/rank1.avif' NOT NULL,
	"daily_cashback_max" integer NOT NULL,
	"monthly_cashback_max" integer NOT NULL,
	"wager_bonus_coin_pct" integer NOT NULL,
	"purchase_bonus_coin_pct" integer NOT NULL,
	"level_up_bonus_coin_pct" integer NOT NULL,
	"vip_spin_max_amount" integer DEFAULT 5 NOT NULL,
	"has_concierge" boolean NOT NULL,
	"has_vip_lounge_access" boolean NOT NULL,
	"is_invitation_only" boolean NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "vip_spin_rewards" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" text PRIMARY KEY NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"payment_method" text DEFAULT 'INSTORE_CASH' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"address" text,
	"cashtag" text,
	"operator_id" text NOT NULL,
	"last_used_at" timestamp (3),
	"player_id" text NOT NULL,
	"isActive" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" text,
	"amount" integer,
	"status" text,
	"metadata" "bytea",
	"id_number" text,
	"first_name" text,
	"last_name" text,
	"channels_id" text,
	"note" text,
	"currency_type" text,
	"currency" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
