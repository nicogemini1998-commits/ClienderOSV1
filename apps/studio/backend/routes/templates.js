import { Router } from 'express';
import db from '../../../BOB-BRAIN/utils/db.js';

const router = Router();

function parseTemplate(t) {
  if (!t) return null;
  return {
    ...t,
    is_predefined: Boolean(t.is_predefined),
    input_config: JSON.parse(t.input_config || '{}'),
    agents: JSON.parse(t.agents || '[]'),
  };
}

// GET /api/templates
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM templates ORDER BY is_predefined DESC, name ASC').all();
  res.json(rows.map(parseTemplate));
});

// GET /api/templates/:id
router.get('/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(parseTemplate(t));
});

// POST /api/templates  (custom only)
router.post('/', (req, res) => {
  const { name, description, category, input_config, agents } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  if (!agents?.length) return res.status(400).json({ error: 'agents array is required' });

  const result = db.prepare(`
    INSERT INTO templates (name, description, category, is_predefined, input_config, agents)
    VALUES (?, ?, ?, 0, ?, ?)
  `).run(
    name,
    description || null,
    category || 'custom',
    JSON.stringify(input_config || { fields: [] }),
    JSON.stringify(agents),
  );

  const t = db.prepare('SELECT * FROM templates WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(parseTemplate(t));
});

// PUT /api/templates/:id  (cannot edit predefined)
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT is_predefined FROM templates WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.is_predefined) return res.status(403).json({ error: 'Cannot edit predefined templates' });

  const { name, description, category, input_config, agents } = req.body;
  db.prepare(`
    UPDATE templates SET name=?, description=?, category=?, input_config=?, agents=?,
    updated_at=datetime('now') WHERE id=?
  `).run(
    name,
    description || null,
    category || 'custom',
    JSON.stringify(input_config || { fields: [] }),
    JSON.stringify(agents),
    req.params.id,
  );

  res.json(parseTemplate(db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id)));
});

// DELETE /api/templates/:id  (cannot delete predefined)
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT is_predefined FROM templates WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.is_predefined) return res.status(403).json({ error: 'Cannot delete predefined templates' });

  db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
