import { XMLParser } from "fast-xml-parser";
import type { NormalizedOpportunity, OpportunityConnector } from "../types";

interface RSSParams {
  feedUrl: string;
  sourceId?: number;
  tradeType?: string;
  state?: string;
}

interface ParsedFeedItem {
  title: string;
  description?: string;
  link?: string;
  pubDate?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  cdataPropName: "__cdata",
  allowBooleanAttributes: true,
});

function extractText(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj["__cdata"] === "string") return obj["__cdata"].trim() || undefined;
    if (typeof obj["#text"] === "string") return obj["#text"].trim() || undefined;
  }
  return undefined;
}

function parseFeedItems(xml: string): ParsedFeedItem[] {
  const parsed = parser.parse(xml);
  const channel =
    parsed?.rss?.channel ??
    parsed?.feed ??
    parsed?.["rdf:RDF"]?.channel ??
    {};

  const rawItems: Record<string, unknown>[] = [];
  const items = channel.item ?? channel.entry ?? [];

  if (Array.isArray(items)) {
    rawItems.push(...(items as Record<string, unknown>[]));
  } else if (items && typeof items === "object") {
    rawItems.push(items as Record<string, unknown>);
  }

  const result: ParsedFeedItem[] = [];
  for (const item of rawItems) {
    const title = extractText(item.title);
    if (!title) continue;
    result.push({
      title,
      description: extractText(item.description) ?? extractText(item.summary),
      link: extractText(item.link) ?? extractText(item.guid),
      pubDate: extractText(item.pubDate) ?? extractText(item.updated) ?? extractText(item.published),
    });
  }
  return result;
}

export class RSSConnector implements OpportunityConnector {
  async fetch(params: Record<string, unknown>): Promise<NormalizedOpportunity[]> {
    const { feedUrl, sourceId, tradeType, state } = params as RSSParams;

    const response = await fetch(String(feedUrl), {
      headers: { Accept: "application/rss+xml, application/xml, application/atom+xml, text/xml" },
    });

    if (!response.ok) {
      throw new Error(`RSS fetch error: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    const items = parseFeedItems(xml);

    return items.map((item): NormalizedOpportunity => ({
      sourceId: typeof sourceId === "number" ? sourceId : undefined,
      title: item.title,
      description: item.description,
      tradeType,
      state,
      sourceUrl: item.link,
      postedAt: item.pubDate ? new Date(item.pubDate) : undefined,
      rawPayloadJson: item as unknown as Record<string, unknown>,
      ingestMethod: "rss",
    }));
  }
}

export async function fetchRSSFeed(
  sourceId: number,
  feedUrl: string,
  meta?: { tradeType?: string; state?: string }
): Promise<NormalizedOpportunity[]> {
  const connector = new RSSConnector();
  return connector.fetch({ feedUrl, sourceId, ...meta });
}
