import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "path";

// Load the repository root .env when running from the package directory
dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  // use a relative glob so drizzle-kit can resolve all schema files on all platforms
  schema: ["./src/schema/*.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
