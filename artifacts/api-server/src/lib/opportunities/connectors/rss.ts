import { XMLParser } from "fast-xml-parser";
import { NormalizedOpportunity, SyncRunResult } from "../types.js";
import { saveOpportunity, recordSyncRun } from "../core.js";

interface RSSItem {
  title?: string | { "#text"?: string };
  description?: string | { "#text"?: string };
  link?: string | { "#text"?: string };
  guid?: string | { "#text"?: string; "@_isPermaLink"?: string };
  pubDate?: string;
  "dc:date"?: string;
  category?: string | string[];
}

function text(val: unknown): string | undefined {
  if (typeof val === "string") return val || undefined;
  if (val && typeof val === "object" && "#text" in val) return String((val as Record<string, unknown>)["#text"]) || undefined;
  return undefined;
}

function parseRSS(xml: string): RSSItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
  });
  const doc = parser.parse(xml);

  // Handle RSS 2.0 and Atom
  const channel = doc?.rss?.channel ?? doc?.feed;
  if (!channel) return [];

  const items: RSSItem[] = channel.item ?? channel.entry ?? [];
  return Array.isArray(items) ? items : [items];
}

function dedupeKey(item: RSSItem): string | undefined {
  const g = text(item.guid);
  const l = text(item.link);
  return g ?? l;
}

export async function runRSSSync(
  sourceId: string,
  sourceName: string,
  config: { feedUrl: string; state?: string; tradeType?: string }
): Promise<SyncRunResult> {
  const startedAt = new Date();
  let fetched = 0;
  let inserted = 0;
  let updated = 0;

  try {
    const response = await fetch(config.feedUrl, {
      headers: { "User-Agent": "ConstructionByApex/1.0 (+https://apexconstruction.com)" },
    });

    if (!response.ok) {
      throw new Error(`RSS fetch error: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    const items = parseRSS(xml);
    fetched = items.length;

    for (const item of items) {
      const title = text(item.title) ?? "Untitled RSS Item";
      const link = text(item.link);
      const guid = text(item.guid);
      const pubDate = item.pubDate ?? item["dc:date"];
      const postedAt = pubDate ? new Date(pubDate) : undefined;

      const normalized: NormalizedOpportunity = {
        title,
        description: text(item.description),
        tradeType: config.tradeType,
        state: config.state,
        sourceUrl: link,
        externalId: dedupeKey(item) ?? title,
        sourceName,
        ingestionType: "rss",
        postedAt,
        rawPayload: item,
      };

      const { inserted: ins, updated: upd } = await saveOpportunity(sourceId, normalized);
      if (ins) inserted++;
      if (upd) updated++;
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
