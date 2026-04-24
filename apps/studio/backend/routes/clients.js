import { Router } from 'express';
import db from '../../../BOB-BRAIN/utils/db.js';

const router = Router();

// GET /api/clients
router.get('/', (req, res) => {
  const clients = db.prepare('SELECT * FROM clients ORDER BY name ASC').all();
  res.json(clients);
});

// GET /api/clients/:id  (with execution history)
router.get('/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Not found' });

  const history = db.prepare(`
    SELECT e.id, e.status, e.created_at, t.name as template_name
    FROM executions e
    LEFT JOIN templates t ON e.template_id = t.id
    WHERE e.client_id = ?
    ORDER BY e.created_at DESC
    LIMIT 50
  `).all(req.params.id);

  res.json({ ...client, history });
});

// POST /api/clients
router.post('/', (req, res) => {
  const { name, company, email, phone, sector, website, ghl_id, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const result = db.prepare(`
    INSERT INTO clients (name, company, email, phone, sector, website, ghl_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, company || null, email || null, phone || null, sector || null, website || null, ghl_id || null, notes || null);

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(client);
});

// PUT /api/clients/:id
router.put('/:id', (req, res) => {
  const { name, company, email, phone, sector, website, ghl_id, notes } = req.body;
  db.prepare(`
    UPDATE clients SET name=?, company=?, email=?, phone=?, sector=?, website=?, ghl_id=?, notes=?,
    updated_at=datetime('now') WHERE id=?
  `).run(name, company || null, email || null, phone || null, sector || null, website || null, ghl_id || null, notes || null, req.params.id);

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Not found' });
  res.json(client);
});

// DELETE /api/clients/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /api/clients/sync-ghl
router.post('/sync-ghl', async (req, res) => {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!apiKey || !locationId) {
    return res.status(400).json({ error: 'GHL_API_KEY and GHL_LOCATION_ID not configured in .env' });
  }

  const findByGhl = db.prepare('SELECT id FROM clients WHERE ghl_id = ?');
  const insertClient = db.prepare(`
    INSERT INTO clients (name, company, email, phone, sector, website, ghl_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateClient = db.prepare(`
    UPDATE clients SET name=?, company=?, email=?, phone=?, sector=?, website=?, updated_at=datetime('now')
    WHERE ghl_id=?
  `);

  // Limit to 500 most recent contacts (5 pages × 100)
  const MAX_PAGES = 5;
  let synced = 0;
  let nextUrl = `https://rest.gohighlevel.com/v1/contacts/?limit=100`;
  let pages = 0;

  try {
    while (nextUrl && pages < MAX_PAGES) {
      const resp = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!resp.ok) {
        const txt = await resp.text();
        return res.status(resp.status).json({ error: `GHL API error: ${txt}` });
      }

      const data = await resp.json();
      const contacts = data.contacts || [];

      const syncMany = db.transaction((items) => {
        for (const c of items) {
          const name = (c.contactName || [c.firstName, c.lastName].filter(Boolean).join(' ')).trim() || c.email || 'Sin nombre';
          const company = c.companyName || null;
          const sector = c.tags?.join(', ') || null;
          const existing = findByGhl.get(c.id);
          if (existing) {
            updateClient.run(name, company, c.email || null, c.phone || null, sector, c.website || null, c.id);
          } else {
            insertClient.run(name, company, c.email || null, c.phone || null, sector, c.website || null, c.id, null);
          }
          synced++;
        }
      });

      syncMany(contacts);
      nextUrl = data.meta?.nextPageUrl || null;
      pages++;
    }

    const total = db.prepare('SELECT COUNT(*) as c FROM clients').get().c;
    res.json({ success: true, synced, total_in_db: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
