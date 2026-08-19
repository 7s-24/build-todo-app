DROP INDEX "txns_fingerprint_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "txns_dedupe_idx" ON "transactions" USING btree ("category","occurred_at","amount","currency",coalesce("note", ''));--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "fingerprint";