import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, suppliersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { createAuditLog } from "../lib/audit";

const router: IRouter = Router();

function formatSupplier(s: typeof suppliersTable.$inferSelect) {
  return {
    id: s.id,
    name: s.name,
    contactPerson: s.contactPerson,
    phone: s.phone,
    email: s.email,
    kraPin: s.kraPin,
    physicalAddress: s.physicalAddress,
    performanceRating: s.performanceRating ? parseFloat(s.performanceRating) : null,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/suppliers", requireAuth, async (_req, res): Promise<void> => {
  const suppliers = await db.select().from(suppliersTable).orderBy(suppliersTable.name);
  res.json(suppliers.map(formatSupplier));
});

router.post("/suppliers", requireAuth, async (req, res): Promise<void> => {
  const { name, contactPerson, phone, email, kraPin, physicalAddress, performanceRating } = req.body;
  if (!name) { res.status(400).json({ error: "Name is required" }); return; }
  const [sup] = await db.insert(suppliersTable).values({ name, contactPerson, phone, email, kraPin, physicalAddress, performanceRating: performanceRating?.toString() }).returning();
  await createAuditLog(req.user!, "CREATE", "suppliers", sup.id, null, { name });
  res.status(201).json(formatSupplier(sup));
});

router.get("/suppliers/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [sup] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, id));
  if (!sup) { res.status(404).json({ error: "Supplier not found" }); return; }
  res.json(formatSupplier(sup));
});

router.patch("/suppliers/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, contactPerson, phone, email, kraPin, physicalAddress, performanceRating, isActive } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (contactPerson !== undefined) updates.contactPerson = contactPerson;
  if (phone !== undefined) updates.phone = phone;
  if (email !== undefined) updates.email = email;
  if (kraPin !== undefined) updates.kraPin = kraPin;
  if (physicalAddress !== undefined) updates.physicalAddress = physicalAddress;
  if (performanceRating !== undefined) updates.performanceRating = performanceRating?.toString();
  if (isActive !== undefined) updates.isActive = isActive;
  const [sup] = await db.update(suppliersTable).set(updates).where(eq(suppliersTable.id, id)).returning();
  if (!sup) { res.status(404).json({ error: "Supplier not found" }); return; }
  await createAuditLog(req.user!, "UPDATE", "suppliers", id, null, updates);
  res.json(formatSupplier(sup));
});

router.delete("/suppliers/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [sup] = await db.update(suppliersTable).set({ isActive: false }).where(eq(suppliersTable.id, id)).returning();
  if (!sup) { res.status(404).json({ error: "Supplier not found" }); return; }
  await createAuditLog(req.user!, "DELETE", "suppliers", id);
  res.json({ message: "Supplier deactivated" });
});

export default router;
