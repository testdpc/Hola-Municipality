const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Azkhy2024@localhost:5432/hmims';
const pool = new Pool({ connectionString: DATABASE_URL });

const tables = [
  'departments',
  'units',
  'categories',
  'stores',
  'suppliers',
  'users',
  'inventory_items',
  'purchase_orders',
  'purchase_order_items',
  'goods_received_notes',
  'grn_items',
  'notifications',
  'audit_logs',
  'stock_issues',
  'stock_issue_items',
  'stock_returns',
  'stock_adjustments',
  'stock_takings',
  'stock_taking_items',
];

(async function run(){
  const client = await pool.connect();
  try{
    const result = {};
    for(const t of tables){
      const r = await client.query(`SELECT count(*)::int as cnt FROM ${t}`);
      result[t] = r.rows[0].cnt;
    }
    console.log(JSON.stringify(result, null, 2));
  }catch(e){
    console.error(e);
    process.exitCode = 1;
  }finally{
    client.release();
    await pool.end();
  }
})();
