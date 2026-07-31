import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, inventoryItemsTable, stockIssuesTable, goodsReceivedNotesTable, stockAdjustmentsTable, suppliersTable, purchaseOrdersTable, categoriesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function formatItem(item: typeof inventoryItemsTable.$inferSelect) {
  const [cat] = item.categoryId ? await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, item.categoryId)) : [null];
  const [sup] = item.supplierId ? await db.select({ name: suppliersTable.name }).from(suppliersTable).where(eq(suppliersTable.id, item.supplierId)) : [null];
  return {
    id: item.id, itemCode: item.itemCode, barcodeQr: item.barcodeQr, itemName: item.itemName,
    categoryId: item.categoryId, categoryName: cat?.name || null, description: item.description,
    unitOfMeasure: item.unitOfMeasure, currentQuantity: item.currentQuantity, minimumStock: item.minimumStock,
    maximumStock: item.maximumStock, reorderLevel: item.reorderLevel, shelfBinLocation: item.shelfBinLocation,
    purchasePrice: parseFloat(item.purchasePrice), supplierId: item.supplierId, supplierName: sup?.name || null,
    dateReceived: item.dateReceived, expiryDate: item.expiryDate, status: item.status,
    createdAt: item.createdAt.toISOString(),
  };
}

router.get("/reports/current-stock", requireAuth, async (_req, res): Promise<void> => {
  const items = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.isDeleted, false));
  const result = await Promise.all(items.map(formatItem));
  res.json(result);
});

router.get("/reports/low-stock", requireAuth, async (_req, res): Promise<void> => {
  const items = await db.select().from(inventoryItemsTable)
    .where(and(eq(inventoryItemsTable.isDeleted, false), sql`${inventoryItemsTable.status} IN ('low_stock', 'out_of_stock')`));
  const result = await Promise.all(items.map(formatItem));
  res.json(result);
});

router.get("/reports/department-consumption", requireAuth, async (req, res): Promise<void> => {
  const { from, to } = req.query;
  let issues = await db.select().from(stockIssuesTable).where(eq(stockIssuesTable.status, "issued"));
  if (from) issues = issues.filter(i => i.issueDate >= (from as string));
  if (to) issues = issues.filter(i => i.issueDate <= (to as string));

  const deptMap: Record<string, { department: string; totalIssues: number; totalItems: number }> = {};
  for (const issue of issues) {
    if (!deptMap[issue.department]) deptMap[issue.department] = { department: issue.department, totalIssues: 0, totalItems: 0 };
    deptMap[issue.department].totalIssues++;
    deptMap[issue.department].totalItems++;
  }
  res.json(Object.values(deptMap));
});

router.get("/reports/stock-movement", requireAuth, async (req, res): Promise<void> => {
  const { from, to } = req.query;
  const months: Array<{ month: string; received: number; issued: number; adjusted: number }> = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = d.toLocaleString("default", { month: "short", year: "2-digit" });
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, d.getMonth() + 1, 0).toISOString().split("T")[0];

    const received = await db.select().from(goodsReceivedNotesTable)
      .where(sql`${goodsReceivedNotesTable.dateReceived} >= ${startDate} AND ${goodsReceivedNotesTable.dateReceived} <= ${endDate}`);
    const issued = await db.select().from(stockIssuesTable)
      .where(sql`${stockIssuesTable.issueDate} >= ${startDate} AND ${stockIssuesTable.issueDate} <= ${endDate}`);
    const adjusted = await db.select().from(stockAdjustmentsTable)
      .where(sql`${stockAdjustmentsTable.adjustmentDate} >= ${startDate} AND ${stockAdjustmentsTable.adjustmentDate} <= ${endDate}`);

    months.push({ month: monthStr, received: received.length, issued: issued.length, adjusted: adjusted.length });
  }
  res.json(months);
});

router.get("/reports/inventory-valuation", requireAuth, async (_req, res): Promise<void> => {
  const items = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.isDeleted, false));
  const totalValue = items.reduce((sum, i) => sum + parseFloat(i.purchasePrice) * i.currentQuantity, 0);
  const formatted = await Promise.all(items.map(formatItem));
  res.json({ totalValue, items: formatted });
});

router.get("/reports/supplier", requireAuth, async (_req, res): Promise<void> => {
  const suppliers = await db.select().from(suppliersTable).where(eq(suppliersTable.isActive, true));
  const result = await Promise.all(suppliers.map(async (s) => {
    const pos = await db.select().from(purchaseOrdersTable).where(eq(purchaseOrdersTable.supplierId, s.id));
    const totalValue = pos.reduce((sum, p) => sum + parseFloat(p.totalAmount), 0);
    return {
      supplierId: s.id,
      supplierName: s.name,
      totalOrders: pos.length,
      totalValue,
      performanceRating: s.performanceRating ? parseFloat(s.performanceRating) : null,
    };
  }));
  res.json(result);
});

export default router;
