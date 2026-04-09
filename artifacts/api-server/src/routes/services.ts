import { Router } from "express";
import { asc } from "drizzle-orm";
import { db, servicesTable } from "@workspace/db";
import { ListServicesResponse } from "@workspace/api-zod";

const router = Router();

router.get("/services", async (_req, res): Promise<void> => {
  const services = await db.select().from(servicesTable).orderBy(asc(servicesTable.displayOrder));
  res.json(ListServicesResponse.parse({ services }));
});

export default router;
