-- Opportunities module: 5 new tables for bid/opportunity management
-- Migration: 0001_opportunities_module
-- Created: 2026-04-09

CREATE TABLE IF NOT EXISTS "opportunity_sources" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "source_type" TEXT NOT NULL,
  "config" JSONB NOT NULL DEFAULT '{}',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_sync_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "opportunities" (
  "id" SERIAL PRIMARY KEY,
  "source_id" INTEGER REFERENCES "opportunity_sources"("id"),
  "external_id" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "trade_type" TEXT,
  "status" TEXT NOT NULL DEFAULT 'new',
  "priority_level" TEXT NOT NULL DEFAULT 'low',
  "score" INTEGER NOT NULL DEFAULT 0,
  "score_reasons_json" JSONB NOT NULL DEFAULT '[]',
  "budget_min" NUMERIC(14, 2),
  "budget_max" NUMERIC(14, 2),
  "state" TEXT,
  "city" TEXT,
  "contact_name" TEXT,
  "contact_email" TEXT,
  "contact_phone" TEXT,
  "source_url" TEXT,
  "posted_at" TIMESTAMPTZ,
  "deadline_at" TIMESTAMPTZ,
  "raw_payload_json" JSONB NOT NULL DEFAULT '{}',
  "ingest_method" TEXT NOT NULL DEFAULT 'manual',
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "opportunities_status_idx" ON "opportunities"("status");
CREATE INDEX IF NOT EXISTS "opportunities_score_idx" ON "opportunities"("score");
CREATE INDEX IF NOT EXISTS "opportunities_state_idx" ON "opportunities"("state");
CREATE INDEX IF NOT EXISTS "opportunities_trade_type_idx" ON "opportunities"("trade_type");
CREATE INDEX IF NOT EXISTS "opportunities_posted_at_idx" ON "opportunities"("posted_at");
CREATE UNIQUE INDEX IF NOT EXISTS "opportunities_source_external_id_idx" ON "opportunities"("source_id", "external_id") WHERE source_id IS NOT NULL AND external_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS "opportunity_sync_runs" (
  "id" SERIAL PRIMARY KEY,
  "source_id" INTEGER REFERENCES "opportunity_sources"("id"),
  "status" TEXT NOT NULL DEFAULT 'pending',
  "records_fetched" INTEGER NOT NULL DEFAULT 0,
  "records_inserted" INTEGER NOT NULL DEFAULT 0,
  "records_skipped" INTEGER NOT NULL DEFAULT 0,
  "error_message" TEXT,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completed_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "opportunity_rules" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "keywords" JSONB NOT NULL DEFAULT '[]',
  "trade_types" JSONB NOT NULL DEFAULT '[]',
  "target_states" JSONB NOT NULL DEFAULT '[]',
  "min_budget" NUMERIC(14, 2),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "opportunity_events" (
  "id" SERIAL PRIMARY KEY,
  "opportunity_id" INTEGER NOT NULL REFERENCES "opportunities"("id"),
  "event_type" TEXT NOT NULL,
  "note" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
