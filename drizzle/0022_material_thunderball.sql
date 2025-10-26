CREATE TYPE "public"."BalanceType" AS ENUM('real', 'bonus', 'mixed');--> statement-breakpoint
CREATE TABLE "role" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"name" varchar(64) NOT NULL,
	"description" text,
	CONSTRAINT "role_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_role" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"role_id" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affiliates" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vip_info" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "affiliates" CASCADE;--> statement-breakpoint
DROP TABLE "vip_info" CASCADE;--> statement-breakpoint
ALTER TABLE "player_bonuses" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "player_bonuses" ALTER COLUMN "status" SET DEFAULT 'PENDING'::text;--> statement-breakpoint
DROP TYPE "public"."BonusStatus";--> statement-breakpoint
CREATE TYPE "public"."BonusStatus" AS ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
ALTER TABLE "player_bonuses" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."BonusStatus";--> statement-breakpoint
ALTER TABLE "player_bonuses" ALTER COLUMN "status" SET DATA TYPE "public"."BonusStatus" USING "status"::"public"."BonusStatus";--> statement-breakpoint
DROP TYPE "public"."game_categories";--> statement-breakpoint
CREATE TYPE "public"."game_categories" AS ENUM('SLOTS', 'FISH', 'TABLE');--> statement-breakpoint
ALTER TABLE "progres" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."ProgressTypeEnum";--> statement-breakpoint
CREATE TYPE "public"."ProgressTypeEnum" AS ENUM('ONE_PAY', 'SUM_PAY');--> statement-breakpoint
ALTER TABLE "progres" ALTER COLUMN "type" SET DATA TYPE "public"."ProgressTypeEnum" USING "type"::"public"."ProgressTypeEnum";--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'COMPLETED'::text;--> statement-breakpoint
DROP TYPE "public"."TransactionStatus";--> statement-breakpoint
CREATE TYPE "public"."TransactionStatus" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'COMPLETED'::"public"."TransactionStatus";--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "status" SET DATA TYPE "public"."TransactionStatus" USING "status"::"public"."TransactionStatus";--> statement-breakpoint
DROP TYPE "public"."TypeEnum";--> statement-breakpoint
CREATE TYPE "public"."TypeEnum" AS ENUM('ADD', 'OUT');--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."TypeOfTransaction";--> statement-breakpoint
CREATE TYPE "public"."TypeOfTransaction" AS ENUM('DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN', 'BONUS_AWARD', 'BONUS_WAGER', 'BONUS_CONVERT');--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "type" SET DATA TYPE "public"."TypeOfTransaction" USING "type"::"public"."TypeOfTransaction";--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "wallet_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "operator_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "version" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "version" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "version" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "wallet_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "balance_before" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "balance_after" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "bonus_balance_before" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "bonus_balance_before" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "bonus_balance_after" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "bonus_balance_after" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "operator_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_ranks" ALTER COLUMN "icon" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vip_ranks" ALTER COLUMN "daily_cashback_max" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "vip_ranks" ALTER COLUMN "monthly_cashback_max" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "wallets" ALTER COLUMN "payment_method" SET DEFAULT 'INSTORE_CASH'::"public"."PaymentMethod";--> statement-breakpoint
ALTER TABLE "wallets" ALTER COLUMN "payment_method" SET DATA TYPE "public"."PaymentMethod" USING "payment_method"::"public"."PaymentMethod";--> statement-breakpoint
ALTER TABLE "affiliate_logs" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "affiliate_logs" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "affiliate_logs" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "balances" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "balances" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "balances" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "balances" ADD COLUMN "real_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "balances" ADD COLUMN "bonus_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "balances" ADD COLUMN "total_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "balances" ADD COLUMN "total_real_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "balances" ADD COLUMN "total_bonus_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "balances" ADD COLUMN "total_real_losses" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "balances" ADD COLUMN "total_bonus_losses" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "balances" ADD COLUMN "last_update_transaction_id" text;--> statement-breakpoint
ALTER TABLE "bonuses" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "bonuses" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "bonuses" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "bonuses" ADD COLUMN "wagering_requirement" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "bonuses" ADD COLUMN "expiry_date" timestamp (3) NOT NULL;--> statement-breakpoint
ALTER TABLE "bonuses" ADD COLUMN "game_restrictions" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "deposit" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "deposit" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "deposit" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "jackpot_contributions" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "jackpot_contributions" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "jackpot_contributions" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "jackpot_wins" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "jackpot_wins" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "jackpot_wins" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "jackpots" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "jackpots" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "jwks" ADD COLUMN "updated_at" timestamp (3) DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "jwks" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "jwks" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "jwks" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "loyalty_fund_transactions" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "loyalty_fund_transactions" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "loyalty_fund_transactions" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "operator_settlements" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "operator_settlements" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "operator_settlements" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "operator_switch_history" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "operator_switch_history" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "operator_switch_history" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "operators" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "operators" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "player_bonuses" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "player_bonuses" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "player_bonuses" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "display_username" text NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "username" text NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "progres" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "progres" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "progres" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "game_id" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "processing_time" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "display_username" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_cashback" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_cashback" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_cashback" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_level_up_bonus" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_level_up_bonus" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_level_up_bonus" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_levels" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_levels" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_levels" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_ranks" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_ranks" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_ranks" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_ranks" ADD COLUMN "level" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_spin_rewards" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_spin_rewards" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_spin_rewards" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "vip_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "vip_xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "vip_rank_id" text;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "role_name_idx" ON "role" USING btree ("name");--> statement-breakpoint
CREATE INDEX "user_role_user_id_idx" ON "user_role" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_role_role_id_idx" ON "user_role" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_role_unique_idx" ON "user_role" USING btree ("user_id","role_id");--> statement-breakpoint
ALTER TABLE "balances" ADD CONSTRAINT "balances_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_bonuses" ADD CONSTRAINT "player_bonuses_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balances" DROP COLUMN "player_id";--> statement-breakpoint
ALTER TABLE "balances" DROP COLUMN "amount";--> statement-breakpoint
ALTER TABLE "balances" DROP COLUMN "bonus";--> statement-breakpoint
ALTER TABLE "bonuses" DROP COLUMN "option";--> statement-breakpoint
ALTER TABLE "bonuses" DROP COLUMN "percent";--> statement-breakpoint
ALTER TABLE "bonuses" DROP COLUMN "multiply";--> statement-breakpoint
ALTER TABLE "bonuses" DROP COLUMN "bonus_cap";--> statement-breakpoint
ALTER TABLE "bonuses" DROP COLUMN "min_bet";--> statement-breakpoint
ALTER TABLE "bonuses" DROP COLUMN "max_bet";--> statement-breakpoint
ALTER TABLE "bonuses" DROP COLUMN "slot";--> statement-breakpoint
ALTER TABLE "bonuses" DROP COLUMN "casino";--> statement-breakpoint
ALTER TABLE "bonuses" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "bonuses" DROP COLUMN "auto_calc";--> statement-breakpoint
ALTER TABLE "bonuses" DROP COLUMN "expire_date";--> statement-breakpoint
ALTER TABLE "bonuses" DROP COLUMN "is_expired";--> statement-breakpoint
ALTER TABLE "bonuses" DROP COLUMN "banner";--> statement-breakpoint
ALTER TABLE "bonuses" DROP COLUMN "particular_data";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "thumbnail_url";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "banner_url";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "developer";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "total_wagered";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "total_won";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "target_rtp";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "is_featured";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "stat_in";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "stat_out";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "jpg_ids";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "isHorizontal";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "jpg_id";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "label";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "device";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "gamebank";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "lines_percent_config_spin";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "lines_percent_config_spin_bonus";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "lines_percent_config_bonus";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "lines_percent_config_bonus_bonus";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "rezerv";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "cask";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "advanced";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "bet";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "scale_mode";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "slot_view_state";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "view";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "denomination";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "category_temp";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "original_id";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "bids";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "rtp_stat_in";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "rtp_stat_out";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "current_rtp";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "state";--> statement-breakpoint
ALTER TABLE "operators" DROP COLUMN "operator_secret";--> statement-breakpoint
ALTER TABLE "operators" DROP COLUMN "operator_access";--> statement-breakpoint
ALTER TABLE "operators" DROP COLUMN "callback_url";--> statement-breakpoint
ALTER TABLE "operators" DROP COLUMN "allowed_ips";--> statement-breakpoint
ALTER TABLE "operators" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "operators" DROP COLUMN "product_ids";--> statement-breakpoint
ALTER TABLE "operators" DROP COLUMN "balance";--> statement-breakpoint
ALTER TABLE "operators" DROP COLUMN "net_revenue";--> statement-breakpoint
ALTER TABLE "operators" DROP COLUMN "accepted_payments";--> statement-breakpoint
ALTER TABLE "operators" DROP COLUMN "owner_id";--> statement-breakpoint
ALTER TABLE "operators" DROP COLUMN "last_used_at";--> statement-breakpoint
ALTER TABLE "operators" DROP COLUMN "upfront_bank_credits";--> statement-breakpoint
ALTER TABLE "operators" DROP COLUMN "platform_fee_rate";--> statement-breakpoint
ALTER TABLE "operators" DROP COLUMN "loyalty_contribution_rate";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "playername";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "password_hash";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "access_token";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "refresh_token";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "access_token_expires_at";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "refresh_token_expires_at";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "current_game_session_data_id";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "current_auth_session_data_id";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "avatar_url";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "phpId";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "last_login_at";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "total_xp_gained";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "vip_info_id";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "last_seen";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "rtg_block_time";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "path";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "invitor_id";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "avatar";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "count_balance";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "count_tournaments";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "count_happyhours";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "count_refunds";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "count_progress";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "count_daily_entries";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "count_invite";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "count_welcomebonus";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "count_smsbonus";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "count_wheelfortune";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "address";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "active_wallet_id";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "active_operator_id";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "inviteCode";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "processed_at";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "net_amount";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "currency_name";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "fee_amount";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "payment_method";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "bonus_amount";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "wagering_requirement";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "wagering_progress";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "provider";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "provider_tx_id";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "related_game_id";--> statement-breakpoint
ALTER TABLE "vip_ranks" DROP COLUMN "wager_bonus_coin_pct";--> statement-breakpoint
ALTER TABLE "vip_ranks" DROP COLUMN "purchase_bonus_coin_pct";--> statement-breakpoint
ALTER TABLE "vip_ranks" DROP COLUMN "level_up_bonus_coin_pct";--> statement-breakpoint
ALTER TABLE "vip_ranks" DROP COLUMN "vip_spin_max_amount";--> statement-breakpoint
ALTER TABLE "vip_ranks" DROP COLUMN "has_concierge";--> statement-breakpoint
ALTER TABLE "vip_ranks" DROP COLUMN "has_vip_lounge_access";--> statement-breakpoint
ALTER TABLE "vip_ranks" DROP COLUMN "is_invitation_only";--> statement-breakpoint
ALTER TABLE "wallets" DROP COLUMN "balance";--> statement-breakpoint
ALTER TABLE "wallets" DROP COLUMN "isActive";--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "vip_ranks" ADD CONSTRAINT "vip_ranks_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "vip_ranks" ADD CONSTRAINT "vip_ranks_level_unique" UNIQUE("level");--> statement-breakpoint
DROP TYPE "public"."GameProviderName";--> statement-breakpoint
DROP TYPE "public"."Permission";--> statement-breakpoint
DROP TYPE "public"."Role";--> statement-breakpoint
DROP TYPE "public"."SystemEnum";