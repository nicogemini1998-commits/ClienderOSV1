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
    style_name TEXT,
    agent TEXT,
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

  CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'custom',
    is_predefined INTEGER DEFAULT 0,
    input_config TEXT NOT NULL DEFAULT '{}',
    agents TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS executions (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    template_id INTEGER REFERENCES templates(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    input TEXT,
    result TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

export default pool;
export const query = (text, params) => pool.query(text, params);

// Seed predefined photography styles if empty
const stylesCount = await pool.query('SELECT COUNT(*) FROM photography_styles WHERE is_predefined = 1');
if (parseInt(stylesCount.rows[0].count) === 0) {
  await pool.query(`
    INSERT INTO photography_styles (name, description, prompt_prefix, emoji, is_predefined) VALUES
    ('Fotografía editorial', 'Estilo limpio y profesional para marcas', 'editorial photography, clean background, professional lighting, brand photography', '📸', 1),
    ('Dark luxury', 'Fondos oscuros, iluminación dramática', 'dark luxury product photography, dramatic lighting, dark background, premium feel', '🖤', 1),
    ('Lifestyle natural', 'Luz natural, ambiente cotidiano', 'lifestyle photography, natural light, candid, warm tones, authentic', '☀️', 1),
    ('Minimalista', 'Composición simple, mucho espacio negativo', 'minimalist product photography, white background, negative space, simple composition', '⬜', 1)
  `);
}
