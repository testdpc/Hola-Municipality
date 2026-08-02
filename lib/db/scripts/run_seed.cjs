const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Azkhy2024@localhost:5432/hmims';
const pool = new Pool({ connectionString: DATABASE_URL });

const departments = [
  ['Procurement', 'Procurement and purchasing department'],
  ['Stores', 'Central stores and warehouse management'],
  ['Finance', 'Finance and accounts department'],
  ['Health', 'Health services department'],
  ['Logistics', 'Supply chain and fleet coordination'],
  ['Quality Assurance', 'Stock quality and compliance checks'],
  ['IT Support', 'Systems support and infrastructure'],
];

const units = [
  ['Pieces', 'pcs', 'Individual pieces or units'],
  ['Kilogram', 'kg', 'Weight in kilograms'],
  ['Liter', 'L', 'Volume in liters'],
  ['Box', 'box', 'Multiple items packaged together'],
  ['Meter', 'm', 'Length measurement in meters'],
  ['Pack', 'pkg', 'Packaged grouping'],
  ['Bundle', 'bdl', 'Bundled collection of items'],
  ['Sheet', 'sh', 'Single sheet or page'],
  ['Roll', 'roll', 'Rolled material quantity'],
];

const categories = [
  ['Medical Supplies', 'Pharmaceuticals and clinic consumables'],
  ['Office Supplies', 'Stationery, printing and office equipment'],
  ['Vehicle Parts', 'Automotive spare parts and fleet maintenance items'],
  ['Construction Materials', 'Cement, timber, iron sheets and civil works supplies'],
  ['Sanitation Equipment', 'Cleaning products, hygiene kits and protective gear'],
  ['IT & Electronics', 'Computers, network devices and peripherals'],
  ['Electrical', 'Cables, lighting, and power maintenance items'],
  ['Waterworks', 'Pipes, fittings, pumps and water treatment supplies'],
  ['Safety Equipment', 'Personal protective equipment and fire safety supplies'],
];

const stores = [
  ['NBO', 'Nairobi County Warehouse', 'Nairobi County', 'Primary central store in Nairobi County'],
  ['MSA', 'Mombasa County Depot', 'Mombasa County', 'Coastal region store for Mombasa and nearby operations'],
  ['KSM', 'Kisumu County Facility', 'Kisumu County', 'Western Kenya store serving Kisumu and surrounding counties'],
  ['NKR', 'Nakuru County Distribution Centre', 'Nakuru County', 'Rift Valley hub for regional inventory distribution'],
  ['MRE', 'Meru County Store', 'Meru County', 'Eastern Kenya store for county-level stock'],
  ['MKU', 'Machakos County Store', 'Machakos County', 'Nairobi metro support store in Machakos County'],
  ['KBU', 'Kiambu County Store', 'Kiambu County', 'Inventory and supply point for Kiambu County'],
  ['USH', 'Uasin Gishu County Store', 'Uasin Gishu County', 'Western Kenya agricultural supply and logistics store'],
  ['ELD', 'Eldoret County Store', 'Uasin Gishu County', 'Regional distribution store near Eldoret'],
  ['THK', 'Thika County Store', 'Kiambu County', 'Industrial supply store serving Thika and nearby towns'],
];

async function upsertMany(client, query, paramsArray) {
  for (const params of paramsArray) {
    await client.query(query, params);
  }
}

async function run() {
  const client = await pool.connect();
  try {
    console.log('Seeding departments...');
    await upsertMany(
      client,
      `INSERT INTO departments(name, description) VALUES($1,$2) ON CONFLICT (name) DO NOTHING`,
      departments,
    );

    console.log('Seeding units...');
    await upsertMany(
      client,
      `INSERT INTO units(name, abbreviation, description) VALUES($1,$2,$3) ON CONFLICT (name) DO NOTHING`,
      units,
    );

    console.log('Seeding categories...');
    await upsertMany(
      client,
      `INSERT INTO categories(name, description) VALUES($1,$2) ON CONFLICT (name) DO NOTHING`,
      categories,
    );

    console.log('Seeding stores...');
    await upsertMany(
      client,
      `INSERT INTO stores(store_code, name, location, description) VALUES($1,$2,$3,$4) ON CONFLICT (store_code) DO NOTHING`,
      stores,
    );

    console.log('Master data seed complete.');
  } catch (err) {
    console.error('Seed error:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
