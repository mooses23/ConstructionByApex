import { eq, and } from "drizzle-orm";
import {
  db,
  opportunitiesTable,
  opportunitySourcesTable,
  opportunitySyncRunsTable,
  opportunityRulesTable,
  opportunityEventsTable,
  type InsertOpportunity,
} from "@workspace/db";
import { NormalizedOpportunity, SyncRunResult } from "./types.js";
import { scoreOpportunity, defaultScoringContext } from "./scoring.js";

function buildScoringContextFromRules(
  rules: (typeof opportunityRulesTable.$inferSelect)[]
) {
  const active = rules.filter((r) => r.enabled);
  if (active.length === 0) return defaultScoringContext();

  // merge all active rules
  const r = active[0];
  return {
    includeKeywords: active.flatMap((r) => r.includeKeywords ?? []),
    excludeKeywords: active.flatMap((r) => r.excludeKeywords ?? []),
    states: active.flatMap((r) => r.states ?? []),
    tradeTypes: active.flatMap((r) => r.tradeTypes ?? []),
    minBudget: r.minBudget ? Number(r.minBudget) : undefined,
    urgencyWeight: Number(r.urgencyWeight ?? 1),
    recencyWeight: Number(r.recencyWeight ?? 1),
    budgetWeight: Number(r.budgetWeight ?? 1),
    keywordWeight: Number(r.keywordWeight ?? 1),
  };
}

export async function saveOpportunity(
  sourceId: string | undefined,
  normalized: NormalizedOpportunity
): Promise<{ inserted: boolean; updated: boolean }> {
  // Load active rules for scoring
  const rules = await db.select().from(opportunityRulesTable);
  const ctx = buildScoringContextFromRules(rules);
  const { score, priorityLevel, reasons } = scoreOpportunity(normalized, ctx);

  // Dedupe by source_id + external_id
  if (sourceId && normalized.externalId) {
    const existing = await db
      .select({ id: opportunitiesTable.id })
      .from(opportunitiesTable)
      .where(
        and(
          eq(opportunitiesTable.sourceId, sourceId),
          eq(opportunitiesTable.externalId, normalized.externalId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(opportunitiesTable)
        .set({
          title: normalized.title,
          description: normalized.description,
          score: String(score),
          priorityLevel,
          scoreReasonsJson: reasons as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(opportunitiesTable.id, existing[0].id));
      return { inserted: false, updated: true };
    }
  }

  const values: InsertOpportunity = {
    sourceId: sourceId ?? null,
    externalId: normalized.externalId,
    title: normalized.title,
    description: normalized.description,
    category: normalized.category,
    tradeType: normalized.tradeType,
    city: normalized.city,
    state: normalized.state,
    budgetMin: normalized.budgetMin != null ? String(normalized.budgetMin) : null,
    budgetMax: normalized.budgetMax != null ? String(normalized.budgetMax) : null,
    postedAt: normalized.postedAt ?? null,
    dueAt: normalized.dueAt ?? null,
    sourceUrl: normalized.sourceUrl,
    sourceName: normalized.sourceName,
    ingestionType: normalized.ingestionType,
    score: String(score),
    priorityLevel,
    scoreReasonsJson: reasons as Record<string, unknown>,
    rawPayloadJson: normalized.rawPayload as Record<string, unknown>,
    status: "new",
    reviewed: false,
    convertedToLead: false,
  };

  await db.insert(opportunitiesTable).values(values);
  return { inserted: true, updated: false };
}

export async function recordSyncRun(
  sourceId: string,
  result: SyncRunResult,
  startedAt: Date
): Promise<void> {
  const finishedAt = new Date();

  await db.insert(opportunitySyncRunsTable).values({
    sourceId,
    startedAt,
    finishedAt,
    status: result.error ? "error" : "success",
    itemsFetched: result.itemsFetched,
    itemsInserted: result.itemsInserted,
    itemsUpdated: result.itemsUpdated,
    errorText: result.error ?? null,
  });

  await db
    .update(opportunitySourcesTable)
    .set({
      lastSyncAt: finishedAt,
      lastError: result.error ?? null,
    })
    .where(eq(opportunitySourcesTable.id, sourceId));
}

export async function addEvent(
  opportunityId: string,
  eventType: string,
  eventNote?: string
): Promise<void> {
  await db.insert(opportunityEventsTable).values({
    opportunityId,
    eventType,
    eventNote: eventNote ?? null,
  });
}
