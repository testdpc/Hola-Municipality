import { Router, type IRouter } from "express";
import { eq, and, like, lte, sql } from "drizzle-orm";
import { db, inventoryItemsTable, categoriesTable, suppliersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { createAuditLog } from "../lib/audit";

const router: IRouter = Router();

function computeStatus(current: number, min: number): string {
  if (current <= 0) return "out_of_stock";
  if (current <= min) return "low_stock";
  return "available";
}

function sanitizeItemCode(value: string): string {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 20);
  return normalized || "ITEM";
}

async function generateItemCode(itemName: string) {
  const base = sanitizeItemCode(itemName);
  let candidate = base;
  let count = 1;

  while (true) {
    const [exists] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.itemCode, candidate));
    if (!exists) {
      return candidate;
    }
    candidate = `${base}-${String(count).padStart(3, "0")}`;
    count += 1;
  }
}

async function formatItem(item: typeof inventoryItemsTable.$inferSelect) {
  const [cat] = item.categoryId
    ? await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, item.categoryId))
    : [null];
  const [sup] = item.supplierId
    ? await db.select({ name: suppliersTable.name }).from(suppliersTable).where(eq(suppliersTable.id, item.supplierId))
    : [null];
  return {
    id: item.id,
    itemCode: item.itemCode,
    barcodeQr: item.barcodeQr,
    itemName: item.itemName,
    categoryId: item.categoryId,
    categoryName: cat?.name || null,
    description: item.description,
    unitOfMeasure: item.unitOfMeasure,
    currentQuantity: item.currentQuantity,
    minimumStock: item.minimumStock,
    maximumStock: item.maximumStock,
    reorderLevel: item.reorderLevel,
    shelfBinLocation: item.shelfBinLocation,
    purchasePrice: parseFloat(item.purchasePrice),
    supplierId: item.supplierId,
    supplierName: sup?.name || null,
    dateReceived: item.dateReceived,
    expiryDate: item.expiryDate,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
  };
}

router.get("/inventory", requireAuth, async (req, res): Promise<void> => {
  const { category, status, search } = req.query;
  let items = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.isDeleted, false));

  if (category) items = items.filter(i => i.categoryId === parseInt(category as string, 10));
  if (status) items = items.filter(i => i.status === status);
  if (search) {
    const q = (search as string).toLowerCase();
    items = items.filter(i => i.itemName.toLowerCase().includes(q) || i.itemCode.toLowerCase().includes(q));
  }

  const result = await Promise.all(items.map(formatItem));
  res.json(result);
});

router.get("/inventory/low-stock", requireAuth, async (_req, res): Promise<void> => {
  const items = await db.select().from(inventoryItemsTable)
    .where(and(eq(inventoryItemsTable.isDeleted, false), sql`${inventoryItemsTable.status} IN ('low_stock', 'out_of_stock')`));
  const result = await Promise.all(items.map(formatItem));
  res.json(result);
});

router.get("/inventory/expiring", requireAuth, async (_req, res): Promise<void> => {
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const dateStr = thirtyDaysLater.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  const items = await db.select().from(inventoryItemsTable)
    .where(and(
      eq(inventoryItemsTable.isDeleted, false),
      sql`${inventoryItemsTable.expiryDate} IS NOT NULL`,
      sql`${inventoryItemsTable.expiryDate} <= ${dateStr}`,
      sql`${inventoryItemsTable.expiryDate} >= ${today}`
    ));
  const result = await Promise.all(items.map(formatItem));
  res.json(result);
});

router.post("/inventory", requireAuth, async (req, res): Promise<void> => {
  const { itemCode, barcodeQr, itemName, categoryId, description, unitOfMeasure, currentQuantity, minimumStock, maximumStock, reorderLevel, shelfBinLocation, purchasePrice, supplierId, dateReceived, expiryDate } = req.body;
  if (!itemName || !categoryId || !unitOfMeasure) {
    res.status(400).json({ error: "itemName, categoryId, and unitOfMeasure are required" });
    return;
  }

  const normalizedItemCode = itemCode ? sanitizeItemCode(String(itemCode)) : await generateItemCode(itemName);
  if (itemCode) {
    const [existingItemCode] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.itemCode, normalizedItemCode));
    if (existingItemCode) {
      res.status(409).json({ error: "Item code already exists" });
      return;
    }
  }

  const qty = currentQuantity ?? 0;
  const minStock = minimumStock ?? 0;
  const status = computeStatus(qty, minStock);

  const [item] = await db.insert(inventoryItemsTable).values({
    itemCode: normalizedItemCode,
    barcodeQr,
    itemName,
    categoryId: Number(categoryId),
    description,
    unitOfMeasure,
    currentQuantity: Number(qty),
    minimumStock: Number(minStock),
    maximumStock: Number(maximumStock ?? 1000),
    reorderLevel: Number(reorderLevel ?? 10),
    shelfBinLocation,
    purchasePrice: String(purchasePrice ?? 0),
    supplierId: supplierId ? Number(supplierId) : null,
    dateReceived,
    expiryDate,
    status,
  }).returning();
  await createAuditLog(req.user!, "CREATE", "inventory_items", item.id, null, { itemCode: normalizedItemCode, itemName });
  res.status(201).json(await formatItem(item));
});

router.get("/inventory/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [item] = await db.select().from(inventoryItemsTable).where(and(eq(inventoryItemsTable.id, id), eq(inventoryItemsTable.isDeleted, false)));
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }
  res.json(await formatItem(item));
});

router.patch("/inventory/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const updates: Record<string, unknown> = {};
  const fields = ["itemCode","barcodeQr","itemName","categoryId","description","unitOfMeasure","currentQuantity","minimumStock","maximumStock","reorderLevel","shelfBinLocation","purchasePrice","supplierId","dateReceived","expiryDate"];
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }

  if (updates.itemCode !== undefined) {
    const candidate = String(updates.itemCode).trim();
    if (!candidate) {
      res.status(400).json({ error: "Item code cannot be empty" });
      return;
    }
    const normalizedCode = sanitizeItemCode(candidate);
    const [existingCode] = await db
      .select()
      .from(inventoryItemsTable)
      .where(and(eq(inventoryItemsTable.itemCode, normalizedCode), sql`${inventoryItemsTable.id} != ${id}`));
    if (existingCode) {
      res.status(409).json({ error: "Item code already exists" });
      return;
    }
    updates.itemCode = normalizedCode;
  }

  if (updates.categoryId !== undefined) updates.categoryId = Number(updates.categoryId);
  if (updates.supplierId !== undefined) updates.supplierId = updates.supplierId !== null ? Number(updates.supplierId) : null;
  if (updates.purchasePrice !== undefined) updates.purchasePrice = String(updates.purchasePrice);

  // Recompute status
  const [existing] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Item not found" }); return; }
  const newQty = (updates.currentQuantity !== undefined ? Number(updates.currentQuantity) : existing.currentQuantity);
  const newMin = (updates.minimumStock !== undefined ? Number(updates.minimumStock) : existing.minimumStock);
  updates.status = computeStatus(newQty, newMin);

  const [item] = await db.update(inventoryItemsTable).set(updates).where(eq(inventoryItemsTable.id, id)).returning();
  await createAuditLog(req.user!, "UPDATE", "inventory_items", id, null, updates);
  res.json(await formatItem(item));
});

router.delete("/inventory/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.update(inventoryItemsTable).set({ isDeleted: true }).where(eq(inventoryItemsTable.id, id));
  await createAuditLog(req.user!, "DELETE", "inventory_items", id);
  res.json({ message: "Item deleted" });
});

export default router;
