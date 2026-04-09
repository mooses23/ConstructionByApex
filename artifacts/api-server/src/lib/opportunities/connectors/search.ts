import { NormalizedOpportunity, SyncRunResult } from "../types.js";
import { saveOpportunity, recordSyncRun } from "../core.js";

interface PSEItem {
  title?: string;
  snippet?: string;
  link?: string;
  displayLink?: string;
}

interface PSEResponse {
  items?: PSEItem[];
  searchInformation?: { totalResults?: string };
  error?: { message?: string };
}

const DEFAULT_QUERIES = [
  "construction bid ohio",
  "rfp maintenance ohio",
  "property maintenance vendor ohio",
];

export async function runSearchSync(
  sourceId: string,
  sourceName: string,
  config: {
    queries?: string[];
    apiKey?: string;
    cx?: string;
    state?: string;
  }
): Promise<SyncRunResult> {
  const startedAt = new Date();
  const apiKey = config.apiKey ?? process.env.GOOGLE_PSE_API_KEY;
  const cx = config.cx ?? process.env.GOOGLE_PSE_CX;

  if (!apiKey || !cx) {
    const result: SyncRunResult = {
      itemsFetched: 0,
      itemsInserted: 0,
      itemsUpdated: 0,
      error: "GOOGLE_PSE_API_KEY and GOOGLE_PSE_CX environment variables not set",
    };
    await recordSyncRun(sourceId, result, startedAt);
    return result;
  }

  const queries = config.queries ?? DEFAULT_QUERIES;
  let fetched = 0;
  let inserted = 0;
  let updated = 0;

  try {
    for (const q of queries) {
      const params = new URLSearchParams({ key: apiKey, cx, q, num: "10" });
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Google PSE error: ${response.status} ${response.statusText}`);
      }

      const data: PSEResponse = await response.json();
      if (data.error) throw new Error(data.error.message);

      const items = data.items ?? [];
      fetched += items.length;

      for (const item of items) {
        const normalized: NormalizedOpportunity = {
          title: item.title ?? "Untitled Search Result",
          description: item.snippet,
          state: config.state,
          sourceUrl: item.link,
          externalId: item.link,
          sourceName,
          ingestionType: "search",
          rawPayload: item,
        };

        // Search results go into review queue only — status='new', never auto-convert
        const { inserted: ins, updated: upd } = await saveOpportunity(sourceId, normalized);
        if (ins) inserted++;
        if (upd) updated++;
      }
    }

    const result: SyncRunResult = { itemsFetched: fetched, itemsInserted: inserted, itemsUpdated: updated };
    await recordSyncRun(sourceId, result, startedAt);
    return result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const result: SyncRunResult = { itemsFetched: fetched, itemsInserted: inserted, itemsUpdated: updated, error };
    await recordSyncRun(sourceId, result, startedAt);
    return result;
  }
}
