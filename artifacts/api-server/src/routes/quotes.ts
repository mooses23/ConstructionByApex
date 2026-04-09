import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, quotesTable, quoteItemsTable } from "@workspace/db";
import {
  CreateQuoteBody,
  UpdateQuoteBody,
  UpdateQuoteParams,
  GetQuoteParams,
  ListQuotesResponse,
  GetQuoteResponse,
  UpdateQuoteResponse,
} from "@workspace/api-zod";

const router = Router();

function serializeQuote(q: typeof quotesTable.$inferSelect) {
  return {
    ...q,
    totalAmount: Number(q.totalAmount),
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
  };
}

function serializeItem(item: typeof quoteItemsTable.$inferSelect) {
  return {
    ...item,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    total: Number(item.total),
  };
}

router.get("/quotes", async (_req, res): Promise<void> => {
  const quotes = await db.select().from(quotesTable).orderBy(desc(quotesTable.createdAt));
  res.json(ListQuotesResponse.parse({ quotes: quotes.map(serializeQuote) }));
});

router.post("/quotes", async (req, res): Promise<void> => {
  const parsed = CreateQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { items, ...quoteData } = parsed.data;

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const [quote] = await db
    .insert(quotesTable)
    .values({ ...quoteData, totalAmount: String(totalAmount), status: "draft" })
    .returning();

  const quoteItems = await db
    .insert(quoteItemsTable)
    .values(
      items.map((item) => ({
        quoteId: quote.id,
        description: item.description,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        total: String(item.quantity * item.unitPrice),
      }))
    )
    .returning();

  res.status(201).json(
    GetQuoteResponse.parse({
      ...serializeQuote(quote),
      items: quoteItems.map(serializeItem),
    })
  );
});

router.get("/quotes/:id", async (req, res): Promise<void> => {
  const params = GetQuoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [quote] = await db.select().from(quotesTable).where(eq(quotesTable.id, params.data.id));
  if (!quote) {
    res.status(404).json({ error: "Quote not found" });
    return;
  }

  const items = await db.select().from(quoteItemsTable).where(eq(quoteItemsTable.quoteId, quote.id));

  res.json(
    GetQuoteResponse.parse({
      ...serializeQuote(quote),
      items: items.map(serializeItem),
    })
  );
});

router.patch("/quotes/:id", async (req, res): Promise<void> => {
  const params = UpdateQuoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { items, ...quoteData } = parsed.data;

  let totalAmount: number | undefined;
  if (items) {
    totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    await db.delete(quoteItemsTable).where(eq(quoteItemsTable.quoteId, params.data.id));
    if (items.length > 0) {
      await db.insert(quoteItemsTable).values(
        items.map((item) => ({
          quoteId: params.data.id,
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          total: String(item.quantity * item.unitPrice),
        }))
      );
    }
  }

  const [updated] = await db
    .update(quotesTable)
    .set({
      ...quoteData,
      ...(totalAmount !== undefined ? { totalAmount: String(totalAmount) } : {}),
    })
    .where(eq(quotesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Quote not found" });
    return;
  }

  const finalItems = await db.select().from(quoteItemsTable).where(eq(quoteItemsTable.quoteId, updated.id));

  res.json(
    UpdateQuoteResponse.parse({
      ...serializeQuote(updated),
      items: finalItems.map(serializeItem),
    })
  );
});

export default router;
