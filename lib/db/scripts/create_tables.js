const { Pool } = require('pg');

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

  `CREATE TABLE IF NOT EXISTS units (
    id serial PRIMARY KEY,
    name text NOT NULL UNIQUE,
    abbreviation text,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS stores (
    id serial PRIMARY KEY,
    store_code text NOT NULL UNIQUE,
    name text NOT NULL,
    location text,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS categories (
    id serial PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS suppliers (
    id serial PRIMARY KEY,
    name text NOT NULL,
    contact_person text,
    phone text,
    email text,
    kra_pin text,
    physical_address text,
    performance_rating numeric(3,1),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    username text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL UNIQUE,
    role text NOT NULL DEFAULT 'department_user',
    department text,
    phone text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS inventory_items (
    id serial PRIMARY KEY,
    item_code text NOT NULL UNIQUE,
    barcode_qr text,
    item_name text NOT NULL,
    category_id integer NOT NULL,
    description text,
    unit_of_measure text NOT NULL,
    current_quantity integer NOT NULL DEFAULT 0,
    minimum_stock integer NOT NULL DEFAULT 0,
    maximum_stock integer NOT NULL DEFAULT 1000,
    reorder_level integer NOT NULL DEFAULT 10,
    shelf_bin_location text,
    purchase_price numeric(15,2) NOT NULL DEFAULT 0,
    supplier_id integer,
    date_received date,
    expiry_date date,
    status text NOT NULL DEFAULT 'available',
    is_deleted boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS purchase_orders (
    id serial PRIMARY KEY,
    lpo_number text NOT NULL UNIQUE,
    supplier_id integer NOT NULL,
    department text NOT NULL,
    requested_by_id integer,
    approved_by_id integer,
    status text NOT NULL DEFAULT 'draft',
    total_amount numeric(15,2) NOT NULL DEFAULT 0,
    notes text,
    rejection_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS purchase_order_items (
    id serial PRIMARY KEY,
    purchase_order_id integer NOT NULL,
    inventory_item_id integer,
    item_name text NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    total_price numeric(15,2) NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS goods_received_notes (
    id serial PRIMARY KEY,
    grn_number text NOT NULL UNIQUE,
    purchase_order_id integer,
    supplier_id integer NOT NULL,
    delivery_note_number text,
    date_received date NOT NULL,
    receiving_officer_id integer NOT NULL,
    inspection_status text NOT NULL DEFAULT 'pending',
    status text NOT NULL DEFAULT 'draft',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS grn_items (
    id serial PRIMARY KEY,
    grn_id integer NOT NULL,
    inventory_item_id integer NOT NULL,
    item_name text NOT NULL,
    quantity_ordered integer NOT NULL,
    quantity_received integer NOT NULL,
    unit_price numeric(15,2) NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS notifications (
    id serial PRIMARY KEY,
    user_id integer,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    related_id integer,
    created_at timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id serial PRIMARY KEY,
    user_id integer NOT NULL,
    user_name text NOT NULL,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id integer,
    old_values text,
    new_values text,
    ip_address text,
    created_at timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS stock_issues (
    id serial PRIMARY KEY,
    request_number text NOT NULL UNIQUE,
    department text NOT NULL,
    requested_by_id integer NOT NULL,
    approved_by_id integer,
    issued_by_id integer,
    status text NOT NULL DEFAULT 'pending',
    issue_date date NOT NULL,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS stock_issue_items (
    id serial PRIMARY KEY,
    stock_issue_id integer NOT NULL,
    inventory_item_id integer NOT NULL,
    item_name text NOT NULL,
    quantity integer NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS stock_returns (
    id serial PRIMARY KEY,
    return_number text NOT NULL UNIQUE,
    inventory_item_id integer NOT NULL,
    quantity integer NOT NULL,
    condition text NOT NULL DEFAULT 'good',
    reason text NOT NULL,
    storekeeper_id integer NOT NULL,
    return_date date NOT NULL,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS stock_adjustments (
    id serial PRIMARY KEY,
    adjustment_number text NOT NULL UNIQUE,
    inventory_item_id integer NOT NULL,
    adjustment_type text NOT NULL,
    quantity_before integer NOT NULL,
    quantity_after integer NOT NULL,
    reason text NOT NULL,
    adjusted_by_id integer NOT NULL,
    adjustment_date date NOT NULL,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS stock_takings (
    id serial PRIMARY KEY,
    session_number text NOT NULL UNIQUE,
    conducted_by_id integer NOT NULL,
    status text NOT NULL DEFAULT 'in_progress',
    start_date date NOT NULL,
    end_date date,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS stock_taking_items (
    id serial PRIMARY KEY,
    stock_taking_id integer NOT NULL,
    inventory_item_id integer NOT NULL,
    item_name text NOT NULL,
    system_quantity integer NOT NULL,
    physical_quantity integer NOT NULL,
    variance integer NOT NULL DEFAULT 0,
    notes text
  );`,
];

(async function run(){
  const client = await pool.connect();
  try{
    for(const s of statements){
      console.log('Executing:', s.split('\n')[0]);
      await client.query(s);
    }
    console.log('Tables created.');
  }catch(e){
    console.error(e);
    process.exit(1);
  }finally{
    client.release();
    await pool.end();
  }
})();
