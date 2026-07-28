import { pgTable, serial, text, timestamp, integer, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const goodsReceivedNotesTable = pgTable("goods_received_notes", {
  id: serial("id").primaryKey(),
  grnNumber: text("grn_number").notNull().unique(),
  purchaseOrderId: integer("purchase_order_id"),
  supplierId: integer("supplier_id").notNull(),
  deliveryNoteNumber: text("delivery_note_number"),
  dateReceived: date("date_received", { mode: "string" }).notNull(),
  receivingOfficerId: integer("receiving_officer_id").notNull(),
  inspectionStatus: text("inspection_status").notNull().default("pending"),
  status: text("status").notNull().default("draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const grnItemsTable = pgTable("grn_items", {
  id: serial("id").primaryKey(),
  grnId: integer("grn_id").notNull(),
  inventoryItemId: integer("inventory_item_id").notNull(),
  itemName: text("item_name").notNull(),
  quantityOrdered: integer("quantity_ordered").notNull(),
  quantityReceived: integer("quantity_received").notNull(),
  unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull(),
});

export const insertGRNSchema = createInsertSchema(goodsReceivedNotesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGRNItemSchema = createInsertSchema(grnItemsTable).omit({ id: true });
export type InsertGRN = z.infer<typeof insertGRNSchema>;
export type GoodsReceivedNote = typeof goodsReceivedNotesTable.$inferSelect;
export type GRNItem = typeof grnItemsTable.$inferSelect;
