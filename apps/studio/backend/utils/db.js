import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'cliender.db');

mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS content_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    nodes TEXT NOT NULL DEFAULT '[]',
    edges TEXT NOT NULL DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    agents TEXT NOT NULL DEFAULT '[]',
    input_config TEXT NOT NULL DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    template_id INTEGER,
    status TEXT,
    input TEXT,
    result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS gallery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    client_id INTEGER,
    url TEXT NOT NULL,
    type TEXT DEFAULT 'image',
    prompt TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS photography_styles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    prompt_prefix TEXT NOT NULL,
    emoji TEXT DEFAULT '🎨',
    is_predefined INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrations — add columns if they don't exist yet
const addColumnIfMissing = (table, column, def) => {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
  } catch {}
};

addColumnIfMissing('clients', 'brand_description', 'TEXT');
addColumnIfMissing('clients', 'tone', 'TEXT');
addColumnIfMissing('clients', 'brand_colors', 'TEXT');
addColumnIfMissing('clients', 'target_audience', 'TEXT');
addColumnIfMissing('content_templates', 'client_id', 'INTEGER REFERENCES clients(id) ON DELETE SET NULL');
addColumnIfMissing('users', 'role', "TEXT DEFAULT 'user'");

// Seed predefined photography styles
const existingStyles = db.prepare('SELECT COUNT(*) as c FROM photography_styles WHERE is_predefined = 1').get();
if (existingStyles.c === 0) {
  const insert = db.prepare(`INSERT INTO photography_styles (name, description, prompt_prefix, emoji, is_predefined) VALUES (?, ?, ?, ?, 1)`);
  const seedStyles = db.transaction(() => {
    insert.run('Fotografía editorial', 'Estilo limpio y profesional para marcas', 'editorial photography, clean background, professional lighting, brand photography', '📸');
    insert.run('Dark luxury', 'Fondos oscuros, iluminación dramática', 'dark luxury product photography, dramatic lighting, dark background, premium feel', '🖤');
    insert.run('Lifestyle natural', 'Luz natural, ambiente cotidiano', 'lifestyle photography, natural light, candid, warm tones, authentic', '☀️');
    insert.run('Minimalista', 'Composición simple, mucho espacio negativo', 'minimalist product photography, white background, negative space, simple composition', '⬜');
  });
  seedStyles();
}

export default db;
