import { NormalizedOpportunity, SyncRunResult } from "../types.js";
import { saveOpportunity, recordSyncRun } from "../core.js";

interface SAMOpportunity {
  noticeId?: string;
  title?: string;
  description?: string;
  naicsCode?: string;
  type?: string;
  postedDate?: string;
  responseDeadLine?: string;
  placeOfPerformance?: {
    city?: { name?: string };
    state?: { code?: string; name?: string };
  };
  uiLink?: string;
  award?: { amount?: number };
  organizationHierarchy?: { name?: string }[];
}

interface SAMApiResponse {
  opportunitiesData?: SAMOpportunity[];
  totalRecords?: number;
}

const SAM_BASE = "https://api.sam.gov/opportunities/v2/search";

function normalize(raw: SAMOpportunity, sourceName: string): NormalizedOpportunity {
  const pop = raw.placeOfPerformance;
  return {
    title: raw.title ?? "Untitled SAM.gov Opportunity",
    description: raw.description,
    tradeType: naicsToTrade(raw.naicsCode),
    category: raw.type,
    city: pop?.city?.name,
    state: pop?.state?.code ?? pop?.state?.name,
    postedAt: raw.postedDate ? new Date(raw.postedDate) : undefined,
    dueAt: raw.responseDeadLine ? new Date(raw.responseDeadLine) : undefined,
    sourceUrl: raw.uiLink,
    externalId: raw.noticeId,
    sourceName,
    ingestionType: "api",
    rawPayload: raw,
  };
}

function naicsToTrade(naics?: string): string | undefined {
  if (!naics) return undefined;
  const code = parseInt(naics, 10);
  if (code >= 236000 && code < 238000) return "general contracting";
  if (code >= 238100 && code < 238200) return "hvac";
  if (code >= 238310 && code < 238320) return "painting";
  if (code >= 238160 && code < 238170) return "roofing";
  if (code >= 238300 && code < 238400) return "concrete";
  return "general contracting";
}

export async function runSAMGovSync(
  sourceId: string,
  sourceName: string,
  config: { keywords?: string; state?: string; limit?: number }
): Promise<SyncRunResult> {
  const startedAt = new Date();
  const apiKey = process.env.SAM_GOV_API_KEY;

  if (!apiKey) {
    const result: SyncRunResult = {
      itemsFetched: 0,
      itemsInserted: 0,
      itemsUpdated: 0,
      error: "SAM_GOV_API_KEY environment variable not set",
    };
    await recordSyncRun(sourceId, result, startedAt);
    return result;
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    limit: String(config.limit ?? 25),
    offset: "0",
    postedFrom: formatDate(daysAgo(30)),
    postedTo: formatDate(new Date()),
  });
  if (config.keywords) params.set("keywords", config.keywords);
  if (config.state) params.set("state", config.state);

  let fetched = 0;
  let inserted = 0;
  let updated = 0;

  try {
    const response = await fetch(`${SAM_BASE}?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`SAM.gov API error: ${response.status} ${response.statusText}`);
    }

    const data: SAMApiResponse = await response.json();
    const opportunities = data.opportunitiesData ?? [];
    fetched = opportunities.length;

    for (const raw of opportunities) {
      const normalized = normalize(raw, sourceName);
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

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function formatDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
