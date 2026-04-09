import { pool } from "@workspace/db";

export async function runOpportunitiesMigration(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS opportunity_sources (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        source_type TEXT NOT NULL,
        config JSONB NOT NULL DEFAULT '{}',
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_sync_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS opportunities (
        id SERIAL PRIMARY KEY,
        source_id INTEGER REFERENCES opportunity_sources(id) ON DELETE SET NULL,
        external_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        trade_type TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        priority_level TEXT NOT NULL DEFAULT 'low',
        score INTEGER NOT NULL DEFAULT 0,
        score_reasons_json JSONB NOT NULL DEFAULT '[]',
        budget_min NUMERIC(14,2),
        budget_max NUMERIC(14,2),
        state TEXT,
        city TEXT,
        contact_name TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        source_url TEXT,
        posted_at TIMESTAMPTZ,
        deadline_at TIMESTAMPTZ,
        raw_payload_json JSONB NOT NULL DEFAULT '{}',
        ingest_method TEXT NOT NULL DEFAULT 'manual',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS opportunities_source_external_id_idx
      ON opportunities(source_id, external_id)
      WHERE source_id IS NOT NULL AND external_id IS NOT NULL
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS opp_status_idx ON opportunities(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS opp_score_idx ON opportunities(score)`);
    await client.query(`CREATE INDEX IF NOT EXISTS opp_state_idx ON opportunities(state)`);
    await client.query(`CREATE INDEX IF NOT EXISTS opp_trade_type_idx ON opportunities(trade_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS opp_posted_at_idx ON opportunities(posted_at)`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS opportunity_sync_runs (
        id SERIAL PRIMARY KEY,
        source_id INTEGER REFERENCES opportunity_sources(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'running',
        records_fetched INTEGER NOT NULL DEFAULT 0,
        records_inserted INTEGER NOT NULL DEFAULT 0,
        records_skipped INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        completed_at TIMESTAMPTZ
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS opportunity_rules (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        keywords JSONB NOT NULL DEFAULT '[]',
        trade_types JSONB NOT NULL DEFAULT '[]',
        target_states JSONB NOT NULL DEFAULT '[]',
        min_budget NUMERIC(14,2),
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await client.query(`
      ALTER TABLE opportunity_rules
      ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS opportunity_events (
        id SERIAL PRIMARY KEY,
        opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        note TEXT,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  } finally {
    client.release();
  }
}
