import { Router } from "express";
import { db, leadsTable } from "@workspace/db";
import { CreateLeadBody } from "@workspace/api-zod";

const router = Router();

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

  res.status(201).json({
    ...lead,
    photoUrls: lead.photoUrls ?? [],
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  });
});

export default router;
