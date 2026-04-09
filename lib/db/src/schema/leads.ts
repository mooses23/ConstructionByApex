import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  city: text("city").notNull(),
  zipCode: text("zip_code").notNull(),
  serviceNeeded: text("service_needed").notNull(),
  projectDescription: text("project_description").notNull(),
  preferredTimeline: text("preferred_timeline").notNull(),
  preferredContactMethod: text("preferred_contact_method").notNull(),
  status: text("status").notNull().default("new"),
  photoUrls: text("photo_urls").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;

export const leadNotesTable = pgTable("lead_notes", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leadsTable.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLeadNoteSchema = createInsertSchema(leadNotesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertLeadNote = z.infer<typeof insertLeadNoteSchema>;
export type LeadNote = typeof leadNotesTable.$inferSelect;

export const leadContactsTable = pgTable("lead_contacts", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leadsTable.id),
  method: text("method").notNull(),
  outcome: text("outcome").notNull(),
  notes: text("notes"),
  contactedAt: timestamp("contacted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLeadContactSchema = createInsertSchema(leadContactsTable).omit({
  id: true,
  contactedAt: true,
});
export type InsertLeadContact = z.infer<typeof insertLeadContactSchema>;
export type LeadContact = typeof leadContactsTable.$inferSelect;
