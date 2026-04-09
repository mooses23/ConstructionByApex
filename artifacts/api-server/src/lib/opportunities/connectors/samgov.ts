import type { NormalizedOpportunity, OpportunityConnector } from "../types";

interface SAMGovParams {
  keyword?: string;
  state?: string;
  limit?: number;
  apiKey?: string;
}

interface SAMGovNotice {
  noticeId: string;
  title: string;
  baseType?: string;
  naicsCode?: string;
  classificationCode?: string;
  organizationName?: string;
  fullParentPathName?: string;
  postedDate?: string;
  responseDeadLine?: string;
  description?: string;
  typeOfSetAsideDescription?: string;
  placeOfPerformance?: {
    city?: { name?: string };
    state?: { code?: string; name?: string };
  };
  uiLink?: string;
  award?: { amount?: number };
}

function inferTradeType(notice: SAMGovNotice): string | undefined {
  const text = `${notice.title ?? ""} ${notice.description ?? ""}`.toLowerCase();
  if (text.includes("roofing") || text.includes("roof")) return "roofing";
  if (text.includes("hvac") || text.includes("heating") || text.includes("ventilation") || text.includes("air condition")) return "hvac";
  if (text.includes("concrete") || text.includes("pavement") || text.includes("asphalt")) return "concrete";
  if (text.includes("painting") || text.includes("paint")) return "painting";
  if (text.includes("general contractor") || text.includes("construction")) return "general";
  return undefined;
}

function parseAmount(str: unknown): number | undefined {
  if (typeof str === "number") return str;
  if (typeof str === "string") {
    const n = parseFloat(str.replace(/[^0-9.]/g, ""));
    if (!isNaN(n)) return n;
  }
  return undefined;
}

export class SAMGovConnector implements OpportunityConnector {
  async fetch(params: Record<string, unknown>): Promise<NormalizedOpportunity[]> {
    const { keyword, state, limit = 50, apiKey } = params as SAMGovParams;

    const searchParams = new URLSearchParams({
      limit: String(Math.min(limit, 1000)),
      api_version: "1",
      postedFrom: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
      postedTo: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
    });

    if (keyword) searchParams.set("q", keyword);
    if (state) searchParams.set("state", state);
    if (apiKey) searchParams.set("api_key", apiKey);

    const url = `https://api.sam.gov/opportunities/v2/search?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`SAM.gov API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { opportunitiesData?: SAMGovNotice[] };
    const notices = data.opportunitiesData ?? [];

    return notices.map((notice): NormalizedOpportunity => ({
      externalId: notice.noticeId,
      title: notice.title,
      description: notice.description,
      tradeType: inferTradeType(notice),
      state: notice.placeOfPerformance?.state?.code,
      city: notice.placeOfPerformance?.city?.name,
      sourceUrl: notice.uiLink,
      postedAt: notice.postedDate ? new Date(notice.postedDate) : undefined,
      deadlineAt: notice.responseDeadLine ? new Date(notice.responseDeadLine) : undefined,
      budgetMax: parseAmount(notice.award?.amount),
      rawPayloadJson: notice as unknown as Record<string, unknown>,
      ingestMethod: "samgov",
    }));
  }
}

export async function fetchSAMGov(
  sourceId: number,
  params: SAMGovParams
): Promise<NormalizedOpportunity[]> {
  const connector = new SAMGovConnector();
  const results = await connector.fetch({ ...params });
  return results.map((r) => ({ ...r, sourceId }));
}
