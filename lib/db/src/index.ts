import path from "node:path";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

for (const envPath of [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "..", "..", "..", ".env"),
]) {
  dotenv.config({ path: envPath });
  if (process.env.DATABASE_URL) {
    break;
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

async function ensureInventorySchemaColumns() {
  const statements = [
    `ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS department_id integer`,
    `ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS store_id integer`,
    `ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS procurement_officer_id integer`,
    `ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS quantity_received integer NOT NULL DEFAULT 0`,
    `ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS quantity_available integer NOT NULL DEFAULT 0`,
    `ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS purchase_date date`,
    `ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS date_received date`,
  ];

  for (const statement of statements) {
    await pool.query(statement);
  }
}

void ensureInventorySchemaColumns().catch((error) => {
  console.error("Failed to ensure inventory schema columns:", error);
});

export * from "./schema";
