import { Router, type IRouter } from "express";
import { db, departmentsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/departments", requireAuth, async (_req, res): Promise<void> => {
  const depts = await db.select().from(departmentsTable).orderBy(departmentsTable.name);
  res.json(depts.map(d => ({ ...d, createdAt: d.createdAt.toISOString() })));
});

export default router;
