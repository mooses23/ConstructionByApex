import { Router } from "express";
import { desc } from "drizzle-orm";
import { db, testimonialsTable } from "@workspace/db";
import { ListTestimonialsResponse } from "@workspace/api-zod";

const router = Router();

router.get("/testimonials", async (_req, res): Promise<void> => {
  const testimonials = await db
    .select()
    .from(testimonialsTable)
    .orderBy(desc(testimonialsTable.featured), desc(testimonialsTable.createdAt));

  res.json(
    ListTestimonialsResponse.parse({
      testimonials: testimonials.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
      })),
    })
  );
});

export default router;
