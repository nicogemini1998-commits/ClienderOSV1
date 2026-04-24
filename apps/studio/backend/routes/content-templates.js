import { Router } from 'express';
import db from '../../../BOB-BRAIN/utils/db.js';

const router = Router();

// GET /api/content-templates?userId=
router.get('/', (req, res) => {
  const { userId } = req.query;
  const sql = userId
    ? 'SELECT * FROM content_templates WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC'
    : 'SELECT * FROM content_templates ORDER BY created_at DESC';
  const rows = userId
    ? db.prepare(sql).all(userId)
    : db.prepare(sql).all();
  res.json(rows.map(r => ({ ...r, nodes: JSON.parse(r.nodes), edges: JSON.parse(r.edges) })));
});

// POST /api/content-templates
router.post('/', (req, res) => {
  const { user_id, name, description, nodes = [], edges = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  const result = db.prepare(`
    INSERT INTO content_templates (user_id, name, description, nodes, edges)
    VALUES (?, ?, ?, ?, ?)
  `).run(user_id || null, name, description || null, JSON.stringify(nodes), JSON.stringify(edges));

  const t = db.prepare('SELECT * FROM content_templates WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...t, nodes: JSON.parse(t.nodes), edges: JSON.parse(t.edges) });
});

// PUT /api/content-templates/:id
router.put('/:id', (req, res) => {
  const { name, description, nodes, edges } = req.body;
  db.prepare(`UPDATE content_templates SET name=?, description=?, nodes=?, edges=?, updated_at=datetime('now') WHERE id=?`)
    .run(name, description || null, JSON.stringify(nodes || []), JSON.stringify(edges || []), req.params.id);
  const t = db.prepare('SELECT * FROM content_templates WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json({ ...t, nodes: JSON.parse(t.nodes), edges: JSON.parse(t.edges) });
});

// DELETE /api/content-templates/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM content_templates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
