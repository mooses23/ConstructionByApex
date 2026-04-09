import { Router } from "express";
import { eq, desc, asc, and, gte, lte, sql } from "drizzle-orm";
import {
  db,
  opportunitiesTable,
  opportunitySourcesTable,
  opportunitySyncRunsTable,
  opportunityRulesTable,
  opportunityEventsTable,
} from "@workspace/db";
import { dispatchSync } from "../lib/opportunities/dispatch.js";
import { createManualOpportunity } from "../lib/opportunities/connectors/manual.js";
import { ingestEmail } from "../lib/opportunities/connectors/email.js";
import { addEvent } from "../lib/opportunities/core.js";

const router = Router();

// ─── helpers ──────────────────────────────────────────────────────────────────

function parseOpp(o: typeof opportunitiesTable.$inferSelect) {
  return {
    ...o,
    score: Number(o.score),
    budgetMin: o.budgetMin != null ? Number(o.budgetMin) : null,
    budgetMax: o.budgetMax != null ? Number(o.budgetMax) : null,
    estimatedValue: o.estimatedValue != null ? Number(o.estimatedValue) : null,
    postedAt: o.postedAt?.toISOString() ?? null,
    dueAt: o.dueAt?.toISOString() ?? null,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

function parseSource(s: typeof opportunitySourcesTable.$inferSelect) {
  return {
    ...s,
    lastSyncAt: s.lastSyncAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

function parseRule(r: typeof opportunityRulesTable.$inferSelect) {
  return {
    ...r,
    minBudget: r.minBudget != null ? Number(r.minBudget) : null,
    maxBudget: r.maxBudget != null ? Number(r.maxBudget) : null,
    minScore: r.minScore != null ? Number(r.minScore) : null,
    urgencyWeight: Number(r.urgencyWeight),
    recencyWeight: Number(r.recencyWeight),
    budgetWeight: Number(r.budgetWeight),
    keywordWeight: Number(r.keywordWeight),
    createdAt: r.createdAt.toISOString(),
  };
}

function parseSyncRun(r: typeof opportunitySyncRunsTable.$inferSelect) {
  return {
    ...r,
    startedAt: r.startedAt.toISOString(),
    finishedAt: r.finishedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

function parseEvent(e: typeof opportunityEventsTable.$inferSelect) {
  return { ...e, createdAt: e.createdAt.toISOString() };
}

// ─── OPPORTUNITIES (collection) ───────────────────────────────────────────────

// GET /api/opportunities
router.get("/opportunities", async (req, res): Promise<void> => {
  const {
    status,
    tradeType,
    state,
    minScore,
    priority,
    sort = "score",
    limit = "50",
    offset = "0",
  } = req.query as Record<string, string>;

  const conditions = [];
  if (status) conditions.push(eq(opportunitiesTable.status, status));
  if (tradeType) conditions.push(eq(opportunitiesTable.tradeType, tradeType));
  if (state) conditions.push(eq(opportunitiesTable.state, state));
  if (priority) conditions.push(eq(opportunitiesTable.priorityLevel, priority));
  if (minScore) {
    conditions.push(gte(opportunitiesTable.score, minScore));
  }

  const orderBy =
    sort === "newest"
      ? desc(opportunitiesTable.postedAt)
      : sort === "deadline"
      ? asc(opportunitiesTable.dueAt)
      : desc(opportunitiesTable.score);

  const [opps, [countRow]] = await Promise.all([
    db
      .select()
      .from(opportunitiesTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(orderBy)
      .limit(Number(limit))
      .offset(Number(offset)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(opportunitiesTable)
      .where(conditions.length ? and(...conditions) : undefined),
  ]);

  res.json({ opportunities: opps.map(parseOpp), total: countRow.count });
});

// POST /api/opportunities  (manual creation)
router.post("/opportunities", async (req, res): Promise<void> => {
  const {
    title,
    description,
    tradeType,
    category,
    city,
    state,
    budgetMin,
    budgetMax,
    dueAt,
    sourceUrl,
  } = req.body;

  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  await createManualOpportunity(undefined, "Manual Entry", {
    title,
    description,
    tradeType,
    category,
    city,
    state,
    budgetMin: budgetMin != null ? Number(budgetMin) : undefined,
    budgetMax: budgetMax != null ? Number(budgetMax) : undefined,
    dueAt: dueAt ? new Date(dueAt) : undefined,
    sourceUrl,
    ingestionType: "manual",
  });

  const [opp] = await db
    .select()
    .from(opportunitiesTable)
    .orderBy(desc(opportunitiesTable.createdAt))
    .limit(1);

  res.status(201).json(parseOpp(opp));
});

// ─── SOURCES (must be before /:id) ───────────────────────────────────────────

// GET /api/opportunities/sources
router.get("/opportunities/sources", async (_req, res): Promise<void> => {
  const sources = await db
    .select()
    .from(opportunitySourcesTable)
    .orderBy(asc(opportunitySourcesTable.name));

  res.json({ sources: sources.map(parseSource) });
});

// POST /api/opportunities/sources
router.post("/opportunities/sources", async (req, res): Promise<void> => {
  const { key, name, ingestionType, enabled, configJson, pollIntervalMinutes } = req.body;
  if (!key || !name || !ingestionType) {
    res.status(400).json({ error: "key, name, and ingestionType are required" });
    return;
  }

  const [source] = await db
    .insert(opportunitySourcesTable)
    .values({ key, name, ingestionType, enabled: enabled ?? true, configJson, pollIntervalMinutes })
    .returning();

  res.status(201).json(parseSource(source));
});

// GET /api/opportunities/sources/:id
router.get("/opportunities/sources/:id", async (req, res): Promise<void> => {
  const [source] = await db
    .select()
    .from(opportunitySourcesTable)
    .where(eq(opportunitySourcesTable.id, req.params.id));

  if (!source) {
    res.status(404).json({ error: "Source not found" });
    return;
  }

  res.json(parseSource(source));
});

// PATCH /api/opportunities/sources/:id
router.patch("/opportunities/sources/:id", async (req, res): Promise<void> => {
  const { name, enabled, configJson, pollIntervalMinutes } = req.body;

  const [source] = await db
    .update(opportunitySourcesTable)
    .set({ name, enabled, configJson, pollIntervalMinutes })
    .where(eq(opportunitySourcesTable.id, req.params.id))
    .returning();

  if (!source) {
    res.status(404).json({ error: "Source not found" });
    return;
  }

  res.json(parseSource(source));
});

// DELETE /api/opportunities/sources/:id
router.delete("/opportunities/sources/:id", async (req, res): Promise<void> => {
  const [source] = await db
    .delete(opportunitySourcesTable)
    .where(eq(opportunitySourcesTable.id, req.params.id))
    .returning({ id: opportunitySourcesTable.id });

  if (!source) {
    res.status(404).json({ error: "Source not found" });
    return;
  }

  res.status(204).send();
});

// POST /api/opportunities/sources/:id/sync
router.post("/opportunities/sources/:id/sync", async (req, res): Promise<void> => {
  const [source] = await db
    .select()
    .from(opportunitySourcesTable)
    .where(eq(opportunitySourcesTable.id, req.params.id));

  if (!source) {
    res.status(404).json({ error: "Source not found" });
    return;
  }

  if (!source.enabled) {
    res.status(400).json({ error: "Source is disabled" });
    return;
  }

  const result = await dispatchSync(source);
  res.json(result);
});

// ─── RULES (must be before /:id) ─────────────────────────────────────────────

// GET /api/opportunities/rules
router.get("/opportunities/rules", async (_req, res): Promise<void> => {
  const rules = await db
    .select()
    .from(opportunityRulesTable)
    .orderBy(asc(opportunityRulesTable.name));

  res.json({ rules: rules.map(parseRule) });
});

// POST /api/opportunities/rules
router.post("/opportunities/rules", async (req, res): Promise<void> => {
  const {
    name,
    enabled,
    includeKeywords,
    excludeKeywords,
    states,
    tradeTypes,
    minBudget,
    maxBudget,
    minScore,
    urgencyWeight,
    recencyWeight,
    budgetWeight,
    keywordWeight,
  } = req.body;

  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const [rule] = await db
    .insert(opportunityRulesTable)
    .values({
      name,
      enabled: enabled ?? true,
      includeKeywords: includeKeywords ?? [],
      excludeKeywords: excludeKeywords ?? [],
      states: states ?? [],
      tradeTypes: tradeTypes ?? [],
      minBudget: minBudget != null ? String(minBudget) : null,
      maxBudget: maxBudget != null ? String(maxBudget) : null,
      minScore: minScore != null ? String(minScore) : null,
      urgencyWeight: String(urgencyWeight ?? 1),
      recencyWeight: String(recencyWeight ?? 1),
      budgetWeight: String(budgetWeight ?? 1),
      keywordWeight: String(keywordWeight ?? 1),
    })
    .returning();

  res.status(201).json(parseRule(rule));
});

// GET /api/opportunities/rules/:id
router.get("/opportunities/rules/:id", async (req, res): Promise<void> => {
  const [rule] = await db
    .select()
    .from(opportunityRulesTable)
    .where(eq(opportunityRulesTable.id, req.params.id));

  if (!rule) {
    res.status(404).json({ error: "Rule not found" });
    return;
  }

  res.json(parseRule(rule));
});

// PATCH /api/opportunities/rules/:id
router.patch("/opportunities/rules/:id", async (req, res): Promise<void> => {
  const {
    name,
    enabled,
    includeKeywords,
    excludeKeywords,
    states,
    tradeTypes,
    minBudget,
    maxBudget,
    minScore,
    urgencyWeight,
    recencyWeight,
    budgetWeight,
    keywordWeight,
  } = req.body;

  const updateData: Partial<typeof opportunityRulesTable.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (enabled !== undefined) updateData.enabled = enabled;
  if (includeKeywords !== undefined) updateData.includeKeywords = includeKeywords;
  if (excludeKeywords !== undefined) updateData.excludeKeywords = excludeKeywords;
  if (states !== undefined) updateData.states = states;
  if (tradeTypes !== undefined) updateData.tradeTypes = tradeTypes;
  if (minBudget !== undefined) updateData.minBudget = minBudget != null ? String(minBudget) : null;
  if (maxBudget !== undefined) updateData.maxBudget = maxBudget != null ? String(maxBudget) : null;
  if (minScore !== undefined) updateData.minScore = minScore != null ? String(minScore) : null;
  if (urgencyWeight !== undefined) updateData.urgencyWeight = String(urgencyWeight);
  if (recencyWeight !== undefined) updateData.recencyWeight = String(recencyWeight);
  if (budgetWeight !== undefined) updateData.budgetWeight = String(budgetWeight);
  if (keywordWeight !== undefined) updateData.keywordWeight = String(keywordWeight);

  const [rule] = await db
    .update(opportunityRulesTable)
    .set(updateData)
    .where(eq(opportunityRulesTable.id, req.params.id))
    .returning();

  if (!rule) {
    res.status(404).json({ error: "Rule not found" });
    return;
  }

  res.json(parseRule(rule));
});

// DELETE /api/opportunities/rules/:id
router.delete("/opportunities/rules/:id", async (req, res): Promise<void> => {
  const [rule] = await db
    .delete(opportunityRulesTable)
    .where(eq(opportunityRulesTable.id, req.params.id))
    .returning({ id: opportunityRulesTable.id });

  if (!rule) {
    res.status(404).json({ error: "Rule not found" });
    return;
  }

  res.status(204).send();
});

// ─── SYNC LOG (must be before /:id) ──────────────────────────────────────────

// GET /api/opportunities/sync-log
router.get("/opportunities/sync-log", async (req, res): Promise<void> => {
  const { limit = "50", offset = "0" } = req.query as Record<string, string>;

  const [runs, [countRow]] = await Promise.all([
    db
      .select({
        run: opportunitySyncRunsTable,
        sourceName: opportunitySourcesTable.name,
        sourceKey: opportunitySourcesTable.key,
      })
      .from(opportunitySyncRunsTable)
      .leftJoin(
        opportunitySourcesTable,
        eq(opportunitySyncRunsTable.sourceId, opportunitySourcesTable.id)
      )
      .orderBy(desc(opportunitySyncRunsTable.startedAt))
      .limit(Number(limit))
      .offset(Number(offset)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(opportunitySyncRunsTable),
  ]);

  res.json({
    runs: runs.map(({ run, sourceName, sourceKey }) => ({
      ...parseSyncRun(run),
      sourceName: sourceName ?? sourceKey ?? "Unknown",
    })),
    total: countRow.count,
  });
});

// ─── EMAIL INGEST (must be before /:id) ──────────────────────────────────────

// POST /api/opportunities/email-ingest
router.post("/opportunities/email-ingest", async (req, res): Promise<void> => {
  const { from, subject, textBody, htmlBody, links, attachmentNames, receivedAt } = req.body;

  if (!subject && !textBody) {
    res.status(400).json({ error: "subject or textBody is required" });
    return;
  }

  const { inserted, updated } = await ingestEmail(undefined, {
    from,
    subject,
    textBody,
    htmlBody,
    links,
    attachmentNames,
    rawProviderPayload: req.body,
    receivedAt,
  }, "Email Ingest");

  res.status(201).json({ inserted, updated });
});

// ─── OPPORTUNITIES (single item — keep last) ──────────────────────────────────

// GET /api/opportunities/:id
router.get("/opportunities/:id", async (req, res): Promise<void> => {
  const [opp] = await db
    .select()
    .from(opportunitiesTable)
    .where(eq(opportunitiesTable.id, req.params.id));

  if (!opp) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }

  const events = await db
    .select()
    .from(opportunityEventsTable)
    .where(eq(opportunityEventsTable.opportunityId, opp.id))
    .orderBy(desc(opportunityEventsTable.createdAt));

  res.json({ ...parseOpp(opp), events: events.map(parseEvent) });
});

// PATCH /api/opportunities/:id
router.patch("/opportunities/:id", async (req, res): Promise<void> => {
  const { status, reviewed, convertedToLead, priorityLevel } = req.body;

  const updateData: Partial<typeof opportunitiesTable.$inferInsert> = {};
  if (status !== undefined) updateData.status = status;
  if (reviewed !== undefined) updateData.reviewed = reviewed;
  if (convertedToLead !== undefined) updateData.convertedToLead = convertedToLead;
  if (priorityLevel !== undefined) updateData.priorityLevel = priorityLevel;
  updateData.updatedAt = new Date();

  const [opp] = await db
    .update(opportunitiesTable)
    .set(updateData)
    .where(eq(opportunitiesTable.id, req.params.id))
    .returning();

  if (!opp) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }

  if (status) {
    await addEvent(opp.id, "status_changed", `Status changed to ${status}`);
  }

  res.json(parseOpp(opp));
});

// DELETE /api/opportunities/:id
router.delete("/opportunities/:id", async (req, res): Promise<void> => {
  const [opp] = await db
    .delete(opportunitiesTable)
    .where(eq(opportunitiesTable.id, req.params.id))
    .returning({ id: opportunitiesTable.id });

  if (!opp) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }

  res.status(204).send();
});

// POST /api/opportunities/:id/events
router.post("/opportunities/:id/events", async (req, res): Promise<void> => {
  const { eventType, eventNote } = req.body;
  if (!eventType) {
    res.status(400).json({ error: "eventType is required" });
    return;
  }

  const [opp] = await db
    .select({ id: opportunitiesTable.id })
    .from(opportunitiesTable)
    .where(eq(opportunitiesTable.id, req.params.id));

  if (!opp) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }

  const [event] = await db
    .insert(opportunityEventsTable)
    .values({ opportunityId: opp.id, eventType, eventNote })
    .returning();

  res.status(201).json(parseEvent(event));
});

// GET /api/opportunities/:id/events
router.get("/opportunities/:id/events", async (req, res): Promise<void> => {
  const events = await db
    .select()
    .from(opportunityEventsTable)
    .where(eq(opportunityEventsTable.opportunityId, req.params.id))
    .orderBy(desc(opportunityEventsTable.createdAt));

  res.json({ events: events.map(parseEvent) });
});

export default router;
