import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, stockIssuesTable, stockIssueItemsTable, usersTable, inventoryItemsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { createAuditLog } from "../lib/audit";

const router: IRouter = Router();

async function formatIssue(issue: typeof stockIssuesTable.$inferSelect) {
  const items = await db.select().from(stockIssueItemsTable).where(eq(stockIssueItemsTable.stockIssueId, issue.id));
  const [reqBy] = issue.requestedById ? await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, issue.requestedById)) : [null];
  const [appBy] = issue.approvedById ? await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, issue.approvedById)) : [null];
  const [issBy] = issue.issuedById ? await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, issue.issuedById)) : [null];
  return {
    id: issue.id,
    requestNumber: issue.requestNumber,
    department: issue.department,
    requestedById: issue.requestedById,
    requestedByName: reqBy?.fullName || null,
    approvedById: issue.approvedById,
    approvedByName: appBy?.fullName || null,
    issuedById: issue.issuedById,
    issuedByName: issBy?.fullName || null,
    status: issue.status,
    issueDate: issue.issueDate,
    items,
    notes: issue.notes,
    createdAt: issue.createdAt.toISOString(),
  };
}

router.get("/stock-issues", requireAuth, async (_req, res): Promise<void> => {
  const issues = await db.select().from(stockIssuesTable).orderBy(stockIssuesTable.createdAt);
  const result = await Promise.all(issues.map(formatIssue));
  res.json(result);
});

router.post("/stock-issues", requireAuth, async (req, res): Promise<void> => {
  const { department, requestedById, issueDate, notes, items } = req.body;
  if (!department || !requestedById || !issueDate) {
    res.status(400).json({ error: "department, requestedById, issueDate required" });
    return;
  }
  const count = await db.select().from(stockIssuesTable);
  const requestNumber = `SIR-${new Date().getFullYear()}-${String(count.length + 1).padStart(5, "0")}`;

  const [issue] = await db.insert(stockIssuesTable).values({
    requestNumber, department, requestedById: Number(requestedById), issueDate, status: "pending", notes,
  }).returning();

  if (items?.length) {
    await db.insert(stockIssueItemsTable).values(items.map((i: { inventoryItemId: number; itemName: string; quantity: number }) => ({
      stockIssueId: issue.id,
      inventoryItemId: Number(i.inventoryItemId),
      itemName: i.itemName,
      quantity: Number(i.quantity),
    })));
  }
  await createAuditLog(req.user!, "CREATE", "stock_issues", issue.id, null, { requestNumber });
  res.status(201).json(await formatIssue(issue));
});

router.get("/stock-issues/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [issue] = await db.select().from(stockIssuesTable).where(eq(stockIssuesTable.id, id));
  if (!issue) { res.status(404).json({ error: "Stock issue not found" }); return; }
  res.json(await formatIssue(issue));
});

router.post("/stock-issues/:id/approve", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [issue] = await db.select().from(stockIssuesTable).where(eq(stockIssuesTable.id, id));
  if (!issue) { res.status(404).json({ error: "Not found" }); return; }

  // Deduct stock
  const items = await db.select().from(stockIssueItemsTable).where(eq(stockIssueItemsTable.stockIssueId, id));
  for (const item of items) {
    const [inv] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, item.inventoryItemId));
    if (inv) {
      const newQty = Math.max(0, inv.currentQuantity - item.quantity);
      const status = newQty <= 0 ? "out_of_stock" : newQty <= inv.minimumStock ? "low_stock" : "available";
      await db.update(inventoryItemsTable).set({ currentQuantity: newQty, status }).where(eq(inventoryItemsTable.id, inv.id));
    }
  }

  const [updated] = await db.update(stockIssuesTable).set({ status: "issued", approvedById: req.user!.userId, issuedById: req.user!.userId }).where(eq(stockIssuesTable.id, id)).returning();
  await createAuditLog(req.user!, "APPROVE_ISSUE", "stock_issues", id);
  res.json(await formatIssue(updated));
});

export default router;
