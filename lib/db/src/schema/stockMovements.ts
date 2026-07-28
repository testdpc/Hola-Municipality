import { pgTable, serial, text, timestamp, integer, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Stock Issues
export const stockIssuesTable = pgTable("stock_issues", {
  id: serial("id").primaryKey(),
  requestNumber: text("request_number").notNull().unique(),
  department: text("department").notNull(),
  requestedById: integer("requested_by_id").notNull(),
  approvedById: integer("approved_by_id"),
  issuedById: integer("issued_by_id"),
  status: text("status").notNull().default("pending"),
  issueDate: date("issue_date", { mode: "string" }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const stockIssueItemsTable = pgTable("stock_issue_items", {
  id: serial("id").primaryKey(),
  stockIssueId: integer("stock_issue_id").notNull(),
  inventoryItemId: integer("inventory_item_id").notNull(),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull(),
});

// Stock Returns
export const stockReturnsTable = pgTable("stock_returns", {
  id: serial("id").primaryKey(),
  returnNumber: text("return_number").notNull().unique(),
  inventoryItemId: integer("inventory_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  condition: text("condition").notNull().default("good"),
  reason: text("reason").notNull(),
  storekeeperI: integer("storekeeper_id").notNull(),
  returnDate: date("return_date", { mode: "string" }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Stock Adjustments
export const stockAdjustmentsTable = pgTable("stock_adjustments", {
  id: serial("id").primaryKey(),
  adjustmentNumber: text("adjustment_number").notNull().unique(),
  inventoryItemId: integer("inventory_item_id").notNull(),
  adjustmentType: text("adjustment_type").notNull(),
  quantityBefore: integer("quantity_before").notNull(),
  quantityAfter: integer("quantity_after").notNull(),
  reason: text("reason").notNull(),
  adjustedById: integer("adjusted_by_id").notNull(),
  adjustmentDate: date("adjustment_date", { mode: "string" }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Stock Taking
export const stockTakingsTable = pgTable("stock_takings", {
  id: serial("id").primaryKey(),
  sessionNumber: text("session_number").notNull().unique(),
  conductedById: integer("conducted_by_id").notNull(),
  status: text("status").notNull().default("in_progress"),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const stockTakingItemsTable = pgTable("stock_taking_items", {
  id: serial("id").primaryKey(),
  stockTakingId: integer("stock_taking_id").notNull(),
  inventoryItemId: integer("inventory_item_id").notNull(),
  itemName: text("item_name").notNull(),
  systemQuantity: integer("system_quantity").notNull(),
  physicalQuantity: integer("physical_quantity").notNull(),
  variance: integer("variance").notNull().default(0),
  notes: text("notes"),
});

export const insertStockIssueSchema = createInsertSchema(stockIssuesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStockIssueItemSchema = createInsertSchema(stockIssueItemsTable).omit({ id: true });
export const insertStockReturnSchema = createInsertSchema(stockReturnsTable).omit({ id: true, createdAt: true });
export const insertStockAdjustmentSchema = createInsertSchema(stockAdjustmentsTable).omit({ id: true, createdAt: true });
export const insertStockTakingSchema = createInsertSchema(stockTakingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStockTakingItemSchema = createInsertSchema(stockTakingItemsTable).omit({ id: true });

export type StockIssue = typeof stockIssuesTable.$inferSelect;
export type StockReturn = typeof stockReturnsTable.$inferSelect;
export type StockAdjustment = typeof stockAdjustmentsTable.$inferSelect;
export type StockTaking = typeof stockTakingsTable.$inferSelect;
