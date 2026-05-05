import { Router } from 'express';
import pool, { query } from '../utils/db.js';

const router = Router();

// GET /api/clients
router.get('/', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM clients ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clients/:id  (with execution history + space count)
router.get('/:id', async (req, res) => {
  try {
    const { rows: clientRows } = await query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    const client = clientRows[0];
    if (!client) return res.status(404).json({ error: 'Not found' });

    const { rows: history } = await query(
      `SELECT e.id, e.status, e.created_at, t.name as template_name
       FROM executions e
       LEFT JOIN templates t ON e.template_id = t.id
       WHERE e.client_id = $1
       ORDER BY e.created_at DESC
       LIMIT 50`,
      [req.params.id]
    );

    const { rows: countRows } = await query(
      'SELECT COUNT(*) as c FROM content_templates WHERE client_id = $1',
      [req.params.id]
    );
    const spaceCount = Number(countRows[0]?.c) || 0;

    res.json({ ...client, history, space_count: spaceCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clients
router.post('/', async (req, res) => {
  const {
    name, company, email, phone, sector, website, ghl_id, notes,
    brand_description, tone, brand_colors, target_audience,
  } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const { rows } = await query(
      `INSERT INTO clients
         (name, company, email, phone, sector, website, ghl_id, notes,
          brand_description, tone, brand_colors, target_audience)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        name,
        company || null, email || null, phone || null, sector || null,
        website || null, ghl_id || null, notes || null,
        brand_description || null, tone || null, brand_colors || null, target_audience || null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  const {
    name, company, email, phone, sector, website, ghl_id, notes,
    brand_description, tone, brand_colors, target_audience,
  } = req.body;

  try {
    await query(
      `UPDATE clients SET
         name=$1, company=$2, email=$3, phone=$4, sector=$5, website=$6, ghl_id=$7, notes=$8,
         brand_description=$9, tone=$10, brand_colors=$11, target_audience=$12,
         updated_at=NOW()
       WHERE id=$13`,
      [
        name,
        company || null, email || null, phone || null, sector || null,
        website || null, ghl_id || null, notes || null,
        brand_description || null, tone || null, brand_colors || null, target_audience || null,
        req.params.id,
      ]
    );

    const { rows } = await query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    const client = rows[0];
    if (!client) return res.status(404).json({ error: 'Not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM clients WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clients/sync-ghl
router.post('/sync-ghl', async (req, res) => {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!apiKey || !locationId) {
    return res.status(400).json({ error: 'GHL_API_KEY and GHL_LOCATION_ID not configured in .env' });
  }

  const MAX_PAGES = 5;
  let synced = 0;
  let nextUrl = `https://rest.gohighlevel.com/v1/contacts/?limit=100`;
  let pages = 0;

  const client = await pool.connect();
  try {
    while (nextUrl && pages < MAX_PAGES) {
      const resp = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!resp.ok) {
        const txt = await resp.text();
        client.release();
        return res.status(resp.status).json({ error: `GHL API error: ${txt}` });
      }

      const data = await resp.json();
      const contacts = data.contacts || [];

      await client.query('BEGIN');
      for (const c of contacts) {
        const contactName = (
          c.contactName || [c.firstName, c.lastName].filter(Boolean).join(' ')
        ).trim() || c.email || 'Sin nombre';
        const company = c.companyName || null;
        const sector = c.tags?.join(', ') || null;

        const { rows: existing } = await client.query(
          'SELECT id FROM clients WHERE ghl_id = $1',
          [c.id]
        );

        if (existing.length > 0) {
          await client.query(
            `UPDATE clients SET name=$1, company=$2, email=$3, phone=$4, sector=$5, website=$6, updated_at=NOW()
             WHERE ghl_id=$7`,
            [contactName, company, c.email || null, c.phone || null, sector, c.website || null, c.id]
          );
        } else {
          await client.query(
            `INSERT INTO clients (name, company, email, phone, sector, website, ghl_id, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [contactName, company, c.email || null, c.phone || null, sector, c.website || null, c.id, null]
          );
        }
        synced++;
      }
      await client.query('COMMIT');

      nextUrl = data.meta?.nextPageUrl || null;
      pages++;
    }

    const { rows: totalRows } = await client.query('SELECT COUNT(*) as c FROM clients');
    client.release();
    res.json({ success: true, synced, total_in_db: Number(totalRows[0].c) });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    res.status(500).json({ error: err.message });
  }
});

export default router;
