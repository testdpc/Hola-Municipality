import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, auditLogsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/audit", requireAuth, async (req, res): Promise<void> => {
  const { userId, action, from, to } = req.query;
  let logs = await db.select().from(auditLogsTable).orderBy(auditLogsTable.createdAt);

  if (userId) logs = logs.filter(l => l.userId === parseInt(userId as string, 10));
  if (action) logs = logs.filter(l => l.action.toLowerCase().includes((action as string).toLowerCase()));
  if (from) logs = logs.filter(l => l.createdAt >= new Date(from as string));
  if (to) logs = logs.filter(l => l.createdAt <= new Date(to as string));

  res.json(logs.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })));
});

export default router;
