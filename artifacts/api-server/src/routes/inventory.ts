import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, inventoryItemsTable, categoriesTable, suppliersTable, departmentsTable, storesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { createAuditLog } from "../lib/audit";

const router: IRouter = Router();

function computeStatus(current: number, min: number): string {
  if (current <= 0) return "out_of_stock";
  if (current <= min) return "low_stock";
  return "available";
}

async function generateItemCode() {
  let nextNumber = 1;

  while (true) {
    const candidate = `${String(nextNumber).padStart(7, "0")}`;
    const [exists] = await db.select({ id: inventoryItemsTable.id }).from(inventoryItemsTable).where(eq(inventoryItemsTable.itemCode, candidate)).limit(1);
    if (!exists) {
      return candidate;
    }
    nextNumber += 1;
  }
}

async function formatItem(item: typeof inventoryItemsTable.$inferSelect) {
  const [cat] = item.categoryId
    ? await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, item.categoryId))
    : [null];
  const [sup] = item.supplierId
    ? await db.select({ name: suppliersTable.name }).from(suppliersTable).where(eq(suppliersTable.id, item.supplierId))
    : [null];
  const [dept] = item.departmentId
    ? await db.select({ name: departmentsTable.name }).from(departmentsTable).where(eq(departmentsTable.id, item.departmentId))
    : [null];
  const [store] = item.storeId
    ? await db.select({ name: storesTable.name }).from(storesTable).where(eq(storesTable.id, item.storeId))
    : [null];
  const [procurementOfficer] = item.procurementOfficerId
    ? await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, item.procurementOfficerId))
    : [null];

  const purchaseCost = Number(item.purchasePrice ?? 0);
  return {
    id: item.id,
    itemCode: item.itemCode,
    barcodeQr: item.barcodeQr,
    itemName: item.itemName,
    categoryId: item.categoryId,
    categoryName: cat?.name || null,
    description: item.description,
    unitOfMeasure: item.unitOfMeasure,
    currentQuantity: item.quantityAvailable ?? item.currentQuantity,
    minimumStock: item.minimumStock,
    maximumStock: item.maximumStock,
    reorderLevel: item.reorderLevel,
    shelfBinLocation: item.shelfBinLocation,
    purchasePrice: purchaseCost,
    purchaseCost,
    supplierId: item.supplierId,
    supplierName: sup?.name || null,
    departmentId: item.departmentId,
    departmentName: dept?.name || null,
    storeId: item.storeId,
    storeName: store?.name || null,
    procurementOfficerId: item.procurementOfficerId,
    procurementOfficerName: item.procurementOfficerName ?? (procurementOfficer?.fullName || null),
    procurementOfficerPhone: item.procurementOfficerPhone,
    procurementOfficerEmail: item.procurementOfficerEmail,
    quantityReceived: item.quantityReceived,
    quantityAvailable: item.quantityAvailable ?? item.currentQuantity,
    purchaseDate: item.purchaseDate,
    dateReceived: item.dateReceived ?? item.purchaseDate,
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
  const {
    itemCode,
    barcodeQr,
    itemName,
    categoryId,
    description,
    unitOfMeasure,
    currentQuantity,
    minimumStock,
    maximumStock,
    reorderLevel,
    shelfBinLocation,
    purchasePrice,
    purchaseCost,
    supplierId,
    departmentId,
    storeId,
    procurementOfficerId,
    procurementOfficerName,
    procurementOfficerPhone,
    procurementOfficerEmail,
    quantityReceived,
    quantityAvailable,
    purchaseDate,
    dateReceived,
    expiryDate,
  } = req.body;
  if (!itemName || !categoryId || !unitOfMeasure) {
    res.status(400).json({ error: "itemName, categoryId, and unitOfMeasure are required" });
    return;
  }

  const normalizedItemCode = await generateItemCode();

  const quantityAvailableValue = Number(quantityAvailable ?? currentQuantity ?? 0);
  const procurementOfficerNameValue = typeof procurementOfficerName === "string" ? procurementOfficerName.trim() : null;
  const procurementOfficerPhoneValue = typeof procurementOfficerPhone === "string" ? procurementOfficerPhone.trim() || null : null;
  const procurementOfficerEmailValue = typeof procurementOfficerEmail === "string" ? procurementOfficerEmail.trim() || null : null;
  const quantityReceivedValue = Number(quantityReceived ?? quantityAvailableValue);
  const minStock = Number(minimumStock ?? 0);
  const maxStock = maximumStock === undefined || maximumStock === null || maximumStock === "" ? null : Number(maximumStock);
  const reorderLevelValue = reorderLevel === undefined || reorderLevel === null || reorderLevel === "" ? null : Number(reorderLevel);
  const shelfBinLoc = typeof shelfBinLocation === "string" ? shelfBinLocation.trim() : shelfBinLocation;
  const status = computeStatus(quantityAvailableValue, minStock);
  const purchaseCostValue = Number(purchaseCost ?? purchasePrice ?? 0);

  const [item] = await db.insert(inventoryItemsTable).values({
    itemCode: normalizedItemCode,
    barcodeQr,
    itemName,
    categoryId: Number(categoryId),
    description,
    unitOfMeasure,
    currentQuantity: quantityAvailableValue,
    minimumStock: minStock,
    maximumStock: maxStock ?? 1000,
    reorderLevel: reorderLevelValue ?? 10,
    shelfBinLocation: shelfBinLoc || null,
    purchasePrice: String(purchaseCostValue),
    supplierId: supplierId ? Number(supplierId) : null,
    departmentId: departmentId ? Number(departmentId) : null,
    storeId: storeId ? Number(storeId) : null,
    procurementOfficerId: procurementOfficerId ? Number(procurementOfficerId) : null,
    procurementOfficerName: procurementOfficerNameValue,
    procurementOfficerPhone: procurementOfficerPhoneValue,
    procurementOfficerEmail: procurementOfficerEmailValue,
    quantityReceived: quantityReceivedValue,
    quantityAvailable: quantityAvailableValue,
    purchaseDate,
    dateReceived: dateReceived ?? purchaseDate,
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
  const fields = [
    "itemCode",
    "barcodeQr",
    "itemName",
    "categoryId",
    "description",
    "unitOfMeasure",
    "currentQuantity",
    "minimumStock",
    "maximumStock",
    "reorderLevel",
    "shelfBinLocation",
    "purchasePrice",
    "purchaseCost",
    "supplierId",
    "departmentId",
    "storeId",
    "procurementOfficerId",
    "procurementOfficerName",
    "procurementOfficerPhone",
    "procurementOfficerEmail",
    "quantityReceived",
    "quantityAvailable",
    "purchaseDate",
    "dateReceived",
    "expiryDate",
  ];
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }

  if (updates.itemCode !== undefined) delete updates.itemCode;

  if (updates.categoryId !== undefined) updates.categoryId = Number(updates.categoryId);
  if (updates.supplierId !== undefined) updates.supplierId = updates.supplierId !== null ? Number(updates.supplierId) : null;
  if (updates.departmentId !== undefined) updates.departmentId = updates.departmentId !== null ? Number(updates.departmentId) : null;
  if (updates.storeId !== undefined) updates.storeId = updates.storeId !== null ? Number(updates.storeId) : null;
  if (updates.procurementOfficerId !== undefined) updates.procurementOfficerId = updates.procurementOfficerId !== null ? Number(updates.procurementOfficerId) : null;
  if (updates.procurementOfficerName !== undefined) updates.procurementOfficerName = updates.procurementOfficerName === null || updates.procurementOfficerName === "" ? null : String(updates.procurementOfficerName);
  if (updates.procurementOfficerPhone !== undefined) updates.procurementOfficerPhone = updates.procurementOfficerPhone === null || updates.procurementOfficerPhone === "" ? null : String(updates.procurementOfficerPhone);
  if (updates.procurementOfficerEmail !== undefined) updates.procurementOfficerEmail = updates.procurementOfficerEmail === null || updates.procurementOfficerEmail === "" ? null : String(updates.procurementOfficerEmail);
  if (updates.purchasePrice !== undefined || updates.purchaseCost !== undefined) {
    const purchaseCostValue = updates.purchaseCost !== undefined ? updates.purchaseCost : updates.purchasePrice;
    updates.purchasePrice = String(purchaseCostValue);
    delete updates.purchaseCost;
  }
  if (updates.maximumStock !== undefined) updates.maximumStock = updates.maximumStock === null || updates.maximumStock === "" ? null : Number(updates.maximumStock);
  if (updates.reorderLevel !== undefined) updates.reorderLevel = updates.reorderLevel === null || updates.reorderLevel === "" ? null : Number(updates.reorderLevel);
  if (updates.shelfBinLocation !== undefined) updates.shelfBinLocation = updates.shelfBinLocation === null || updates.shelfBinLocation === "" ? null : String(updates.shelfBinLocation);
  if (updates.quantityReceived !== undefined) updates.quantityReceived = Number(updates.quantityReceived);
  if (updates.quantityAvailable !== undefined) updates.quantityAvailable = Number(updates.quantityAvailable);
  if (updates.purchaseDate !== undefined) updates.purchaseDate = updates.purchaseDate || null;
  if (updates.dateReceived !== undefined) updates.dateReceived = updates.dateReceived || null;

  const [existing] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Item not found" }); return; }
  const newQty = (updates.currentQuantity !== undefined ? Number(updates.currentQuantity) : (updates.quantityAvailable !== undefined ? Number(updates.quantityAvailable) : (existing.quantityAvailable ?? existing.currentQuantity)));
  const newMin = (updates.minimumStock !== undefined ? Number(updates.minimumStock) : existing.minimumStock);
  if (updates.quantityAvailable !== undefined && updates.currentQuantity === undefined) {
    updates.currentQuantity = Number(updates.quantityAvailable);
  }
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
