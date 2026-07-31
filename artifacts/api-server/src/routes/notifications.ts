import { Router, type IRouter } from "express";
import { eq, or } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const notifications = await db.select().from(notificationsTable)
    .where(or(eq(notificationsTable.userId, req.user!.userId)))
    .orderBy(notificationsTable.createdAt);
  res.json(notifications.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })));
});

router.post("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, id));
  res.json({ message: "Marked as read" });
});

router.post("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.userId, req.user!.userId));
  res.json({ message: "All notifications marked as read" });
});

export default router;
