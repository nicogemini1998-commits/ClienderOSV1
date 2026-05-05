import { Router } from 'express';
import { query } from '../utils/db.js';

const router = Router();

// GET /api/gallery/stats  — must be defined before /:id to avoid route conflict
router.get('/stats', async (req, res) => {
  try {
    const { rows: totalRows } = await query('SELECT COUNT(*) as c FROM gallery_items');
    const { rows: imageRows } = await query(`SELECT COUNT(*) as c FROM gallery_items WHERE type='image'`);
    const { rows: videoRows } = await query(`SELECT COUNT(*) as c FROM gallery_items WHERE type='video'`);
    res.json({
      total: Number(totalRows[0].c),
      images: Number(imageRows[0].c),
      videos: Number(videoRows[0].c),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/gallery  ?clientId=&type=image|video&userId=
router.get('/', async (req, res) => {
  const { clientId, type, userId, limit = 50, offset = 0 } = req.query;

  let sql = `SELECT g.*, u.name as user_name, c.name as client_name
             FROM gallery_items g
             LEFT JOIN users u ON g.user_id = u.id
             LEFT JOIN clients c ON g.client_id = c.id
             WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  if (clientId) { sql += ` AND g.client_id = $${paramIndex++}`; params.push(clientId); }
  if (type)     { sql += ` AND g.type = $${paramIndex++}`; params.push(type); }
  if (userId)   { sql += ` AND g.user_id = $${paramIndex++}`; params.push(userId); }
  sql += ` ORDER BY g.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(Number(limit), Number(offset));

  try {
    const { rows: items } = await query(sql, params);
    const { rows: totalRows } = await query('SELECT COUNT(*) as c FROM gallery_items');

    res.json({
      items: items.map(i => ({ ...i, metadata: JSON.parse(i.metadata || '{}') })),
      total: Number(totalRows[0].c),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gallery  — save generated item
router.post('/', async (req, res) => {
  const { user_id, client_id, type = 'image', url, prompt, style_name, agent, metadata } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });

  try {
    const { rows } = await query(
      `INSERT INTO gallery_items (user_id, client_id, type, url, prompt, style_name, agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user_id || null, client_id || null, type, url, prompt || null, style_name || null, agent || null, JSON.stringify(metadata || {})]
    );
    const item = rows[0];
    res.status(201).json({ ...item, metadata: JSON.parse(item.metadata) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/gallery/:id — validate owner
router.delete('/:id', async (req, res) => {
  if (!req.user?.userId) return res.status(401).json({ error: 'Authentication required' });

  try {
    const { rows } = await query('SELECT user_id FROM gallery_items WHERE id = $1', [req.params.id]);
    const item = rows[0];
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (item.user_id !== req.user.userId) return res.status(403).json({ error: 'Not authorized' });

    await query('DELETE FROM gallery_items WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
