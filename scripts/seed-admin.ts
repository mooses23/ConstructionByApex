import { db } from "@workspace/db";
import { adminUsersTable } from "@workspace/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "apexbuilder";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error("ADMIN_PASSWORD environment variable is required.");
  console.error("Usage: ADMIN_PASSWORD=YourPassword pnpm --filter @workspace/scripts run seed-admin");
  process.exit(1);
}

async function seedAdmin() {
  const existing = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.username, ADMIN_USERNAME))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Admin user "${ADMIN_USERNAME}" already exists — skipping.`);
    process.exit(0);
  }

  const hash = await bcrypt.hash(ADMIN_PASSWORD!, 12);

  await db.insert(adminUsersTable).values({
    username: ADMIN_USERNAME,
    passwordHash: hash,
  });

  console.log(`Admin user "${ADMIN_USERNAME}" created successfully.`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin user:", err);
  process.exit(1);
});
