import { Router } from 'express';
import db from '../utils/db.js';

const router = Router();

// GET /api/content-templates?client_id=N
router.get('/', (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { client_id } = req.query;

  let rows;
  if (client_id) {
    rows = db.prepare(
      'SELECT * FROM content_templates WHERE user_id = ? AND client_id = ? ORDER BY updated_at DESC'
    ).all(userId, Number(client_id));
  } else {
    rows = db.prepare(
      'SELECT * FROM content_templates WHERE user_id = ? ORDER BY updated_at DESC'
    ).all(userId);
  }

  res.json(rows.map(r => ({ ...r, nodes: JSON.parse(r.nodes), edges: JSON.parse(r.edges) })));
});

// POST /api/content-templates
router.post('/', (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { name, description, nodes = [], edges = [], client_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  const result = db.prepare(`
    INSERT INTO content_templates (user_id, client_id, name, description, nodes, edges)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, client_id || null, name, description || null, JSON.stringify(nodes), JSON.stringify(edges));

  const t = db.prepare('SELECT * FROM content_templates WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...t, nodes: JSON.parse(t.nodes), edges: JSON.parse(t.edges) });
});

// GET /api/content-templates/:id
router.get('/:id', (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const t = db.prepare('SELECT * FROM content_templates WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!t) return res.status(404).json({ error: 'Not found' });

  res.json({ ...t, nodes: JSON.parse(t.nodes), edges: JSON.parse(t.edges) });
});

// PUT /api/content-templates/:id
router.put('/:id', (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { name, description, nodes, edges, client_id } = req.body;

  const existing = db.prepare('SELECT * FROM content_templates WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

  db.prepare(
    `UPDATE content_templates SET name=?, description=?, nodes=?, edges=?, client_id=?, updated_at=datetime('now') WHERE id=?`
  ).run(name, description || null, JSON.stringify(nodes || []), JSON.stringify(edges || []), client_id ?? existing.client_id, req.params.id);

  const t = db.prepare('SELECT * FROM content_templates WHERE id = ?').get(req.params.id);
  res.json({ ...t, nodes: JSON.parse(t.nodes), edges: JSON.parse(t.edges) });
});

// DELETE /api/content-templates/:id
router.delete('/:id', (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const existing = db.prepare('SELECT * FROM content_templates WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

  db.prepare('DELETE FROM content_templates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
