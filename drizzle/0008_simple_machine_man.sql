ALTER TYPE "public"."Role" ADD VALUE 'USER' BEFORE 'PLAYER';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'USER';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL;