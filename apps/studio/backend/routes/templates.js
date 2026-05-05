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

// GET /api/templates
router.get('/', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM templates ORDER BY is_predefined DESC, name ASC');
    res.json(rows.map(parseTemplate));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/templates/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM templates WHERE id = $1', [req.params.id]);
    const t = rows[0];
    if (!t) return res.status(404).json({ error: 'Not found' });
    res.json(parseTemplate(t));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/templates  (custom only)
router.post('/', async (req, res) => {
  const { name, description, category, input_config, agents } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  if (!agents?.length) return res.status(400).json({ error: 'agents array is required' });

  try {
    const { rows } = await query(
      `INSERT INTO templates (name, description, category, is_predefined, input_config, agents)
       VALUES ($1, $2, $3, 0, $4, $5)
       RETURNING *`,
      [
        name,
        description || null,
        category || 'custom',
        JSON.stringify(input_config || { fields: [] }),
        JSON.stringify(agents),
      ]
    );
    res.status(201).json(parseTemplate(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/templates/:id  (cannot edit predefined)
router.put('/:id', async (req, res) => {
  try {
    const { rows: existingRows } = await query('SELECT is_predefined FROM templates WHERE id = $1', [req.params.id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.is_predefined) return res.status(403).json({ error: 'Cannot edit predefined templates' });

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

// DELETE /api/templates/:id  (cannot delete predefined)
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await query('SELECT is_predefined FROM templates WHERE id = $1', [req.params.id]);
    const existing = rows[0];
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.is_predefined) return res.status(403).json({ error: 'Cannot delete predefined templates' });

    await query('DELETE FROM templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
