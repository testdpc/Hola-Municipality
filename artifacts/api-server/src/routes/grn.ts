import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, goodsReceivedNotesTable, grnItemsTable, suppliersTable, usersTable, inventoryItemsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { createAuditLog } from "../lib/audit";

const router: IRouter = Router();

async function formatGRN(grn: typeof goodsReceivedNotesTable.$inferSelect) {
  const items = await db.select().from(grnItemsTable).where(eq(grnItemsTable.grnId, grn.id));
  const [sup] = grn.supplierId ? await db.select({ name: suppliersTable.name }).from(suppliersTable).where(eq(suppliersTable.id, grn.supplierId)) : [null];
  const [off] = grn.receivingOfficerId ? await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, grn.receivingOfficerId)) : [null];
  return {
    id: grn.id,
    grnNumber: grn.grnNumber,
    purchaseOrderId: grn.purchaseOrderId,
    lpoNumber: null,
    supplierId: grn.supplierId,
    supplierName: sup?.name || null,
    deliveryNoteNumber: grn.deliveryNoteNumber,
    dateReceived: grn.dateReceived,
    receivingOfficerId: grn.receivingOfficerId,
    receivingOfficerName: off?.fullName || null,
    inspectionStatus: grn.inspectionStatus,
    status: grn.status,
    items: items.map(i => ({ ...i, unitPrice: parseFloat(i.unitPrice) })),
    notes: grn.notes,
    createdAt: grn.createdAt.toISOString(),
  };
}

router.get("/grn", requireAuth, async (_req, res): Promise<void> => {
  const grns = await db.select().from(goodsReceivedNotesTable).orderBy(goodsReceivedNotesTable.createdAt);
  const result = await Promise.all(grns.map(formatGRN));
  res.json(result);
});

router.post("/grn", requireAuth, async (req, res): Promise<void> => {
  const { supplierId, purchaseOrderId, deliveryNoteNumber, dateReceived, receivingOfficerId, inspectionStatus, notes, items } = req.body;
  if (!supplierId || !dateReceived || !receivingOfficerId) {
    res.status(400).json({ error: "supplierId, dateReceived, receivingOfficerId required" });
    return;
  }
  const count = await db.select().from(goodsReceivedNotesTable);
  const grnNumber = `GRN-${new Date().getFullYear()}-${String(count.length + 1).padStart(5, "0")}`;

  const [grn] = await db.insert(goodsReceivedNotesTable).values({
    grnNumber, supplierId: Number(supplierId), purchaseOrderId: purchaseOrderId ? Number(purchaseOrderId) : null,
    deliveryNoteNumber, dateReceived, receivingOfficerId: Number(receivingOfficerId),
    inspectionStatus: inspectionStatus || "pending", status: "draft", notes,
  }).returning();

  if (items?.length) {
    for (const item of items) {
      await db.insert(grnItemsTable).values({
        grnId: grn.id,
        inventoryItemId: Number(item.inventoryItemId),
        itemName: item.itemName,
        quantityOrdered: Number(item.quantityOrdered),
        quantityReceived: Number(item.quantityReceived),
        unitPrice: String(item.unitPrice),
      });
      // Update inventory quantity
      const [inv] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, Number(item.inventoryItemId)));
      if (inv) {
        const newQty = inv.currentQuantity + Number(item.quantityReceived);
        const status = newQty <= 0 ? "out_of_stock" : newQty <= inv.minimumStock ? "low_stock" : "available";
        await db.update(inventoryItemsTable).set({ currentQuantity: newQty, status }).where(eq(inventoryItemsTable.id, inv.id));
      }
    }
  }
  await createAuditLog(req.user!, "CREATE", "goods_received_notes", grn.id, null, { grnNumber });
  res.status(201).json(await formatGRN(grn));
});

router.get("/grn/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [grn] = await db.select().from(goodsReceivedNotesTable).where(eq(goodsReceivedNotesTable.id, id));
  if (!grn) { res.status(404).json({ error: "GRN not found" }); return; }
  res.json(await formatGRN(grn));
});

router.patch("/grn/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { deliveryNoteNumber, inspectionStatus, status, notes } = req.body;
  const updates: Record<string, unknown> = {};
  if (deliveryNoteNumber !== undefined) updates.deliveryNoteNumber = deliveryNoteNumber;
  if (inspectionStatus !== undefined) updates.inspectionStatus = inspectionStatus;
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  const [grn] = await db.update(goodsReceivedNotesTable).set(updates).where(eq(goodsReceivedNotesTable.id, id)).returning();
  if (!grn) { res.status(404).json({ error: "GRN not found" }); return; }
  await createAuditLog(req.user!, "UPDATE", "goods_received_notes", id, null, updates);
  res.json(await formatGRN(grn));
});

export default router;
