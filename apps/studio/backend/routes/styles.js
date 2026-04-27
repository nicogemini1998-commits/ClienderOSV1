import { Router } from 'express';
import db from '../../../../core/bot/utils/db.js';

const router = Router();

// GET /api/styles
router.get('/', (req, res) => {
  const styles = db.prepare('SELECT * FROM photography_styles ORDER BY is_predefined DESC, name ASC').all();
  res.json(styles);
});

// POST /api/styles  — custom style
router.post('/', (req, res) => {
  const { name, description, prompt_prefix, emoji } = req.body;
  if (!name || !prompt_prefix) return res.status(400).json({ error: 'name and prompt_prefix required' });

  const result = db.prepare(`
    INSERT INTO photography_styles (name, description, prompt_prefix, emoji, is_predefined)
    VALUES (?, ?, ?, ?, 0)
  `).run(name, description || null, prompt_prefix, emoji || '🎨');

  const style = db.prepare('SELECT * FROM photography_styles WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(style);
});

// DELETE /api/styles/:id  (only custom)
router.delete('/:id', (req, res) => {
  const style = db.prepare('SELECT * FROM photography_styles WHERE id = ?').get(req.params.id);
  if (!style) return res.status(404).json({ error: 'Not found' });
  if (style.is_predefined) return res.status(403).json({ error: 'Cannot delete predefined style' });
  db.prepare('DELETE FROM photography_styles WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
