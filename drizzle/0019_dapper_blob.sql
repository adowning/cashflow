ALTER TABLE "wallets" RENAME COLUMN "user_id" TO "player_id";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "invitorId";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "updated_at";