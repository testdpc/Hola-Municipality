import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, storesTable, inventoryItemsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { createAuditLog } from "../lib/audit";

const router: IRouter = Router();

function formatStore(store: typeof storesTable.$inferSelect) {
  return {
    id: store.id,
    storeCode: store.storeCode,
    name: store.name,
    location: store.location,
    description: store.description,
    isActive: store.isActive,
    createdAt: store.createdAt.toISOString(),
    updatedAt: store.updatedAt.toISOString(),
  };
}

router.get("/stores", requireAuth, async (_req, res): Promise<void> => {
  const stores = await db.select().from(storesTable).orderBy(storesTable.name);
  res.json(stores.map(formatStore));
});

router.post("/stores", requireAuth, async (req, res): Promise<void> => {
  const { storeCode, name, location, description } = req.body;
  if (!storeCode || !name) {
    res.status(400).json({ error: "storeCode and name are required" });
    return;
  }

  const [existing] = await db.select().from(storesTable).where(eq(storesTable.storeCode, storeCode));
  if (existing) {
    res.status(409).json({ error: "Store code already exists" });
    return;
  }

  const [store] = await db.insert(storesTable).values({ storeCode, name, location, description }).returning();
  await createAuditLog(req.user!, "CREATE", "stores", store.id, null, { storeCode, name });
  res.status(201).json(formatStore(store));
});

router.get("/stores/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [store] = await db.select().from(storesTable).where(eq(storesTable.id, id));
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }
  res.json(formatStore(store));
});

router.patch("/stores/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { storeCode, name, location, description, isActive } = req.body;
  const updates: Record<string, unknown> = {};
  if (storeCode !== undefined) updates.storeCode = storeCode;
  if (name !== undefined) updates.name = name;
  if (location !== undefined) updates.location = location;
  if (description !== undefined) updates.description = description;
  if (isActive !== undefined) updates.isActive = isActive;

  if (storeCode !== undefined) {
    const [existing] = await db
      .select()
      .from(storesTable)
      .where(and(eq(storesTable.storeCode, storeCode), sql`${storesTable.id} != ${id}`));
    if (existing) {
      res.status(409).json({ error: "Store code already exists" });
      return;
    }
  }

  const [store] = await db.update(storesTable).set(updates).where(eq(storesTable.id, id)).returning();
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }
  await createAuditLog(req.user!, "UPDATE", "stores", id, null, updates);
  res.json(formatStore(store));
});

router.delete("/stores/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [referencedItem] = await db.select({ id: inventoryItemsTable.id }).from(inventoryItemsTable).where(eq(inventoryItemsTable.storeId, id)).limit(1);
  if (referencedItem) {
    res.status(409).json({ error: "Cannot delete because this record is currently in use." });
    return;
  }

  const [store] = await db.delete(storesTable).where(eq(storesTable.id, id)).returning();
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }
  await createAuditLog(req.user!, "DELETE", "stores", id);
  res.json({ message: "Store deleted" });
});

export default router;
