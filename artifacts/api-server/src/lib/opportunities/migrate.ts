import { pool } from "@workspace/db";

export async function runOpportunitiesMigration(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS opportunity_sources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        ingestion_type TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT true,
        config_json JSONB,
        poll_interval_minutes INTEGER DEFAULT 60,
        last_sync_at TIMESTAMPTZ,
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS opportunities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_id UUID REFERENCES opportunity_sources(id) ON DELETE SET NULL,
        external_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        trade_type TEXT,
        city TEXT,
        state TEXT,
        budget_min NUMERIC(14,2),
        budget_max NUMERIC(14,2),
        estimated_value NUMERIC(14,2),
        posted_at TIMESTAMPTZ,
        due_at TIMESTAMPTZ,
        source_url TEXT,
        source_name TEXT,
        ingestion_type TEXT,
        score NUMERIC(6,2) NOT NULL DEFAULT 0,
        priority_level TEXT,
        relevance_reason TEXT,
        score_reasons_json JSONB,
        raw_payload_json JSONB,
        status TEXT NOT NULL DEFAULT 'new',
        reviewed BOOLEAN NOT NULL DEFAULT false,
        converted_to_lead BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS opp_status_idx ON opportunities(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS opp_score_idx ON opportunities(score)`);
    await client.query(`CREATE INDEX IF NOT EXISTS opp_state_idx ON opportunities(state)`);
    await client.query(`CREATE INDEX IF NOT EXISTS opp_trade_type_idx ON opportunities(trade_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS opp_posted_at_idx ON opportunities(posted_at)`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS opportunity_sync_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_id UUID REFERENCES opportunity_sources(id) ON DELETE CASCADE,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        finished_at TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'running',
        items_fetched INTEGER DEFAULT 0,
        items_inserted INTEGER DEFAULT 0,
        items_updated INTEGER DEFAULT 0,
        error_text TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS opportunity_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT true,
        include_keywords TEXT[] DEFAULT '{}',
        exclude_keywords TEXT[] DEFAULT '{}',
        states TEXT[] DEFAULT '{}',
        trade_types TEXT[] DEFAULT '{}',
        min_budget NUMERIC(14,2),
        max_budget NUMERIC(14,2),
        min_score NUMERIC(6,2),
        urgency_weight NUMERIC(4,2) DEFAULT 1,
        recency_weight NUMERIC(4,2) DEFAULT 1,
        budget_weight NUMERIC(4,2) DEFAULT 1,
        keyword_weight NUMERIC(4,2) DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS opportunity_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        event_note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  } finally {
    client.release();
  }
}
