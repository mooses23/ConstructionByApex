import app from "./app";
import { logger } from "./lib/logger";
import { runOpportunitiesMigration } from "./lib/opportunities/migrate";

const rawPort = process.env["PORT"];
const port = rawPort ? Number(rawPort) : 3000;

if (rawPort && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

try {
  await runOpportunitiesMigration();
  logger.info("Opportunities schema migration complete");
} catch (err) {
  logger.error({ err }, "Opportunities schema migration failed");
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
