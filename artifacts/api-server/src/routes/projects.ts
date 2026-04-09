import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, projectsTable } from "@workspace/db";
import {
  ListProjectsQueryParams,
  ListProjectsResponse,
  GetProjectParams,
  GetProjectResponse,
} from "@workspace/api-zod";

const router = Router();

function serializeProject(p: typeof projectsTable.$inferSelect) {
  return {
    ...p,
    completedAt: p.completedAt?.toISOString() ?? null,
    beforeImageUrl: p.beforeImageUrl ?? null,
    afterImageUrl: p.afterImageUrl ?? null,
  };
}

router.get("/projects", async (req, res): Promise<void> => {
  const parsed = ListProjectsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const query = db.select().from(projectsTable);

  const results = parsed.data.category
    ? await query.where(eq(projectsTable.category, parsed.data.category)).orderBy(desc(projectsTable.completedAt))
    : await query.orderBy(desc(projectsTable.completedAt));

  res.json(ListProjectsResponse.parse({ projects: results.map(serializeProject) }));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json(GetProjectResponse.parse(serializeProject(project)));
});

export default router;
