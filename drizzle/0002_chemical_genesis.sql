ALTER TABLE "settings" ADD COLUMN "shared_urls" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "show_shared" boolean DEFAULT true NOT NULL;