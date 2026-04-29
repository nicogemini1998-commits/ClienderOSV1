import { Router } from 'express';
import db from '../utils/db.js';

const router = Router();

// GET /api/gallery  ?clientId=&type=image|video&userId=
router.get('/', (req, res) => {
  const { clientId, type, userId, limit = 50, offset = 0 } = req.query;
  let sql = `SELECT g.*, u.name as user_name, c.name as client_name
             FROM gallery_items g
             LEFT JOIN users u ON g.user_id = u.id
             LEFT JOIN clients c ON g.client_id = c.id
             WHERE 1=1`;
  const params = [];
  if (clientId) { sql += ' AND g.client_id = ?'; params.push(clientId); }
  if (type)     { sql += ' AND g.type = ?'; params.push(type); }
  if (userId)   { sql += ' AND g.user_id = ?'; params.push(userId); }
  sql += ' ORDER BY g.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const items = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as c FROM gallery_items').get().c;

  res.json({ items: items.map(i => ({ ...i, metadata: JSON.parse(i.metadata || '{}') })), total });
});

// POST /api/gallery  — save generated item
router.post('/', (req, res) => {
  const { user_id, client_id, type = 'image', url, prompt, style_name, agent, metadata } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });

  const result = db.prepare(`
    INSERT INTO gallery_items (user_id, client_id, type, url, prompt, style_name, agent, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user_id || null, client_id || null, type, url, prompt || null, style_name || null, agent || null, JSON.stringify(metadata || {}));

  const item = db.prepare('SELECT * FROM gallery_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...item, metadata: JSON.parse(item.metadata) });
});

// DELETE /api/gallery/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM gallery_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /api/gallery/stats
router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM gallery_items').get().c;
  const images = db.prepare(`SELECT COUNT(*) as c FROM gallery_items WHERE type='image'`).get().c;
  const videos = db.prepare(`SELECT COUNT(*) as c FROM gallery_items WHERE type='video'`).get().c;
  res.json({ total, images, videos });
});

export default router;
