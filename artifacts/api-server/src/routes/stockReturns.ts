import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, stockReturnsTable, inventoryItemsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { createAuditLog } from "../lib/audit";

const router: IRouter = Router();

async function formatReturn(r: typeof stockReturnsTable.$inferSelect) {
  const [item] = r.inventoryItemId ? await db.select({ itemName: inventoryItemsTable.itemName }).from(inventoryItemsTable).where(eq(inventoryItemsTable.id, r.inventoryItemId)) : [null];
  const [sk] = r.storekeeperI ? await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, r.storekeeperI)) : [null];
  return {
    id: r.id,
    returnNumber: r.returnNumber,
    inventoryItemId: r.inventoryItemId,
    itemName: item?.itemName || null,
    quantity: r.quantity,
    condition: r.condition,
    reason: r.reason,
    storekeeperI: r.storekeeperI,
    storekeeperName: sk?.fullName || null,
    returnDate: r.returnDate,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/stock-returns", requireAuth, async (_req, res): Promise<void> => {
  const returns = await db.select().from(stockReturnsTable).orderBy(stockReturnsTable.createdAt);
  const result = await Promise.all(returns.map(formatReturn));
  res.json(result);
});

router.post("/stock-returns", requireAuth, async (req, res): Promise<void> => {
  const { inventoryItemId, quantity, condition, reason, storekeeperI, returnDate, notes } = req.body;
  if (!inventoryItemId || !quantity || !condition || !reason || !storekeeperI || !returnDate) {
    res.status(400).json({ error: "inventoryItemId, quantity, condition, reason, storekeeperI, returnDate required" });
    return;
  }
  const count = await db.select().from(stockReturnsTable);
  const returnNumber = `SRT-${new Date().getFullYear()}-${String(count.length + 1).padStart(5, "0")}`;

  const [ret] = await db.insert(stockReturnsTable).values({
    returnNumber, inventoryItemId: Number(inventoryItemId), quantity: Number(quantity),
    condition, reason, storekeeperI: Number(storekeeperI), returnDate, notes,
  }).returning();

  // Update inventory if condition is good
  if (condition === "good") {
    const [inv] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, Number(inventoryItemId)));
    if (inv) {
      const newQty = inv.currentQuantity + Number(quantity);
      const status = newQty <= 0 ? "out_of_stock" : newQty <= inv.minimumStock ? "low_stock" : "available";
      await db.update(inventoryItemsTable).set({ currentQuantity: newQty, status }).where(eq(inventoryItemsTable.id, inv.id));
    }
  }

  await createAuditLog(req.user!, "CREATE", "stock_returns", ret.id, null, { returnNumber });
  res.status(201).json(await formatReturn(ret));
});

router.get("/stock-returns/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [ret] = await db.select().from(stockReturnsTable).where(eq(stockReturnsTable.id, id));
  if (!ret) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatReturn(ret));
});

export default router;
