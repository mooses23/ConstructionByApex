import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const opportunitySourcesTable = pgTable("opportunity_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sourceType: text("source_type").notNull(),
  config: jsonb("config").notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOpportunitySourceSchema = createInsertSchema(opportunitySourcesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOpportunitySource = z.infer<typeof insertOpportunitySourceSchema>;
export type OpportunitySource = typeof opportunitySourcesTable.$inferSelect;

export const opportunitiesTable = pgTable(
  "opportunities",
  {
    id: serial("id").primaryKey(),
    sourceId: integer("source_id").references(() => opportunitySourcesTable.id),
    externalId: text("external_id"),
    title: text("title").notNull(),
    description: text("description"),
    tradeType: text("trade_type"),
    status: text("status").notNull().default("new"),
    priorityLevel: text("priority_level").notNull().default("low"),
    score: integer("score").notNull().default(0),
    scoreReasonsJson: jsonb("score_reasons_json").notNull().default([]),
    budgetMin: numeric("budget_min", { precision: 14, scale: 2 }),
    budgetMax: numeric("budget_max", { precision: 14, scale: 2 }),
    state: text("state"),
    city: text("city"),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    sourceUrl: text("source_url"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    rawPayloadJson: jsonb("raw_payload_json").notNull().default({}),
    ingestMethod: text("ingest_method").notNull().default("manual"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("opportunities_status_idx").on(table.status),
    index("opportunities_score_idx").on(table.score),
    index("opportunities_state_idx").on(table.state),
    index("opportunities_trade_type_idx").on(table.tradeType),
    index("opportunities_posted_at_idx").on(table.postedAt),
    uniqueIndex("opportunities_source_external_id_idx")
      .on(table.sourceId, table.externalId)
      .where(sql`source_id IS NOT NULL AND external_id IS NOT NULL`),
  ]
);

export const insertOpportunitySchema = createInsertSchema(opportunitiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunitiesTable.$inferSelect;

export const opportunitySyncRunsTable = pgTable("opportunity_sync_runs", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => opportunitySourcesTable.id),
  status: text("status").notNull().default("pending"),
  recordsFetched: integer("records_fetched").notNull().default(0),
  recordsInserted: integer("records_inserted").notNull().default(0),
  recordsSkipped: integer("records_skipped").notNull().default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertOpportunitySyncRunSchema = createInsertSchema(opportunitySyncRunsTable).omit({
  id: true,
  startedAt: true,
});
export type InsertOpportunitySyncRun = z.infer<typeof insertOpportunitySyncRunSchema>;
export type OpportunitySyncRun = typeof opportunitySyncRunsTable.$inferSelect;

export const opportunityRulesTable = pgTable("opportunity_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  keywords: jsonb("keywords").notNull().default([]),
  tradeTypes: jsonb("trade_types").notNull().default([]),
  targetStates: jsonb("target_states").notNull().default([]),
  minBudget: numeric("min_budget", { precision: 14, scale: 2 }),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOpportunityRuleSchema = createInsertSchema(opportunityRulesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOpportunityRule = z.infer<typeof insertOpportunityRuleSchema>;
export type OpportunityRule = typeof opportunityRulesTable.$inferSelect;

export const opportunityEventsTable = pgTable("opportunity_events", {
  id: serial("id").primaryKey(),
  opportunityId: integer("opportunity_id").notNull().references(() => opportunitiesTable.id),
  eventType: text("event_type").notNull(),
  note: text("note"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOpportunityEventSchema = createInsertSchema(opportunityEventsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOpportunityEvent = z.infer<typeof insertOpportunityEventSchema>;
export type OpportunityEvent = typeof opportunityEventsTable.$inferSelect;
