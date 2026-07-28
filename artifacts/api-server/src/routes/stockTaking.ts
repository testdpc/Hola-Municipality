import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, stockTakingsTable, stockTakingItemsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { createAuditLog } from "../lib/audit";

const router: IRouter = Router();

async function formatTaking(s: typeof stockTakingsTable.$inferSelect) {
  const items = await db.select().from(stockTakingItemsTable).where(eq(stockTakingItemsTable.stockTakingId, s.id));
  const [user] = s.conductedById ? await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, s.conductedById)) : [null];
  return {
    id: s.id,
    sessionNumber: s.sessionNumber,
    conductedById: s.conductedById,
    conductedByName: user?.fullName || null,
    status: s.status,
    startDate: s.startDate,
    endDate: s.endDate,
    items,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/stock-takings", requireAuth, async (_req, res): Promise<void> => {
  const sessions = await db.select().from(stockTakingsTable).orderBy(stockTakingsTable.createdAt);
  const result = await Promise.all(sessions.map(formatTaking));
  res.json(result);
});

router.post("/stock-takings", requireAuth, async (req, res): Promise<void> => {
  const { conductedById, startDate, notes, items } = req.body;
  if (!conductedById || !startDate) {
    res.status(400).json({ error: "conductedById and startDate required" });
    return;
  }
  const count = await db.select().from(stockTakingsTable);
  const sessionNumber = `STK-${new Date().getFullYear()}-${String(count.length + 1).padStart(5, "0")}`;

  const [session] = await db.insert(stockTakingsTable).values({
    sessionNumber, conductedById: Number(conductedById), startDate, status: "in_progress", notes,
  }).returning();

  if (items?.length) {
    await db.insert(stockTakingItemsTable).values(items.map((i: { inventoryItemId: number; itemName: string; systemQuantity: number; physicalQuantity: number; notes?: string }) => ({
      stockTakingId: session.id,
      inventoryItemId: Number(i.inventoryItemId),
      itemName: i.itemName,
      systemQuantity: Number(i.systemQuantity),
      physicalQuantity: Number(i.physicalQuantity),
      variance: Number(i.physicalQuantity) - Number(i.systemQuantity),
      notes: i.notes,
    })));
  }
  await createAuditLog(req.user!, "CREATE", "stock_takings", session.id, null, { sessionNumber });
  res.status(201).json(await formatTaking(session));
});

router.get("/stock-takings/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [session] = await db.select().from(stockTakingsTable).where(eq(stockTakingsTable.id, id));
  if (!session) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatTaking(session));
});

router.patch("/stock-takings/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status, endDate, notes, items } = req.body;
  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (endDate !== undefined) updates.endDate = endDate;
  if (notes !== undefined) updates.notes = notes;
  const [session] = await db.update(stockTakingsTable).set(updates).where(eq(stockTakingsTable.id, id)).returning();
  if (!session) { res.status(404).json({ error: "Not found" }); return; }

  if (items?.length) {
    await db.delete(stockTakingItemsTable).where(eq(stockTakingItemsTable.stockTakingId, id));
    await db.insert(stockTakingItemsTable).values(items.map((i: { inventoryItemId: number; itemName: string; systemQuantity: number; physicalQuantity: number; notes?: string }) => ({
      stockTakingId: id,
      inventoryItemId: Number(i.inventoryItemId),
      itemName: i.itemName,
      systemQuantity: Number(i.systemQuantity),
      physicalQuantity: Number(i.physicalQuantity),
      variance: Number(i.physicalQuantity) - Number(i.systemQuantity),
      notes: i.notes,
    })));
  }
  await createAuditLog(req.user!, "UPDATE", "stock_takings", id, null, updates);
  res.json(await formatTaking(session));
});

export default router;
