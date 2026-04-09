import { OpportunitySource } from "@workspace/db";
import { runSAMGovSync } from "./connectors/samgov.js";
import { runRSSSync } from "./connectors/rss.js";
import { runSearchSync } from "./connectors/search.js";
import { SyncRunResult } from "./types.js";

export async function dispatchSync(source: OpportunitySource): Promise<SyncRunResult> {
  const config = (source.configJson ?? {}) as Record<string, unknown>;

  switch (source.ingestionType) {
    case "api": {
      return runSAMGovSync(source.id, source.name, {
        keywords: config.keywords as string | undefined,
        state: config.state as string | undefined,
        limit: config.limit as number | undefined,
      });
    }

    case "rss": {
      const feedUrl = config.feedUrl as string | undefined;
      if (!feedUrl) {
        return { itemsFetched: 0, itemsInserted: 0, itemsUpdated: 0, error: "feedUrl not set in config_json" };
      }
      return runRSSSync(source.id, source.name, {
        feedUrl,
        state: config.state as string | undefined,
        tradeType: config.tradeType as string | undefined,
      });
    }

    case "search": {
      return runSearchSync(source.id, source.name, {
        queries: config.queries as string[] | undefined,
        apiKey: config.apiKey as string | undefined,
        cx: config.cx as string | undefined,
        state: config.state as string | undefined,
      });
    }

    case "manual":
    case "email": {
      return {
        itemsFetched: 0,
        itemsInserted: 0,
        itemsUpdated: 0,
        error: `Connector type '${source.ingestionType}' does not support automatic sync — use the API to ingest records.`,
      };
    }

    default: {
      return {
        itemsFetched: 0,
        itemsInserted: 0,
        itemsUpdated: 0,
        error: `Unknown ingestion type: ${source.ingestionType}`,
      };
    }
  }
}
