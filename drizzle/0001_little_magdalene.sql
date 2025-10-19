ALTER TABLE "games" ADD COLUMN "state" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "jackpot_config" jsonb;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "game_groups" jsonb;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "vip_config" jsonb;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "wagering_config" jsonb;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "system_limits" jsonb;