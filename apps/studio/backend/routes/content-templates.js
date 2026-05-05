import { Router } from 'express';
import { query } from '../utils/db.js';

const router = Router();

// GET /api/content-templates?client_id=N
router.get('/', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { client_id } = req.query;

  try {
    let rows;
    if (client_id) {
      const result = await query(
        'SELECT * FROM content_templates WHERE user_id = $1 AND client_id = $2 ORDER BY updated_at DESC',
        [userId, Number(client_id)]
      );
      rows = result.rows;
    } else {
      const result = await query(
        'SELECT * FROM content_templates WHERE user_id = $1 ORDER BY updated_at DESC',
        [userId]
      );
      rows = result.rows;
    }

    res.json(rows.map(r => ({ ...r, nodes: JSON.parse(r.nodes), edges: JSON.parse(r.edges) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/content-templates
router.post('/', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { name, description, nodes = [], edges = [], client_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  try {
    const { rows } = await query(
      `INSERT INTO content_templates (user_id, client_id, name, description, nodes, edges)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, client_id || null, name, description || null, JSON.stringify(nodes), JSON.stringify(edges)]
    );
    const t = rows[0];
    res.status(201).json({ ...t, nodes: JSON.parse(t.nodes), edges: JSON.parse(t.edges) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/content-templates/:id
router.get('/:id', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { rows } = await query(
      'SELECT * FROM content_templates WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );
    const t = rows[0];
    if (!t) return res.status(404).json({ error: 'Not found' });
    res.json({ ...t, nodes: JSON.parse(t.nodes), edges: JSON.parse(t.edges) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/content-templates/:id
router.put('/:id', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { rows: existingRows } = await query(
      'SELECT * FROM content_templates WHERE id = $1',
      [req.params.id]
    );
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    const { name, description, nodes, edges, client_id } = req.body;
    await query(
      `UPDATE content_templates
       SET name=$1, description=$2, nodes=$3, edges=$4, client_id=$5, updated_at=NOW()
       WHERE id=$6`,
      [
        name,
        description || null,
        JSON.stringify(nodes || []),
        JSON.stringify(edges || []),
        client_id ?? existing.client_id,
        req.params.id,
      ]
    );

    const { rows } = await query('SELECT * FROM content_templates WHERE id = $1', [req.params.id]);
    const t = rows[0];
    res.json({ ...t, nodes: JSON.parse(t.nodes), edges: JSON.parse(t.edges) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/content-templates/:id
router.delete('/:id', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { rows } = await query(
      'SELECT * FROM content_templates WHERE id = $1',
      [req.params.id]
    );
    const existing = rows[0];
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    await query('DELETE FROM content_templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
