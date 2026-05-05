import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../utils/db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cliender_jwt_s3cr3t_2026';

// Hardcoded users for Docker (better-sqlite3 incompatible with Alpine)
const TEMP_USERS = {
  'nicolas@cliender.com': {
    id: 1,
    name: 'Nicolas',
    email: 'nicolas@cliender.com',
    password_hash: '$2b$10$LPbexiipPZ3yl2Ng3FH.neVlYQe2qLStr9W0tlsAtAKcztOLAWXg.',
    role: 'admin'
  },
  'toni@cliender.com': {
    id: 2,
    name: 'Toni',
    email: 'toni@cliender.com',
    password_hash: '$2b$10$keEcNXsGl/rJjIo4xhwXr.QJtSIiXo.mCTyvzo9k53WChqAKL.gQS',
    role: 'admin'
  },
  'sara@cliender.com': {
    id: 3,
    name: 'Sara',
    email: 'sara@cliender.com',
    password_hash: '$2b$10$jBgLkA0fmg.3f1kaPJNWt.p8fifmCz6E6Y8jDRZUVXYrsBodHpXTi',
    role: 'admin'
  },
  'pablo@cliender.com': {
    id: 4,
    name: 'Pablo',
    email: 'pablo@cliender.com',
    password_hash: '$2b$10$kM4sTYuqBhRMIUtNhZe5cO3wMKbpNFjPusuApUuQKNTXXx50zVo32',
    role: 'admin'
  }
};

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const user = TEMP_USERS[email.toLowerCase()];
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

// GET /api/auth/me  (verify token)
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const user = { id: payload.userId, name: payload.name, email: payload.email, role: payload.role };
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;
export { JWT_SECRET };
