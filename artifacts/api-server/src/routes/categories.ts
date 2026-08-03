import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, categoriesTable, inventoryItemsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { createAuditLog } from "../lib/audit";

const router: IRouter = Router();

router.get("/categories", requireAuth, async (_req, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  res.json(cats.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })));
});

router.post("/categories", requireAuth, async (req, res): Promise<void> => {
  const { name, description } = req.body;
  if (!name) { res.status(400).json({ error: "Name is required" }); return; }
  const [cat] = await db.insert(categoriesTable).values({ name, description }).returning();
  await createAuditLog(req.user!, "CREATE", "categories", cat.id, null, { name });
  res.status(201).json({ ...cat, createdAt: cat.createdAt.toISOString() });
});

router.get("/categories/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
  if (!cat) { res.status(404).json({ error: "Category not found" }); return; }
  res.json({ ...cat, createdAt: cat.createdAt.toISOString() });
});

router.patch("/categories/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, description } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  const [cat] = await db.update(categoriesTable).set(updates).where(eq(categoriesTable.id, id)).returning();
  if (!cat) { res.status(404).json({ error: "Category not found" }); return; }
  await createAuditLog(req.user!, "UPDATE", "categories", id, null, updates);
  res.json({ ...cat, createdAt: cat.createdAt.toISOString() });
});

router.delete("/categories/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [referencedItem] = await db.select({ id: inventoryItemsTable.id }).from(inventoryItemsTable).where(eq(inventoryItemsTable.categoryId, id)).limit(1);
  if (referencedItem) {
    res.status(409).json({ error: "Cannot delete because this record is currently in use." });
    return;
  }

  const [category] = await db.delete(categoriesTable).where(eq(categoriesTable.id, id)).returning();
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  await createAuditLog(req.user!, "DELETE", "categories", id);
  res.json({ message: "Category deleted" });
});

export default router;
