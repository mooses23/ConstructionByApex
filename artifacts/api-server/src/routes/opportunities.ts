import { Router } from "express";
import {
  db,
  opportunitiesTable,
  opportunitySourcesTable,
  opportunitySyncRunsTable,
  opportunityRulesTable,
  opportunityEventsTable,
} from "@workspace/db";
import { eq, desc, and, gte, count } from "drizzle-orm";
import { saveOpportunity, recordSyncRun } from "../lib/opportunities/core";
import { fetchSAMGov } from "../lib/opportunities/connectors/samgov";
import { fetchRSSFeed } from "../lib/opportunities/connectors/rss";
import { fetchGooglePSE } from "../lib/opportunities/connectors/google-pse";
import { ingestEmail } from "../lib/opportunities/connectors/manual";
import type { EmailPayload } from "../lib/opportunities/connectors/manual";
import { z } from "zod";

const router = Router();

const ListOpportunitiesQuery = z.object({
  status: z.string().optional(),
  trade_type: z.string().optional(),
  state: z.string().optional(),
  min_score: z.coerce.number().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  sort: z.enum(["score", "newest", "deadline"]).optional().default("score"),
  limit: z.coerce.number().default(50),
  offset: z.coerce.number().default(0),
});

function parseOpportunity(opp: typeof opportunitiesTable.$inferSelect) {
  return {
    ...opp,
    budgetMin: opp.budgetMin ? Number(opp.budgetMin) : null,
    budgetMax: opp.budgetMax ? Number(opp.budgetMax) : null,
    createdAt: opp.createdAt.toISOString(),
    updatedAt: opp.updatedAt.toISOString(),
    postedAt: opp.postedAt?.toISOString() ?? null,
    deadlineAt: opp.deadlineAt?.toISOString() ?? null,
  };
}

function parseSource(source: typeof opportunitySourcesTable.$inferSelect) {
  return {
    ...source,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
    lastSyncAt: source.lastSyncAt?.toISOString() ?? null,
  };
}

function parseRule(rule: typeof opportunityRulesTable.$inferSelect) {
  return {
    ...rule,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}

router.get("/opportunities", async (req, res): Promise<void> => {
  const parsed = ListOpportunitiesQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, trade_type, state, min_score, priority, sort, limit, offset } = parsed.data;

  const conditions = [];
  if (status) conditions.push(eq(opportunitiesTable.status, status));
  if (trade_type) conditions.push(eq(opportunitiesTable.tradeType, trade_type));
  if (state) conditions.push(eq(opportunitiesTable.state, state));
  if (min_score !== undefined) conditions.push(gte(opportunitiesTable.score, min_score));
  if (priority) conditions.push(eq(opportunitiesTable.priorityLevel, priority));

  const where = conditions.length ? and(...conditions) : undefined;

  let orderBy;
  if (sort === "newest") {
    orderBy = desc(opportunitiesTable.createdAt);
  } else if (sort === "deadline") {
    orderBy = opportunitiesTable.deadlineAt;
  } else {
    orderBy = desc(opportunitiesTable.score);
  }

  const [opps, [countResult]] = await Promise.all([
    db.select().from(opportunitiesTable).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ count: count() }).from(opportunitiesTable).where(where),
  ]);

  res.json({ opportunities: opps.map(parseOpportunity), total: Number(countResult.count) });
});

router.post("/opportunities", async (req, res): Promise<void> => {
  const CreateOpportunityBody = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    tradeType: z.string().optional(),
    budgetMin: z.number().optional(),
    budgetMax: z.number().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    sourceUrl: z.string().optional(),
    postedAt: z.string().optional(),
    deadlineAt: z.string().optional(),
    notes: z.string().optional(),
    sourceId: z.number().optional(),
  });
  const parsed = CreateOpportunityBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { id, inserted } = await saveOpportunity({
    ...parsed.data,
    postedAt: parsed.data.postedAt ? new Date(parsed.data.postedAt) : undefined,
    deadlineAt: parsed.data.deadlineAt ? new Date(parsed.data.deadlineAt) : undefined,
    rawPayloadJson: parsed.data as unknown as Record<string, unknown>,
    ingestMethod: "manual",
  });

  const [opp] = await db.select().from(opportunitiesTable).where(eq(opportunitiesTable.id, id));
  res.status(inserted ? 201 : 200).json(parseOpportunity(opp));
});

router.get("/opportunities/sync-log", async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "50")), 200);
  const offset = parseInt(String(req.query.offset ?? "0")) || 0;

  const [runs, [countResult]] = await Promise.all([
    db.select().from(opportunitySyncRunsTable).orderBy(desc(opportunitySyncRunsTable.startedAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(opportunitySyncRunsTable),
  ]);

  res.json({
    runs: runs.map((r) => ({
      ...r,
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    })),
    total: Number(countResult.count),
  });
});

