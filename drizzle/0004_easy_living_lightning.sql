CREATE TABLE "categories" (
	"name" text PRIMARY KEY NOT NULL,
	"group" text NOT NULL,
	"detail" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fx_rates" (
	"currency" text PRIMARY KEY NOT NULL,
	"rate" numeric(12, 4) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"needs_target" numeric(5, 4) DEFAULT '0.6' NOT NULL,
	"wants_target" numeric(5, 4) DEFAULT '0.1' NOT NULL,
	"investment_target" numeric(5, 4) DEFAULT '0.3' NOT NULL,
	"start_bank" numeric(14, 2) DEFAULT '0' NOT NULL,
	"start_investment" numeric(14, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT '日元' NOT NULL,
	"note" text,
	"fingerprint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "txns_fingerprint_idx" ON "transactions" USING btree ("fingerprint");