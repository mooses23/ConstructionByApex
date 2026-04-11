import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { adminUsersTable } from "@workspace/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const { Pool } = pg;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "apexbuilder";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error("ADMIN_PASSWORD environment variable is required.");
  console.error("");
  console.error("Local (Replit):");
  console.error("  ADMIN_PASSWORD=YourPassword pnpm --filter @workspace/scripts run seed-admin");
  console.error("");
  console.error("Production (Supabase):");
  console.error("  DATABASE_URL=postgresql://... ADMIN_PASSWORD=YourPassword pnpm --filter @workspace/scripts run seed-admin");
  process.exit(1);
}

function buildPool(): pg.Pool {
  if (process.env.DATABASE_URL) {
    console.log("Using DATABASE_URL for database connection.");
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }

  if (process.env.PGHOST && process.env.PGDATABASE) {
    console.log("Using PG* env vars for database connection.");
    return new Pool({
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
    });
  }

  console.error("No database connection configured. Set DATABASE_URL or PG* env vars.");
  process.exit(1);
}

async function seedAdmin() {
  const pool = buildPool();
  const db = drizzle(pool);

  try {
    const existing = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.username, ADMIN_USERNAME))
      .limit(1);

    if (existing.length > 0) {
      console.log(`Admin user "${ADMIN_USERNAME}" already exists — updating password.`);
      const hash = await bcrypt.hash(ADMIN_PASSWORD!, 12);
      await db
        .update(adminUsersTable)
        .set({ passwordHash: hash })
        .where(eq(adminUsersTable.username, ADMIN_USERNAME));
      console.log(`Password updated for "${ADMIN_USERNAME}".`);
    } else {
      const hash = await bcrypt.hash(ADMIN_PASSWORD!, 12);
      await db.insert(adminUsersTable).values({
        username: ADMIN_USERNAME,
        passwordHash: hash,
      });
      console.log(`Admin user "${ADMIN_USERNAME}" created successfully.`);
    }
  } finally {
    await pool.end();
  }
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin user:", err);
  process.exit(1);
});
