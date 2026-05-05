import { Router } from 'express';
import { query } from '../utils/db.js';

const router = Router();

// GET /api/styles — return predefined + user's custom
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.userId || null;
    const { rows } = await query(
      `SELECT * FROM photography_styles
       WHERE is_predefined = 1 OR user_id = $1
       ORDER BY is_predefined DESC, name ASC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/styles — create custom style (user-specific)
router.post('/', async (req, res) => {
  const { name, description, prompt_prefix, emoji } = req.body;
  if (!name || !prompt_prefix) return res.status(400).json({ error: 'name and prompt_prefix required' });
  if (!req.user?.userId) return res.status(401).json({ error: 'Authentication required' });

  try {
    const { rows } = await query(
      `INSERT INTO photography_styles (name, description, prompt_prefix, emoji, is_predefined, user_id)
       VALUES ($1, $2, $3, $4, 0, $5)
       RETURNING *`,
      [name, description || null, prompt_prefix, emoji || '🎨', req.user.userId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/styles/:id — only custom & owner
router.delete('/:id', async (req, res) => {
  if (!req.user?.userId) return res.status(401).json({ error: 'Authentication required' });

  try {
    const { rows } = await query('SELECT * FROM photography_styles WHERE id = $1', [req.params.id]);
    const style = rows[0];
    if (!style) return res.status(404).json({ error: 'Not found' });
    if (style.is_predefined) return res.status(403).json({ error: 'Cannot delete predefined style' });
    if (style.user_id !== req.user.userId) return res.status(403).json({ error: 'Not authorized' });

    await query('DELETE FROM photography_styles WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
