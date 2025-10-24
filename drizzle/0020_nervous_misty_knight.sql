ALTER TABLE "account" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "updated_at" TO "updatedAt";--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "playerId" TO "createdAt";--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "updated_at" TO "updatedAt";--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "created_at" TO "activeOrganizationId";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "username" TO "createdAt";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "displayUsername" TO "updatedAt";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "two_factor_enabled" TO "banReason";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "player_id" TO "banExpires";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "banned" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "banned" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "impersonatedBy" text;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "password_hash";