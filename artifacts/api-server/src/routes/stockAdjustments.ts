import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, stockAdjustmentsTable, inventoryItemsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { createAuditLog } from "../lib/audit";

const router: IRouter = Router();

async function formatAdj(a: typeof stockAdjustmentsTable.$inferSelect) {
  const [item] = a.inventoryItemId ? await db.select({ itemName: inventoryItemsTable.itemName }).from(inventoryItemsTable).where(eq(inventoryItemsTable.id, a.inventoryItemId)) : [null];
  const [user] = a.adjustedById ? await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, a.adjustedById)) : [null];
  return {
    id: a.id,
    adjustmentNumber: a.adjustmentNumber,
    inventoryItemId: a.inventoryItemId,
    itemName: item?.itemName || null,
    adjustmentType: a.adjustmentType,
    quantityBefore: a.quantityBefore,
    quantityAfter: a.quantityAfter,
    reason: a.reason,
    adjustedById: a.adjustedById,
    adjustedByName: user?.fullName || null,
    adjustmentDate: a.adjustmentDate,
    notes: a.notes,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/stock-adjustments", requireAuth, async (_req, res): Promise<void> => {
  const adjs = await db.select().from(stockAdjustmentsTable).orderBy(stockAdjustmentsTable.createdAt);
  const result = await Promise.all(adjs.map(formatAdj));
  res.json(result);
});

router.post("/stock-adjustments", requireAuth, async (req, res): Promise<void> => {
  const { inventoryItemId, adjustmentType, quantityAfter, reason, adjustedById, adjustmentDate, notes } = req.body;
  if (!inventoryItemId || !adjustmentType || quantityAfter === undefined || !reason || !adjustedById || !adjustmentDate) {
    res.status(400).json({ error: "inventoryItemId, adjustmentType, quantityAfter, reason, adjustedById, adjustmentDate required" });
    return;
  }

  const [inv] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, Number(inventoryItemId)));
  if (!inv) { res.status(404).json({ error: "Inventory item not found" }); return; }

  const quantityBefore = inv.currentQuantity;
  const newQty = Number(quantityAfter);
  const status = newQty <= 0 ? "out_of_stock" : newQty <= inv.minimumStock ? "low_stock" : "available";

  const count = await db.select().from(stockAdjustmentsTable);
  const adjustmentNumber = `ADJ-${new Date().getFullYear()}-${String(count.length + 1).padStart(5, "0")}`;

  const [adj] = await db.insert(stockAdjustmentsTable).values({
    adjustmentNumber, inventoryItemId: Number(inventoryItemId), adjustmentType,
    quantityBefore, quantityAfter: newQty, reason, adjustedById: Number(adjustedById),
    adjustmentDate, notes,
  }).returning();

  await db.update(inventoryItemsTable).set({ currentQuantity: newQty, status }).where(eq(inventoryItemsTable.id, Number(inventoryItemId)));
  await createAuditLog(req.user!, "ADJUST", "stock_adjustments", adj.id, { quantityBefore }, { quantityAfter: newQty, reason });
  res.status(201).json(await formatAdj(adj));
});

router.get("/stock-adjustments/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [adj] = await db.select().from(stockAdjustmentsTable).where(eq(stockAdjustmentsTable.id, id));
  if (!adj) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatAdj(adj));
});

export default router;
