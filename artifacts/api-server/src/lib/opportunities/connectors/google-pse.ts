import type { NormalizedOpportunity, OpportunityConnector } from "../types";

interface GooglePSEParams {
  apiKey: string;
  searchEngineId: string;
  queries?: string[];
  state?: string;
  limit?: number;
}

interface GoogleSearchItem {
  title: string;
  link: string;
  snippet?: string;
  pagemap?: {
    metatags?: Array<Record<string, string>>;
  };
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[];
}

function inferTradeType(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes("roofing") || lower.includes("roof")) return "roofing";
  if (lower.includes("hvac") || lower.includes("heating") || lower.includes("air condition")) return "hvac";
  if (lower.includes("concrete") || lower.includes("pavement")) return "concrete";
  if (lower.includes("painting") || lower.includes("paint")) return "painting";
  if (lower.includes("construction") || lower.includes("contractor")) return "general";
  return undefined;
}

const DEFAULT_QUERIES = [
  "construction bid rfp",
  "roofing contract bid",
  "hvac maintenance rfp",
  "concrete work bid opportunity",
  "painting contract rfp",
];

export class GooglePSEConnector implements OpportunityConnector {
  async fetch(params: Record<string, unknown>): Promise<NormalizedOpportunity[]> {
    const { apiKey, searchEngineId, queries = DEFAULT_QUERIES, state, limit = 50 } = params as GooglePSEParams;

    const allResults: NormalizedOpportunity[] = [];
    const seen = new Set<string>();

    const searchQueries = state
      ? queries.map((q) => `${q} ${state}`)
      : queries;

    for (const query of searchQueries) {
      if (allResults.length >= limit) break;

      const searchParams = new URLSearchParams({
        key: apiKey,
        cx: searchEngineId,
        q: query,
        num: "10",
      });

      const url = `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google PSE API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as GoogleSearchResponse;
      const items = data.items ?? [];

      for (const item of items) {
        if (seen.has(item.link)) continue;
        seen.add(item.link);

        const text = `${item.title} ${item.snippet ?? ""}`;

        allResults.push({
          title: item.title,
          description: item.snippet,
          tradeType: inferTradeType(text),
          state,
          sourceUrl: item.link,
          status: "new",
          rawPayloadJson: item as unknown as Record<string, unknown>,
          ingestMethod: "google_pse",
        });
      }
    }

    return allResults;
  }
}

export async function fetchGooglePSE(
  sourceId: number,
  params: GooglePSEParams
): Promise<NormalizedOpportunity[]> {
  const connector = new GooglePSEConnector();
  const results = await connector.fetch(params);
  return results.map((r) => ({ ...r, sourceId, status: "new" }));
}
