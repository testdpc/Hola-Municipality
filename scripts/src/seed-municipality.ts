import { db } from "../../lib/db/src/index.ts";
import {
  departmentsTable,
  categoriesTable,
} from "../../lib/db/src/schema/index.ts";

const departments = [
  "Administration",
  "Finance",
  "Procurement",
  "Stores",
  "Human Resource",
  "Public Health",
  "Environment",
  "Water & Sanitation",
  "Roads & Public Works",
  "Housing",
  "Physical Planning",
  "ICT",
  "Revenue",
  "Enforcement",
  "Fire & Disaster",
  "Social Services",
  "Youth & Sports",
  "Agriculture",
  "Livestock",
  "Fisheries",
  "Lands",
  "Legal",
  "Governor/Mayor Office",
  "Clerk Office",
  "Registry",
  "Customer Care",
];

const categories = [
  "Office Stationery",
  "ICT Equipment",
  "Computer Accessories",
  "Networking Equipment",
  "Printers & Toners",
  "Furniture",
  "Electrical Materials",
  "Plumbing Materials",
  "Building Materials",
  "Cleaning Supplies",
  "PPE",
  "Medical Supplies",
  "Laboratory Supplies",
  "Vehicle Spare Parts",
  "Tyres & Tubes",
  "Fuel & Lubricants",
  "Water & Sewer Materials",
  "Road Maintenance Materials",
  "Signage",
  "Fire Safety Equipment",
  "Tools & Hardware",
  "Kitchen Supplies",
  "Garden Equipment",
  "Uniforms",
  "Security Equipment",
  "Consumables",
  "Assets",
  "General Stores",
];

async function seed() {
  console.log("Seeding municipality departments...");

  await db
    .insert(departmentsTable)
    .values(
      departments.map((name) => ({
        name,
        description: "Official municipality department",
      })),
    )
    .onConflictDoNothing();

  console.log("Seeding inventory categories...");

  await db
    .insert(categoriesTable)
    .values(
      categories.map((name) => ({
        name,
        description: "Permanent municipality inventory category",
      })),
    )
    .onConflictDoNothing();

  console.log("✅ Municipality seed completed successfully.");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
