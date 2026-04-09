import { NormalizedOpportunity } from "../types.js";
import { saveOpportunity } from "../core.js";

export async function createManualOpportunity(
  sourceId: string | undefined,
  sourceName: string,
  payload: NormalizedOpportunity
): Promise<{ inserted: boolean; updated: boolean }> {
  const normalized: NormalizedOpportunity = {
    ...payload,
    sourceName: payload.sourceName ?? sourceName,
    ingestionType: "manual",
    externalId: payload.externalId ?? `manual-${Date.now()}`,
  };

  return saveOpportunity(sourceId, normalized);
}
