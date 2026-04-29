import Database from 'better-sqlite3';
import { hashSync } from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'cliender.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const adminUser = {
  email: 'admin@studio.com',
  name: 'Admin',
  password: 'Master123'
};

try {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Check if admin exists
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(adminUser.email);
  if (existing) {
    console.log('✓ Admin user exists');
    process.exit(0);
  }

  // Create admin
  const hash = hashSync(adminUser.password, 10);
  db.prepare(`INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)`).run(
    adminUser.email,
    adminUser.name,
    hash
  );

  console.log(`✓ Admin created: ${adminUser.email} / ${adminUser.password}`);
  process.exit(0);
} catch (err) {
  console.error('✗ Error:', err.message);
  process.exit(1);
} finally {
  db.close();
}
