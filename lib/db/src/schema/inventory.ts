import { pgTable, serial, text, boolean, timestamp, integer, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inventoryItemsTable = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  itemCode: text("item_code").notNull().unique(),
  barcodeQr: text("barcode_qr"),
  itemName: text("item_name").notNull(),
  categoryId: integer("category_id").notNull(),
  description: text("description"),
  unitOfMeasure: text("unit_of_measure").notNull(),
  currentQuantity: integer("current_quantity").notNull().default(0),
  minimumStock: integer("minimum_stock").notNull().default(0),
  maximumStock: integer("maximum_stock").notNull().default(1000),
  reorderLevel: integer("reorder_level").notNull().default(10),
  shelfBinLocation: text("shelf_bin_location"),
  purchasePrice: numeric("purchase_price", { precision: 15, scale: 2 }).notNull().default("0"),
  supplierId: integer("supplier_id"),
  dateReceived: date("date_received", { mode: "string" }),
  expiryDate: date("expiry_date", { mode: "string" }),
  status: text("status").notNull().default("available"),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItemsTable.$inferSelect;
