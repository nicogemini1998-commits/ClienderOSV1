import { query } from './utils/db.js';
import { hashSync } from 'bcryptjs';

const users = [
  { email: 'nicolas@cliender.com', name: 'Nicolas', password: 'Master123' },
  { email: 'toni@cliender.com', name: 'Toni', password: 'Cliender123' },
  { email: 'sara@cliender.com', name: 'Sara', password: 'Cliender123' },
  { email: 'pablo@cliender.com', name: 'Pablo', password: 'Cliender123' }
];

try {
  let createdCount = 0;

  for (const user of users) {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [user.email]);
    if (rows.length > 0) {
      console.log(`✓ ${user.name} ya existe`);
      continue;
    }

    const hash = hashSync(user.password, 10);
    await query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3)',
      [user.email, user.name, hash]
    );
    console.log(`✓ Usuario creado: ${user.email} / ${user.password}`);
    createdCount++;
  }

  console.log(`\n✓ ${createdCount} usuarios nuevos creados`);
  process.exit(0);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
