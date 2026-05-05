import db from './utils/db.js';
import { hashSync } from 'bcryptjs';

const users = [
  { email: 'nicolas@cliender.com', name: 'Nicolas', password: 'Master123' },
  { email: 'toni@cliender.com', name: 'Toni', password: 'Cliender123' },
  { email: 'sara@cliender.com', name: 'Sara', password: 'Cliender123' },
  { email: 'pablo@cliender.com', name: 'Pablo', password: 'Cliender123' }
];

try {
  let createdCount = 0;

  users.forEach(user => {
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(user.email);
    if (existing) {
      console.log(`✓ ${user.name} ya existe`);
      return;
    }

    const hash = hashSync(user.password, 10);
    db.prepare(`INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)`).run(
      user.email,
      user.name,
      hash
    );
    console.log(`✓ Usuario creado: ${user.email} / ${user.password}`);
    createdCount++;
  });

  console.log(`\n✓ ${createdCount} usuarios nuevos creados`);
  process.exit(0);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
