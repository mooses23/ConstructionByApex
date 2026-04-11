import pg from "pg";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "apexbuilder";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}
if (!ADMIN_PASSWORD) {
  console.error("ADMIN_PASSWORD is required.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log("Connected to database.");

    console.log("\n--- Dropping ALL existing tables ---");
    await client.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT tablename FROM pg_tables
          WHERE schemaname = 'public'
        ) LOOP
          EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
          RAISE NOTICE 'Dropped table: %', r.tablename;
        END LOOP;
      END $$;
    `);
    console.log("All tables dropped.\n");

    console.log("--- Creating Apex tables ---");

    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        ideal_for TEXT NOT NULL,
        category TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0
      )
    `);
    console.log("  services");

    await client.query(`
      CREATE TABLE IF NOT EXISTS project_gallery (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        summary TEXT NOT NULL,
        city TEXT NOT NULL,
        image_url TEXT NOT NULL,
        before_image_url TEXT,
        after_image_url TEXT,
        featured BOOLEAN NOT NULL DEFAULT false,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log("  project_gallery");

    await client.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id SERIAL PRIMARY KEY,
        author_name TEXT NOT NULL,
        author_city TEXT NOT NULL,
        rating INTEGER NOT NULL DEFAULT 5,
        content TEXT NOT NULL,
        service_type TEXT NOT NULL,
        featured BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log("  testimonials");

    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        city TEXT NOT NULL,
        zip_code TEXT NOT NULL,
        service_needed TEXT NOT NULL,
        project_description TEXT NOT NULL,
        preferred_timeline TEXT NOT NULL,
        preferred_contact_method TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        photo_urls TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log("  leads");

    await client.query(`
      CREATE TABLE IF NOT EXISTS lead_notes (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log("  lead_notes");

    await client.query(`
      CREATE TABLE IF NOT EXISTS lead_contacts (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id),
        method TEXT NOT NULL,
        outcome TEXT NOT NULL,
        notes TEXT,
        contacted_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log("  lead_contacts");

    await client.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id),
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log("  quotes");

    await client.query(`
      CREATE TABLE IF NOT EXISTS quote_items (
        id SERIAL PRIMARY KEY,
        quote_id INTEGER NOT NULL REFERENCES quotes(id),
        description TEXT NOT NULL,
        quantity NUMERIC(10,2) NOT NULL,
        unit_price NUMERIC(12,2) NOT NULL,
        total NUMERIC(12,2) NOT NULL
      )
    `);
    console.log("  quote_items");

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log("  admin_users");

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log("  admin_sessions");

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
    console.log("  opportunity_sources");

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
    console.log("  opportunities");

    await client.query(`CREATE INDEX IF NOT EXISTS opp_status_idx ON opportunities(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS opp_score_idx ON opportunities(score)`);
    await client.query(`CREATE INDEX IF NOT EXISTS opp_state_idx ON opportunities(state)`);
    await client.query(`CREATE INDEX IF NOT EXISTS opp_trade_type_idx ON opportunities(trade_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS opp_posted_at_idx ON opportunities(posted_at)`);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS opp_source_external_id_idx
      ON opportunities(source_id, external_id)
      WHERE source_id IS NOT NULL AND external_id IS NOT NULL
    `);

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
    console.log("  opportunity_sync_runs");

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
    console.log("  opportunity_rules");

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
    console.log("  opportunity_events");

    console.log("\nAll 15 tables created.\n");

    console.log("--- Seeding admin user ---");
    const hash = await bcrypt.hash(ADMIN_PASSWORD!, 12);
    await client.query(
      `INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password_hash = $2`,
      [ADMIN_USERNAME, hash]
    );
    console.log(`  Admin user "${ADMIN_USERNAME}" seeded.`);

    console.log("\nDone! Your production database is ready.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
