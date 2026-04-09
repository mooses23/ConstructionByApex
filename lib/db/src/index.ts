import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === "production";

// Prefer individual PG* variables when available (Replit Helium uses PGHOST=helium).
// Fall back to DATABASE_URL for external databases (Supabase, Neon, etc.).
function buildConnectionConfig(): pg.PoolConfig {
  if (process.env.PGHOST && process.env.PGDATABASE) {
    return {
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    };
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  return {
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  };
}

export const pool = new Pool(buildConnectionConfig());
export const db = drizzle(pool, { schema });

export * from "./schema";
