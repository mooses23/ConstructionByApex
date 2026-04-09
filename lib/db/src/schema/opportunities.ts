import {
  pgTable,
  text,
  timestamp,
  boolean,
  numeric,
  jsonb,
  integer,
  uuid,
  index,
} from "drizzle-orm/pg-core";

// ─── opportunity_sources ──────────────────────────────────────────────────────
// Auth required; no public access.
export const opportunitySourcesTable = pgTable("opportunity_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  ingestionType: text("ingestion_type").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  configJson: jsonb("config_json"),
  pollIntervalMinutes: integer("poll_interval_minutes").default(60),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OpportunitySource = typeof opportunitySourcesTable.$inferSelect;
export type InsertOpportunitySource = typeof opportunitySourcesTable.$inferInsert;

// ─── opportunities ─────────────────────────────────────────────────────────────
// Auth required; no public access.
export const opportunitiesTable = pgTable(
  "opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id").references(() => opportunitySourcesTable.id, { onDelete: "set null" }),
    externalId: text("external_id"),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category"),
    tradeType: text("trade_type"),
    city: text("city"),
    state: text("state"),
    budgetMin: numeric("budget_min", { precision: 14, scale: 2 }),
    budgetMax: numeric("budget_max", { precision: 14, scale: 2 }),
    estimatedValue: numeric("estimated_value", { precision: 14, scale: 2 }),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    sourceUrl: text("source_url"),
    sourceName: text("source_name"),
    ingestionType: text("ingestion_type"),
    score: numeric("score", { precision: 6, scale: 2 }).notNull().default("0"),
    priorityLevel: text("priority_level"),
    relevanceReason: text("relevance_reason"),
    scoreReasonsJson: jsonb("score_reasons_json"),
    rawPayloadJson: jsonb("raw_payload_json"),
    status: text("status").notNull().default("new"),
    reviewed: boolean("reviewed").notNull().default(false),
    convertedToLead: boolean("converted_to_lead").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("opp_status_idx").on(t.status),
    index("opp_score_idx").on(t.score),
    index("opp_state_idx").on(t.state),
    index("opp_trade_type_idx").on(t.tradeType),
    index("opp_posted_at_idx").on(t.postedAt),
  ]
);

export type Opportunity = typeof opportunitiesTable.$inferSelect;
export type InsertOpportunity = typeof opportunitiesTable.$inferInsert;

// ─── opportunity_sync_runs ────────────────────────────────────────────────────
// Auth required; no public access.
export const opportunitySyncRunsTable = pgTable("opportunity_sync_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id").references(() => opportunitySourcesTable.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status").notNull().default("running"),
  itemsFetched: integer("items_fetched").default(0),
  itemsInserted: integer("items_inserted").default(0),
  itemsUpdated: integer("items_updated").default(0),
  errorText: text("error_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OpportunitySyncRun = typeof opportunitySyncRunsTable.$inferSelect;
export type InsertOpportunitySyncRun = typeof opportunitySyncRunsTable.$inferInsert;

// ─── opportunity_rules ────────────────────────────────────────────────────────
// Auth required; no public access.
export const opportunityRulesTable = pgTable("opportunity_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  includeKeywords: text("include_keywords").array().default([]),
  excludeKeywords: text("exclude_keywords").array().default([]),
  states: text("states").array().default([]),
  tradeTypes: text("trade_types").array().default([]),
  minBudget: numeric("min_budget", { precision: 14, scale: 2 }),
  maxBudget: numeric("max_budget", { precision: 14, scale: 2 }),
  minScore: numeric("min_score", { precision: 6, scale: 2 }),
  urgencyWeight: numeric("urgency_weight", { precision: 4, scale: 2 }).default("1"),
  recencyWeight: numeric("recency_weight", { precision: 4, scale: 2 }).default("1"),
  budgetWeight: numeric("budget_weight", { precision: 4, scale: 2 }).default("1"),
  keywordWeight: numeric("keyword_weight", { precision: 4, scale: 2 }).default("1"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OpportunityRule = typeof opportunityRulesTable.$inferSelect;
export type InsertOpportunityRule = typeof opportunityRulesTable.$inferInsert;

// ─── opportunity_events ───────────────────────────────────────────────────────
// Auth required; no public access.
export const opportunityEventsTable = pgTable("opportunity_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  opportunityId: uuid("opportunity_id")
    .notNull()
    .references(() => opportunitiesTable.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  eventNote: text("event_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OpportunityEvent = typeof opportunityEventsTable.$inferSelect;
export type InsertOpportunityEvent = typeof opportunityEventsTable.$inferInsert;
