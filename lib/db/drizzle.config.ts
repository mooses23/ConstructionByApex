import { defineConfig } from "drizzle-kit";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Prefer PGHOST (Replit Helium) over DATABASE_URL when available
const connectionConfig =
  process.env.PGHOST && process.env.PGDATABASE
    ? {
        host: process.env.PGHOST,
        port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        ssl: false,
      }
    : process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false }
    : (() => { throw new Error("DATABASE_URL or PG* variables must be set"); })();

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: connectionConfig as Parameters<typeof defineConfig>[0]["dbCredentials"],
});
