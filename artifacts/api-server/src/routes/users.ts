import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { createAuditLog } from "../lib/audit";

const router: IRouter = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    department: u.department,
    phone: u.phone,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  };
}

router.get("/users", requireAuth, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.fullName);
  res.json(users.map(formatUser));
});

router.post("/users", requireAuth, async (req, res): Promise<void> => {
  const { username, fullName, email, role, department, phone, password } = req.body;
  if (!username || !fullName || !email || !role || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ username, fullName, email, role, department, phone, passwordHash }).returning();
  await createAuditLog(req.user!, "CREATE", "users", user.id, null, { username, fullName, email, role });
  res.status(201).json(formatUser(user));
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(user));
});

router.patch("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { fullName, email, role, department, phone, isActive, password } = req.body;
  const updates: Record<string, unknown> = {};
  if (fullName !== undefined) updates.fullName = fullName;
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;
  if (department !== undefined) updates.department = department;
  if (phone !== undefined) updates.phone = phone;
  if (isActive !== undefined) updates.isActive = isActive;
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  await createAuditLog(req.user!, "UPDATE", "users", id, null, updates);
  res.json(formatUser(user));
});

router.delete("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [user] = await db.update(usersTable).set({ isActive: false }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  await createAuditLog(req.user!, "DEACTIVATE", "users", id);
  res.json({ message: "User deactivated" });
});

export default router;
