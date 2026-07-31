import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, purchaseOrdersTable, purchaseOrderItemsTable, suppliersTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { createAuditLog } from "../lib/audit";

const router: IRouter = Router();

async function formatPO(po: typeof purchaseOrdersTable.$inferSelect) {
  const items = await db.select().from(purchaseOrderItemsTable).where(eq(purchaseOrderItemsTable.purchaseOrderId, po.id));
  const [supplier] = po.supplierId ? await db.select({ name: suppliersTable.name }).from(suppliersTable).where(eq(suppliersTable.id, po.supplierId)) : [null];
  const [reqBy] = po.requestedById ? await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, po.requestedById)) : [null];
  const [appBy] = po.approvedById ? await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, po.approvedById)) : [null];
  return {
    id: po.id,
    lpoNumber: po.lpoNumber,
    supplierId: po.supplierId,
    supplierName: supplier?.name || null,
    department: po.department,
    requestedById: po.requestedById,
    requestedByName: reqBy?.fullName || null,
    approvedById: po.approvedById,
    approvedByName: appBy?.fullName || null,
    status: po.status,
    items: items.map(i => ({ ...i, unitPrice: parseFloat(i.unitPrice), totalPrice: parseFloat(i.totalPrice) })),
    totalAmount: parseFloat(po.totalAmount),
    notes: po.notes,
    rejectionReason: po.rejectionReason,
    createdAt: po.createdAt.toISOString(),
    updatedAt: po.updatedAt.toISOString(),
  };
}

router.get("/purchase-orders", requireAuth, async (_req, res): Promise<void> => {
  const pos = await db.select().from(purchaseOrdersTable).orderBy(purchaseOrdersTable.createdAt);
  const result = await Promise.all(pos.map(formatPO));
  res.json(result);
});

router.post("/purchase-orders", requireAuth, async (req, res): Promise<void> => {
  const { supplierId, department, notes, items } = req.body;
  if (!supplierId || !department) { res.status(400).json({ error: "supplierId and department required" }); return; }
  const count = await db.select().from(purchaseOrdersTable);
  const lpoNumber = `LPO-${new Date().getFullYear()}-${String(count.length + 1).padStart(5, "0")}`;
  const totalAmount = (items || []).reduce((s: number, i: { totalPrice?: number; quantity?: number; unitPrice?: number }) => s + (i.totalPrice || (i.quantity || 0) * (i.unitPrice || 0)), 0);

  const [po] = await db.insert(purchaseOrdersTable).values({ lpoNumber, supplierId: Number(supplierId), department, requestedById: req.user!.userId, status: "draft", totalAmount: String(totalAmount), notes }).returning();

  if (items?.length) {
    await db.insert(purchaseOrderItemsTable).values(items.map((i: { inventoryItemId?: number; itemName: string; quantity: number; unitPrice: number; totalPrice?: number }) => ({
      purchaseOrderId: po.id,
      inventoryItemId: i.inventoryItemId ? Number(i.inventoryItemId) : null,
      itemName: i.itemName,
      quantity: Number(i.quantity),
      unitPrice: String(i.unitPrice),
      totalPrice: String(i.totalPrice || i.quantity * i.unitPrice),
    })));
  }
  await createAuditLog(req.user!, "CREATE", "purchase_orders", po.id, null, { lpoNumber });
  res.status(201).json(await formatPO(po));
});

router.get("/purchase-orders/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [po] = await db.select().from(purchaseOrdersTable).where(eq(purchaseOrdersTable.id, id));
  if (!po) { res.status(404).json({ error: "Purchase order not found" }); return; }
  res.json(await formatPO(po));
});

router.patch("/purchase-orders/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { supplierId, department, notes, status } = req.body;
  const updates: Record<string, unknown> = {};
  if (supplierId !== undefined) updates.supplierId = Number(supplierId);
  if (department !== undefined) updates.department = department;
  if (notes !== undefined) updates.notes = notes;
  if (status !== undefined) updates.status = status;
  const [po] = await db.update(purchaseOrdersTable).set(updates).where(eq(purchaseOrdersTable.id, id)).returning();
  if (!po) { res.status(404).json({ error: "Not found" }); return; }
  await createAuditLog(req.user!, "UPDATE", "purchase_orders", id, null, updates);
  res.json(await formatPO(po));
});

router.post("/purchase-orders/:id/approve", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [po] = await db.update(purchaseOrdersTable).set({ status: "approved", approvedById: req.user!.userId }).where(eq(purchaseOrdersTable.id, id)).returning();
  if (!po) { res.status(404).json({ error: "Not found" }); return; }
  await createAuditLog(req.user!, "APPROVE", "purchase_orders", id);
  res.json(await formatPO(po));
});

router.post("/purchase-orders/:id/reject", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { reason } = req.body;
  const [po] = await db.update(purchaseOrdersTable).set({ status: "rejected", rejectionReason: reason }).where(eq(purchaseOrdersTable.id, id)).returning();
  if (!po) { res.status(404).json({ error: "Not found" }); return; }
  await createAuditLog(req.user!, "REJECT", "purchase_orders", id);
  res.json(await formatPO(po));
});

export default router;
