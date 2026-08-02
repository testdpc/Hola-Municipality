import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { departmentsTable } from "@workspace/db";
import { unitsTable } from "@workspace/db";
import { storesTable } from "@workspace/db";
import { categoriesTable } from "@workspace/db";

async function upsertDepartment(name: string, description?: string) {
  const [existing] = await db.select().from(departmentsTable).where(eq(departmentsTable.name, name));
  if (!existing) {
    await db.insert(departmentsTable).values({ name, description });
  }
}

async function upsertUnit(name: string, abbreviation?: string, description?: string) {
  const [existing] = await db.select().from(unitsTable).where(eq(unitsTable.name, name));
  if (!existing) {
    await db.insert(unitsTable).values({ name, abbreviation, description });
  }
}

async function upsertStore(storeCode: string, name: string, location?: string, description?: string) {
  const [existing] = await db.select().from(storesTable).where(eq(storesTable.storeCode, storeCode));
  if (!existing) {
    await db.insert(storesTable).values({ storeCode, name, location, description });
  }
}

async function upsertCategory(name: string, description?: string) {
  const [existing] = await db.select().from(categoriesTable).where(eq(categoriesTable.name, name));
  if (!existing) {
    await db.insert(categoriesTable).values({ name, description });
  }
}

async function seed() {
  console.log("Seeding master data...");

  await upsertDepartment("Procurement", "Procurement and purchasing department");
  await upsertDepartment("Stores", "Central stores and warehouse management");
  await upsertDepartment("Finance", "Finance and accounts department");
  await upsertDepartment("Health", "Health services department");
  await upsertDepartment("Logistics", "Supply chain and fleet coordination");
  await upsertDepartment("Quality Assurance", "Stock quality and compliance checks");
  await upsertDepartment("IT Support", "Systems support and infrastructure");

  await upsertUnit("Pieces", "pcs", "Individual pieces or units");
  await upsertUnit("Kilogram", "kg", "Weight in kilograms");
  await upsertUnit("Liter", "L", "Volume in liters");
  await upsertUnit("Box", "box", "Multiple items packaged together");
  await upsertUnit("Meter", "m", "Length measurement in meters");
  await upsertUnit("Pack", "pkg", "Packaged grouping");
  await upsertUnit("Bundle", "bdl", "Bundled collection of items");
  await upsertUnit("Sheet", "sh", "Single sheet or page");
  await upsertUnit("Roll", "roll", "Rolled material quantity");

  await upsertCategory("Medical Supplies", "Pharmaceuticals and clinic consumables");
  await upsertCategory("Office Supplies", "Stationery, printing and office equipment");
  await upsertCategory("Vehicle Parts", "Automotive spare parts and fleet maintenance items");
  await upsertCategory("Construction Materials", "Cement, timber, iron sheets and civil works supplies");
  await upsertCategory("Sanitation Equipment", "Cleaning products, hygiene kits and protective gear");
  await upsertCategory("IT & Electronics", "Computers, network devices and peripherals");
  await upsertCategory("Electrical", "Cables, lighting, and power maintenance items");
  await upsertCategory("Waterworks", "Pipes, fittings, pumps and water treatment supplies");
  await upsertCategory("Safety Equipment", "Personal protective equipment and fire safety supplies");

  await upsertStore("NBO", "Nairobi County Warehouse", "Nairobi County", "Primary central store in Nairobi County");
  await upsertStore("MSA", "Mombasa County Depot", "Mombasa County", "Coastal region store for Mombasa and nearby operations");
  await upsertStore("KSM", "Kisumu County Facility", "Kisumu County", "Western Kenya store serving Kisumu and surrounding counties");
  await upsertStore("NKR", "Nakuru County Distribution Centre", "Nakuru County", "Rift Valley hub for regional inventory distribution");
  await upsertStore("MRE", "Meru County Store", "Meru County", "Eastern Kenya store for county-level stock");
  await upsertStore("MKU", "Machakos County Store", "Machakos County", "Nairobi metro support store in Machakos County");
  await upsertStore("KBU", "Kiambu County Store", "Kiambu County", "Inventory and supply point for Kiambu County");
  await upsertStore("USH", "Uasin Gishu County Store", "Uasin Gishu County", "Western Kenya agricultural supply and logistics store");
  await upsertStore("ELD", "Eldoret County Store", "Uasin Gishu County", "Regional distribution store near Eldoret");
  await upsertStore("THK", "Thika County Store", "Kiambu County", "Industrial supply store serving Thika and nearby towns");

  console.log("Master data seed complete.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
