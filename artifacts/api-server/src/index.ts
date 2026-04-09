import app from "./app";
import { logger } from "./lib/logger";
import { runOpportunitiesMigration } from "./lib/opportunities/migrate";
import { seedOhioSources } from "./lib/opportunities/ohioSources";

const rawPort = process.env["PORT"];
const port = rawPort ? Number(rawPort) : 3000;

if (rawPort && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

try {
  await runOpportunitiesMigration();
  logger.info("Opportunities schema migration complete");
} catch (err) {
  logger.error({ err }, "Opportunities schema migration failed — server will attempt to start anyway");
}

try {
  await seedOhioSources();
  logger.info("Ohio source presets seeded");
} catch (err) {
  logger.error({ err }, "Ohio source seeding failed — server will attempt to start anyway");
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
