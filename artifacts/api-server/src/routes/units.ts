import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, unitsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { createAuditLog } from "../lib/audit";

const router: IRouter = Router();

function formatUnit(unit: typeof unitsTable.$inferSelect) {
  return {
    id: unit.id,
    name: unit.name,
    abbreviation: unit.abbreviation,
    description: unit.description,
    isActive: unit.isActive,
    createdAt: unit.createdAt.toISOString(),
    updatedAt: unit.updatedAt.toISOString(),
  };
}

router.get("/units", requireAuth, async (_req, res): Promise<void> => {
  const units = await db.select().from(unitsTable).orderBy(unitsTable.name);
  res.json(units.map(formatUnit));
});

router.post("/units", requireAuth, async (req, res): Promise<void> => {
  const { name, abbreviation, description } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  const [existing] = await db.select().from(unitsTable).where(eq(unitsTable.name, name));
  if (existing) {
    res.status(409).json({ error: "Unit name already exists" });
    return;
  }

  const [unit] = await db.insert(unitsTable).values({ name, abbreviation, description }).returning();
  await createAuditLog(req.user!, "CREATE", "units", unit.id, null, { name });
  res.status(201).json(formatUnit(unit));
});

router.get("/units/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, id));
  if (!unit) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }
  res.json(formatUnit(unit));
});

router.patch("/units/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, abbreviation, description, isActive } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (abbreviation !== undefined) updates.abbreviation = abbreviation;
  if (description !== undefined) updates.description = description;
  if (isActive !== undefined) updates.isActive = isActive;

  if (name !== undefined) {
    const [existing] = await db
      .select()
      .from(unitsTable)
      .where(and(eq(unitsTable.name, name), sql`${unitsTable.id} != ${id}`));
    if (existing) {
      res.status(409).json({ error: "Unit name already exists" });
      return;
    }
  }

  const [unit] = await db.update(unitsTable).set(updates).where(eq(unitsTable.id, id)).returning();
  if (!unit) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }
  await createAuditLog(req.user!, "UPDATE", "units", id, null, updates);
  res.json(formatUnit(unit));
});

router.delete("/units/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [unit] = await db.delete(unitsTable).where(eq(unitsTable.id, id)).returning();
  if (!unit) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }
  await createAuditLog(req.user!, "DELETE", "units", id);
  res.json({ message: "Unit deleted" });
});

export default router;
