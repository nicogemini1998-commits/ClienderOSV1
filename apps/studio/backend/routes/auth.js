import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../utils/db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cliender_jwt_s3cr3t_2026';

// ─── Hash pending users on first request ──────────────────────
function ensureHashed() {
  const pending = db.prepare(`SELECT * FROM users WHERE password_hash LIKE 'PENDING:%'`).all();
  if (pending.length === 0) return;
  const update = db.prepare(`UPDATE users SET password_hash=? WHERE id=?`);
  const hashMany = db.transaction((users) => {
    for (const u of users) {
      const plain = u.password_hash.replace('PENDING:', '');
      const hash = bcrypt.hashSync(plain, 10);
      update.run(hash, u.id);
    }
  });
  hashMany(pending);
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  ensureHashed();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const token = jwt.sign(
    { userId: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(payload.userId);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// GET /api/auth/users  (admin only — for user management)
router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY role, name').all();
  res.json(users);
});

export default router;
export { JWT_SECRET };

// Hardcoded users (temporary workaround for Docker Alpine better-sqlite3 issue)
const TEMP_USERS = {
  'admin@studio.com': {
    id: 1,
    name: 'Admin',
    email: 'admin@studio.com',
    password_hash: '$2b$10$LPbexiipPZ3yl2Ng3FH.neVlYQe2qLStr9W0tlsAtAKcztOLAWXg.',
    role: 'admin'
  }
};

// Override login to use hardcoded users as fallback
const originalLogin = router.stack.find(r => r.route?.path === '/login' && r.route?.methods?.post);
if (originalLogin) {
  originalLogin.handle = function(req, res) {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = TEMP_USERS[email.toLowerCase()] || db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  };
}
