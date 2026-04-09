import { db, opportunitiesTable, opportunitySyncRunsTable, opportunityRulesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import type { NormalizedOpportunity, SyncRunResult } from "./types";
import { scoreOpportunity } from "./scoring";

function titleSimilarity(a: string, b: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const wordsA = new Set(normalize(a).split(/\s+/).filter(Boolean));
  const wordsB = new Set(normalize(b).split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

export async function normalizeOpportunity(raw: NormalizedOpportunity): Promise<NormalizedOpportunity> {
  return raw;
}

export async function saveOpportunity(opp: NormalizedOpportunity): Promise<{ inserted: boolean; id: number }> {
  const rules = await db.select().from(opportunityRulesTable).where(eq(opportunityRulesTable.isActive, true));

  const scored = scoreOpportunity(opp, { rules });

  if (opp.sourceId && opp.externalId) {
    const existing = await db
      .select()
      .from(opportunitiesTable)
      .where(
        and(
          eq(opportunitiesTable.sourceId, opp.sourceId),
          eq(opportunitiesTable.externalId, opp.externalId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(opportunitiesTable)
        .set({
          title: opp.title,
          description: opp.description,
          score: scored.score,
          priorityLevel: scored.priorityLevel,
          scoreReasonsJson: scored.scoreReasons,
          rawPayloadJson: opp.rawPayloadJson,
          updatedAt: new Date(),
        })
        .where(eq(opportunitiesTable.id, existing[0].id))
        .returning();
      return { inserted: false, id: updated.id };
    }
  }

  const recentOpps = await db
    .select({ id: opportunitiesTable.id, title: opportunitiesTable.title })
    .from(opportunitiesTable)
    .limit(500);

  const SIMILARITY_THRESHOLD = 0.8;
  const duplicate = recentOpps.find(
    (r) => titleSimilarity(r.title, opp.title) >= SIMILARITY_THRESHOLD
  );

  if (duplicate) {
    return { inserted: false, id: duplicate.id };
  }

  const [inserted] = await db
    .insert(opportunitiesTable)
    .values({
      sourceId: opp.sourceId,
      externalId: opp.externalId,
      title: opp.title,
      description: opp.description,
      tradeType: opp.tradeType,
      status: opp.status ?? "new",
      priorityLevel: scored.priorityLevel,
      score: scored.score,
      scoreReasonsJson: scored.scoreReasons,
      budgetMin: opp.budgetMin?.toString(),
      budgetMax: opp.budgetMax?.toString(),
      state: opp.state,
      city: opp.city,
      contactName: opp.contactName,
      contactEmail: opp.contactEmail,
      contactPhone: opp.contactPhone,
      sourceUrl: opp.sourceUrl,
      postedAt: opp.postedAt,
      deadlineAt: opp.deadlineAt,
      rawPayloadJson: opp.rawPayloadJson,
      ingestMethod: opp.ingestMethod,
      notes: opp.notes,
    })
    .returning();

  return { inserted: true, id: inserted.id };
}

export async function recordSyncRun(
  sourceId: number | null,
  result: SyncRunResult & { startedAt?: Date }
): Promise<void> {
  await db.insert(opportunitySyncRunsTable).values({
    sourceId: sourceId ?? undefined,
    status: result.errorMessage ? "error" : "completed",
    recordsFetched: result.recordsFetched,
    recordsInserted: result.recordsInserted,
    recordsSkipped: result.recordsSkipped,
    errorMessage: result.errorMessage,
    completedAt: new Date(),
  });
}
