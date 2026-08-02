import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, departmentsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { createAuditLog } from "../lib/audit";

const router: IRouter = Router();

function formatDepartment(dept: typeof departmentsTable.$inferSelect) {
  return {
    id: dept.id,
    name: dept.name,
    description: dept.description,
    isActive: dept.isActive,
    createdAt: dept.createdAt.toISOString(),
    updatedAt: dept.updatedAt.toISOString(),
  };
}

router.get("/departments", requireAuth, async (_req, res): Promise<void> => {
  const departments = await db.select().from(departmentsTable).orderBy(departmentsTable.name);
  res.json(departments.map(formatDepartment));
});

router.post("/departments", requireAuth, async (req, res): Promise<void> => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  const [existing] = await db.select().from(departmentsTable).where(eq(departmentsTable.name, name));
  if (existing) {
    res.status(409).json({ error: "Department name already exists" });
    return;
  }

  const [department] = await db.insert(departmentsTable).values({ name, description }).returning();
  await createAuditLog(req.user!, "CREATE", "departments", department.id, null, { name });
  res.status(201).json(formatDepartment(department));
});

router.get("/departments/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [department] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, id));
  if (!department) {
    res.status(404).json({ error: "Department not found" });
    return;
  }
  res.json(formatDepartment(department));
});

router.patch("/departments/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, description, isActive } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (isActive !== undefined) updates.isActive = isActive;

  if (name !== undefined) {
    const [existing] = await db
      .select()
      .from(departmentsTable)
      .where(and(eq(departmentsTable.name, name), sql`${departmentsTable.id} != ${id}`));
    if (existing) {
      res.status(409).json({ error: "Department name already exists" });
      return;
    }
  }

  const [department] = await db.update(departmentsTable).set(updates).where(eq(departmentsTable.id, id)).returning();
  if (!department) {
    res.status(404).json({ error: "Department not found" });
    return;
  }
  await createAuditLog(req.user!, "UPDATE", "departments", id, null, updates);
  res.json(formatDepartment(department));
});

router.delete("/departments/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [department] = await db.update(departmentsTable).set({ isActive: false }).where(eq(departmentsTable.id, id)).returning();
  if (!department) {
    res.status(404).json({ error: "Department not found" });
    return;
  }
  await createAuditLog(req.user!, "DELETE", "departments", id);
  res.json({ message: "Department deactivated" });
});

export default router;
