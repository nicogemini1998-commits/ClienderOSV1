import { Router } from 'express';
import { query } from '../utils/db.js';

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

// GET /api/templates — predefined + user's custom
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.userId || null;
    const { rows } = await query(
      `SELECT * FROM templates
       WHERE is_predefined = 1 OR user_id = $1
       ORDER BY is_predefined DESC, name ASC`,
      [userId]
    );
    res.json(rows.map(parseTemplate));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/templates/:id — predefined or user's custom
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.userId || null;
    const { rows } = await query(
      `SELECT * FROM templates WHERE id = $1 AND (is_predefined = 1 OR user_id = $2)`,
      [req.params.id, userId]
    );
    const t = rows[0];
    if (!t) return res.status(404).json({ error: 'Not found' });
    res.json(parseTemplate(t));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/templates — create custom (user-specific)
router.post('/', async (req, res) => {
  if (!req.user?.userId) return res.status(401).json({ error: 'Authentication required' });

  const { name, description, category, input_config, agents } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  if (!agents?.length) return res.status(400).json({ error: 'agents array is required' });

  try {
    const { rows } = await query(
      `INSERT INTO templates (name, description, category, is_predefined, input_config, agents, user_id)
       VALUES ($1, $2, $3, 0, $4, $5, $6)
       RETURNING *`,
      [
        name,
        description || null,
        category || 'custom',
        JSON.stringify(input_config || { fields: [] }),
        JSON.stringify(agents),
        req.user.userId,
      ]
    );
    res.status(201).json(parseTemplate(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/templates/:id — edit custom & validate owner
router.put('/:id', async (req, res) => {
  if (!req.user?.userId) return res.status(401).json({ error: 'Authentication required' });

  try {
    const { rows: existingRows } = await query(
      'SELECT is_predefined, user_id FROM templates WHERE id = $1',
      [req.params.id]
    );
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.is_predefined) return res.status(403).json({ error: 'Cannot edit predefined templates' });
    if (existing.user_id !== req.user.userId) return res.status(403).json({ error: 'Not authorized' });

    const { name, description, category, input_config, agents } = req.body;
    await query(
      `UPDATE templates SET name=$1, description=$2, category=$3, input_config=$4, agents=$5,
       updated_at=NOW() WHERE id=$6`,
      [
        name,
        description || null,
        category || 'custom',
        JSON.stringify(input_config || { fields: [] }),
        JSON.stringify(agents),
        req.params.id,
      ]
    );

    const { rows } = await query('SELECT * FROM templates WHERE id = $1', [req.params.id]);
    res.json(parseTemplate(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/templates/:id — delete custom & validate owner
router.delete('/:id', async (req, res) => {
  if (!req.user?.userId) return res.status(401).json({ error: 'Authentication required' });

  try {
    const { rows } = await query(
      'SELECT is_predefined, user_id FROM templates WHERE id = $1',
      [req.params.id]
    );
    const existing = rows[0];
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.is_predefined) return res.status(403).json({ error: 'Cannot delete predefined templates' });
    if (existing.user_id !== req.user.userId) return res.status(403).json({ error: 'Not authorized' });

    await query('DELETE FROM templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
