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

export * from "./schema";
