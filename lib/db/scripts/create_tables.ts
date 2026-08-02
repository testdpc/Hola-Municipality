import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Azkhy2024@localhost:5432/hmims';
const pool = new Pool({ connectionString: DATABASE_URL });

const statements = [
  `CREATE TABLE IF NOT EXISTS departments (
    id serial PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );`,
  // ... (same statements as root script) - keep concise in file
];

async function run() {
  const client = await pool.connect();
  try {
    for (const s of statements) {
      console.log('Executing:', s.split('\n')[0]);
      await client.query(s);
    }
    console.log('Done.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
