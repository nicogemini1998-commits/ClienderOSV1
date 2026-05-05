import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'cliender-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cliender',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Initialize tables
await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    sector TEXT,
    website TEXT,
    ghl_id TEXT,
    notes TEXT,
    brand_description TEXT,
    tone TEXT,
    brand_colors TEXT,
    target_audience TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS content_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    nodes TEXT NOT NULL DEFAULT '[]',
    edges TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS gallery_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    client_id INTEGER,
    url TEXT NOT NULL,
    type TEXT DEFAULT 'image',
    prompt TEXT,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS photography_styles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    prompt_prefix TEXT NOT NULL,
    emoji TEXT DEFAULT '🎨',
    is_predefined INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

export default pool;
export const query = (text, params) => pool.query(text, params);