router.post("/opportunities/email-ingest", async (req, res): Promise<void> => {
  const EmailIngestBody = z.object({
    from: z.string().optional(),
    subject: z.string().optional(),
    body: z.string().optional(),
    attachments: z.array(z.object({
      filename: z.string(),
      size: z.number().optional(),
      mimeType: z.string().optional(),
    })).optional(),
    urls: z.array(z.string()).optional(),
    receivedAt: z.string().optional(),
    sourceId: z.number().optional(),
  });

  const parsed = EmailIngestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { sourceId, ...email } = parsed.data;
  const result = await ingestEmail(email as EmailPayload, sourceId);

  const [opp] = await db.select().from(opportunitiesTable).where(eq(opportunitiesTable.id, result.id));
  res.status(result.inserted ? 201 : 200).json(parseOpportunity(opp));
});

router.get("/opportunities/sources", async (_req, res): Promise<void> => {
  const sources = await db.select().from(opportunitySourcesTable).orderBy(desc(opportunitySourcesTable.createdAt));
  res.json({ sources: sources.map(parseSource) });
});

const CreateSourceBody = z.object({
  name: z.string().min(1),
  sourceType: z.enum(["samgov", "rss", "google_pse", "manual", "email"]),
  config: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

router.post("/opportunities/sources", async (req, res): Promise<void> => {
  const parsed = CreateSourceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [source] = await db
    .insert(opportunitySourcesTable)
    .values({ name: parsed.data.name, sourceType: parsed.data.sourceType, config: parsed.data.config ?? {}, isActive: parsed.data.isActive ?? true })
    .returning();

  res.status(201).json(parseSource(source));
});

router.get("/opportunities/sources/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [source] = await db.select().from(opportunitySourcesTable).where(eq(opportunitySourcesTable.id, id));
  if (!source) { res.status(404).json({ error: "Source not found" }); return; }
  res.json(parseSource(source));
});

const PatchSourceBody = z.object({
  name: z.string().min(1).optional(),
  sourceType: z.enum(["samgov", "rss", "google_pse", "manual", "email"]).optional(),
  config: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

router.patch("/opportunities/sources/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = PatchSourceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [source] = await db
    .update(opportunitySourcesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(opportunitySourcesTable.id, id))
    .returning();

  if (!source) { res.status(404).json({ error: "Source not found" }); return; }
  res.json(parseSource(source));
});

router.delete("/opportunities/sources/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [deleted] = await db.delete(opportunitySourcesTable).where(eq(opportunitySourcesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Source not found" }); return; }
  res.status(204).send();
});

router.post("/opportunities/sources/:id/sync", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [source] = await db.select().from(opportunitySourcesTable).where(eq(opportunitySourcesTable.id, id));
  if (!source) { res.status(404).json({ error: "Source not found" }); return; }

  const config = (source.config as Record<string, unknown>) ?? {};
  let fetched: import("../lib/opportunities/types").NormalizedOpportunity[] = [];
  let errorMessage: string | undefined;

  try {
    switch (source.sourceType) {
      case "samgov":
        fetched = await fetchSAMGov(id, config as Parameters<typeof fetchSAMGov>[1]);
        break;
      case "rss":
        fetched = await fetchRSSFeed(id, String(config.feedUrl ?? ""), { tradeType: String(config.tradeType ?? ""), state: String(config.state ?? "") });
        break;
      case "google_pse":
        fetched = await fetchGooglePSE(id, config as Parameters<typeof fetchGooglePSE>[1]);
        break;
      default:
        res.status(400).json({ error: `Connector type '${source.sourceType}' does not support automated sync` });
        return;
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  let inserted = 0;
  let skipped = 0;

  if (!errorMessage) {
    for (const opp of fetched) {
      const result = await saveOpportunity(opp);
      if (result.inserted) inserted++;
      else skipped++;
    }
  }

  await recordSyncRun(id, {
    recordsFetched: fetched.length,
    recordsInserted: inserted,
    recordsSkipped: skipped,
    errorMessage,
  });

  await db.update(opportunitySourcesTable).set({ lastSyncAt: new Date() }).where(eq(opportunitySourcesTable.id, id));

  res.json({
    sourceId: id,
    recordsFetched: fetched.length,
    recordsInserted: inserted,
    recordsSkipped: skipped,
    errorMessage: errorMessage ?? null,
  });
});

router.get("/opportunities/rules", async (_req, res): Promise<void> => {
  const rules = await db.select().from(opportunityRulesTable).orderBy(desc(opportunityRulesTable.createdAt));
  res.json({ rules: rules.map(parseRule) });
});

const RuleMetadataSchema = z.object({
  excludeKeywords: z.array(z.string()).optional(),
  maxBudget: z.number().nullable().optional(),
  minScore: z.number().nullable().optional(),
  weightUrgency: z.number().min(0).max(5).optional(),
  weightRecency: z.number().min(0).max(5).optional(),
  weightBudget: z.number().min(0).max(5).optional(),
  weightKeyword: z.number().min(0).max(5).optional(),
});

const CreateRuleBody = z.object({
  name: z.string().min(1),
  isActive: z.boolean().optional(),
  keywords: z.array(z.string()).optional(),
  tradeTypes: z.array(z.string()).optional(),
  targetStates: z.array(z.string()).optional(),
  minBudget: z.number().optional(),
  metadata: RuleMetadataSchema.optional(),
});

router.post("/opportunities/rules", async (req, res): Promise<void> => {
  const parsed = CreateRuleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [rule] = await db
    .insert(opportunityRulesTable)
    .values({
      name: parsed.data.name,
      isActive: parsed.data.isActive ?? true,
      keywords: parsed.data.keywords ?? [],
      tradeTypes: parsed.data.tradeTypes ?? [],
      targetStates: parsed.data.targetStates ?? [],
      minBudget: parsed.data.minBudget?.toString(),
      metadata: parsed.data.metadata ?? {},
    })
    .returning();

  res.status(201).json(parseRule(rule));
});

router.get("/opportunities/rules/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [rule] = await db.select().from(opportunityRulesTable).where(eq(opportunityRulesTable.id, id));
  if (!rule) { res.status(404).json({ error: "Rule not found" }); return; }
  res.json(parseRule(rule));
});

