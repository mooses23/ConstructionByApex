import { Router } from "express";
import { eq, desc, count, sql, gte } from "drizzle-orm";
import { db, leadsTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetRecentLeadsResponse,
  GetRecentLeadsQueryParams,
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

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [statusCounts, total, thisMonthCount, wonCount, wonThisMonthCount] = await Promise.all([
    db
      .select({
        status: leadsTable.status,
        count: count(),
      })
      .from(leadsTable)
      .groupBy(leadsTable.status),
    db.select({ count: count() }).from(leadsTable),
    db
      .select({ count: count() })
      .from(leadsTable)
      .where(gte(leadsTable.createdAt, startOfMonth)),
    db
      .select({ count: count() })
      .from(leadsTable)
      .where(eq(leadsTable.status, "won")),
    db
      .select({ count: count() })
      .from(leadsTable)
      .where(
        sql`${leadsTable.status} = 'won' AND ${leadsTable.updatedAt} >= ${startOfMonth}`
      ),
  ]);

  const statusMap: Record<string, number> = {};
  for (const row of statusCounts) {
    statusMap[row.status] = Number(row.count);
  }

  const totalCount = Number(total[0]?.count ?? 0);
  const won = Number(wonCount[0]?.count ?? 0);

  res.json(
    GetDashboardStatsResponse.parse({
      totalLeads: totalCount,
      newLeads: statusMap["new"] ?? 0,
      contactedLeads: statusMap["contacted"] ?? 0,
      quotedLeads: statusMap["quoted"] ?? 0,
      wonLeads: statusMap["won"] ?? 0,
      lostLeads: statusMap["lost"] ?? 0,
      thisMonthLeads: Number(thisMonthCount[0]?.count ?? 0),
      wonThisMonth: Number(wonThisMonthCount[0]?.count ?? 0),
      conversionRate: totalCount > 0 ? Math.round((won / totalCount) * 100) : 0,
    })
  );
});

router.get("/dashboard/recent-leads", async (req, res): Promise<void> => {
  const parsed = GetRecentLeadsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

  const leads = await db
    .select()
    .from(leadsTable)
    .orderBy(desc(leadsTable.createdAt))
    .limit(limit);

  res.json(GetRecentLeadsResponse.parse({ leads: leads.map(parseLead) }));
});

export default router;
