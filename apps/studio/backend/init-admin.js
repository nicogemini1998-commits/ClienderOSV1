import db from './utils/db.js';
import { hashSync } from 'bcryptjs';

const adminUser = {
  email: 'admin@studio.com',
  name: 'Admin',
  password_hash: hashSync('Master123', 10)
};

try {
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(adminUser.email);
  if (existing) {
    console.log('✓ Admin ya existe');
    process.exit(0);
  }

  db.prepare(`INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)`).run(
    adminUser.email, 
    adminUser.name, 
    adminUser.password_hash
  );
  console.log('✓ Admin usuario creado: admin@studio.com / Master123');
  process.exit(0);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
