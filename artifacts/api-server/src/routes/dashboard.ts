import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, inventoryItemsTable, stockIssuesTable, stockIssueItemsTable, goodsReceivedNotesTable, grnItemsTable, purchaseOrdersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  const allItems = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.isDeleted, false));
  const totalItems = allItems.length;
  const totalValue = allItems.reduce((sum, i) => sum + parseFloat(i.purchasePrice) * i.currentQuantity, 0);
  const lowStockCount = allItems.filter(i => i.status === "low_stock").length;
  const outOfStockCount = allItems.filter(i => i.status === "out_of_stock").length;

  const pendingOrders = await db.select().from(purchaseOrdersTable).where(sql`${purchaseOrdersTable.status} IN ('pending_approval', 'draft')`);
  const pendingRequisitions = pendingOrders.length;

  const pendingIssues = await db.select().from(stockIssuesTable).where(eq(stockIssuesTable.status, "pending"));
  const totalPending = pendingRequisitions + pendingIssues.length;

  // Items received today (GRNs posted today)
  const todayGRNs = await db.select().from(goodsReceivedNotesTable).where(eq(goodsReceivedNotesTable.dateReceived, today));
  const itemsReceivedToday = todayGRNs.length;

  // Items issued today
  const todayIssues = await db.select().from(stockIssuesTable).where(and(eq(stockIssuesTable.issueDate, today), eq(stockIssuesTable.status, "issued")));
  const itemsIssuedToday = todayIssues.length;

  res.json({ totalItems, totalValue, lowStockCount, outOfStockCount, pendingRequisitions: totalPending, itemsReceivedToday, itemsIssuedToday });
});

router.get("/dashboard/recent-transactions", requireAuth, async (_req, res): Promise<void> => {
  const issues = await db.select({
    id: stockIssuesTable.id,
    department: stockIssuesTable.department,
    issueDate: stockIssuesTable.issueDate,
    status: stockIssuesTable.status,
  }).from(stockIssuesTable).orderBy(sql`${stockIssuesTable.createdAt} DESC`).limit(5);

  const grns = await db.select({
    id: goodsReceivedNotesTable.id,
    grnNumber: goodsReceivedNotesTable.grnNumber,
    dateReceived: goodsReceivedNotesTable.dateReceived,
    status: goodsReceivedNotesTable.status,
  }).from(goodsReceivedNotesTable).orderBy(sql`${goodsReceivedNotesTable.createdAt} DESC`).limit(5);

  const transactions = [
    ...issues.map(i => ({
      id: i.id,
      type: "issued" as const,
      description: `Stock issued to ${i.department}`,
      quantity: 1,
      user: "Storekeeper",
      timestamp: new Date().toISOString(),
    })),
    ...grns.map(g => ({
      id: g.id + 10000,
      type: "received" as const,
      description: `Goods received: ${g.grnNumber}`,
      quantity: 1,
      user: "Receiving Officer",
      timestamp: new Date().toISOString(),
    })),
  ].slice(0, 10);

  res.json(transactions);
});

router.get("/dashboard/stock-movement-chart", requireAuth, async (_req, res): Promise<void> => {
  const months = [];
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
      .where(sql`${stockIssuesTable.issueDate} >= ${startDate} AND ${stockIssuesTable.issueDate} <= ${endDate} AND ${stockIssuesTable.status} = 'issued'`);

    months.push({ month: monthStr, received: received.length, issued: issued.length });
  }
  res.json(months);
});

export default router;
