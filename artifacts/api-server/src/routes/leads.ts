import { Router } from "express";
import { eq, desc, ilike, and, or, count, gte, sql } from "drizzle-orm";
import { db, leadsTable, leadNotesTable, leadContactsTable, quotesTable } from "@workspace/db";
import {
  CreateLeadBody,
  UpdateLeadBody,
  UpdateLeadParams,
  GetLeadParams,
  AddLeadNoteParams,
  AddLeadNoteBody,
  LogContactParams,
  LogContactBody,
  ListLeadsQueryParams,
  ListLeadsResponse,
  GetLeadResponse,
  UpdateLeadResponse,
} from "@workspace/api-zod";

const router = Router();

function parseLead(lead: typeof leadsTable.$inferSelect) {
  return {
    ...lead,
    photoUrls: lead.photoUrls ?? [],
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

router.get("/leads", async (req, res): Promise<void> => {
  const parsed = ListLeadsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status, search, limit = 50, offset = 0 } = parsed.data;

  const conditions = [];
  if (status) conditions.push(eq(leadsTable.status, status));
  if (search) {
    conditions.push(
      or(
        ilike(leadsTable.fullName, `%${search}%`),
        ilike(leadsTable.email, `%${search}%`),
        ilike(leadsTable.city, `%${search}%`),
        ilike(leadsTable.serviceNeeded, `%${search}%`)
      )
    );
  }

  const [leads, [countResult]] = await Promise.all([
    db
      .select()
      .from(leadsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(leadsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(leadsTable)
      .where(conditions.length ? and(...conditions) : undefined),
  ]);

  res.json(
    ListLeadsResponse.parse({
      leads: leads.map(parseLead),
      total: Number(countResult.count),
    })
  );
});

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lead] = await db
    .insert(leadsTable)
    .values({
      ...parsed.data,
      photoUrls: parsed.data.photoUrls ?? [],
      status: "new",
    })
    .returning();

  res.status(201).json(parseLead(lead));
});

router.get("/leads/:id", async (req, res): Promise<void> => {
  const params = GetLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.data.id));
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  const [notes, contacts, quotes] = await Promise.all([
    db.select().from(leadNotesTable).where(eq(leadNotesTable.leadId, lead.id)).orderBy(desc(leadNotesTable.createdAt)),
    db.select().from(leadContactsTable).where(eq(leadContactsTable.leadId, lead.id)).orderBy(desc(leadContactsTable.contactedAt)),
    db.select().from(quotesTable).where(eq(quotesTable.leadId, lead.id)).orderBy(desc(quotesTable.createdAt)),
  ]);

  const response = GetLeadResponse.parse({
    ...parseLead(lead),
    notes: notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
    contacts: contacts.map((c) => ({ ...c, contactedAt: c.contactedAt.toISOString() })),
    quotes: quotes.map((q) => ({
      ...q,
      totalAmount: Number(q.totalAmount),
      createdAt: q.createdAt.toISOString(),
    })),
  });

  res.json(response);
});

router.patch("/leads/:id", async (req, res): Promise<void> => {
  const params = UpdateLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lead] = await db
    .update(leadsTable)
    .set(parsed.data)
    .where(eq(leadsTable.id, params.data.id))
    .returning();

  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json(UpdateLeadResponse.parse(parseLead(lead)));
});

router.post("/leads/:id/notes", async (req, res): Promise<void> => {
  const params = AddLeadNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddLeadNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.data.id));
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  const [note] = await db
    .insert(leadNotesTable)
    .values({ leadId: params.data.id, content: parsed.data.content })
    .returning();

  res.status(201).json({ ...note, createdAt: note.createdAt.toISOString() });
});

router.post("/leads/:id/contacts", async (req, res): Promise<void> => {
  const params = LogContactParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = LogContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.data.id));
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  const [contact] = await db
    .insert(leadContactsTable)
    .values({ leadId: params.data.id, ...parsed.data })
    .returning();

  res.status(201).json({ ...contact, contactedAt: contact.contactedAt.toISOString() });
});

export default router;