const PatchRuleBody = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  keywords: z.array(z.string()).optional(),
  tradeTypes: z.array(z.string()).optional(),
  targetStates: z.array(z.string()).optional(),
  minBudget: z.number().nullable().optional(),
  metadata: RuleMetadataSchema.optional(),
});

router.patch("/opportunities/rules/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = PatchRuleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;
  if (parsed.data.keywords !== undefined) updates.keywords = parsed.data.keywords;
  if (parsed.data.tradeTypes !== undefined) updates.tradeTypes = parsed.data.tradeTypes;
  if (parsed.data.targetStates !== undefined) updates.targetStates = parsed.data.targetStates;
  if (parsed.data.minBudget !== undefined) updates.minBudget = parsed.data.minBudget?.toString() ?? null;
  if (parsed.data.metadata !== undefined) updates.metadata = parsed.data.metadata;

  const [rule] = await db
    .update(opportunityRulesTable)
    .set(updates)
    .where(eq(opportunityRulesTable.id, id))
    .returning();

  if (!rule) { res.status(404).json({ error: "Rule not found" }); return; }
  res.json(parseRule(rule));
});

router.delete("/opportunities/rules/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [deleted] = await db.delete(opportunityRulesTable).where(eq(opportunityRulesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Rule not found" }); return; }
  res.status(204).send();
});

router.get("/opportunities/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [opp] = await db.select().from(opportunitiesTable).where(eq(opportunitiesTable.id, id));
  if (!opp) { res.status(404).json({ error: "Opportunity not found" }); return; }

  const events = await db
    .select()
    .from(opportunityEventsTable)
    .where(eq(opportunityEventsTable.opportunityId, id))
    .orderBy(desc(opportunityEventsTable.createdAt));

  res.json({
    ...parseOpportunity(opp),
    events: events.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
  });
});

const PatchOpportunityBody = z.object({
  status: z.string().optional(),
  notes: z.string().optional(),
  tradeType: z.string().optional(),
  priorityLevel: z.enum(["high", "medium", "low"]).optional(),
});

router.patch("/opportunities/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = PatchOpportunityBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [opp] = await db
    .update(opportunitiesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(opportunitiesTable.id, id))
    .returning();

  if (!opp) { res.status(404).json({ error: "Opportunity not found" }); return; }
  res.json(parseOpportunity(opp));
});

router.delete("/opportunities/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(opportunityEventsTable).where(eq(opportunityEventsTable.opportunityId, id));
  const [deleted] = await db.delete(opportunitiesTable).where(eq(opportunitiesTable.id, id)).returning();

  if (!deleted) { res.status(404).json({ error: "Opportunity not found" }); return; }
  res.status(204).send();
});

router.get("/opportunities/:id/events", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const events = await db
    .select()
    .from(opportunityEventsTable)
    .where(eq(opportunityEventsTable.opportunityId, id))
    .orderBy(desc(opportunityEventsTable.createdAt));

  res.json({ events: events.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })) });
});

const CreateEventBody = z.object({
  eventType: z.string().min(1),
  note: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

router.post("/opportunities/:id/events", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [opp] = await db.select({ id: opportunitiesTable.id }).from(opportunitiesTable).where(eq(opportunitiesTable.id, id));
  if (!opp) { res.status(404).json({ error: "Opportunity not found" }); return; }

  const [event] = await db
    .insert(opportunityEventsTable)
    .values({ opportunityId: id, eventType: parsed.data.eventType, note: parsed.data.note, metadata: parsed.data.metadata ?? {} })
    .returning();

  res.status(201).json({ ...event, createdAt: event.createdAt.toISOString() });
});

export default router;
