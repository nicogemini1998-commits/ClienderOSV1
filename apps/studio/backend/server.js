import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { logger } from '../../../core/bot/utils/logger.js';
import db from '../../../core/bot/utils/db.js';
import { executeDynamicWorkflow } from '../../../core/bot/agentes/executor.js';
import clientsRouter from './routes/clients.js';
import templatesRouter from './routes/templates.js';
import authRouter, { JWT_SECRET } from './routes/auth.js';
import galleryRouter from './routes/gallery.js';
import stylesRouter from './routes/styles.js';
import contentTemplatesRouter from './routes/content-templates.js';
import kieRouter from './routes/kie.js';

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// ─── Auth middleware (optional — attaches user to req) ────────
app.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    } catch {}
  }
  next();
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/styles', stylesRouter);
app.use('/api/content-templates', contentTemplatesRouter);
app.use('/api/kie', kieRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

// ─── REST: execute workflow ───────────────────────────────────
app.post('/api/workflows/execute', async (req, res) => {
  const { input, templateId, clientId } = req.body;
  if (!templateId) return res.status(400).json({ error: 'templateId required' });

  const raw = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
  if (!raw) return res.status(404).json({ error: 'Template not found' });

  const template = { ...raw, agents: JSON.parse(raw.agents), input_config: JSON.parse(raw.input_config) };
  const client = clientId ? db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId) : null;

  try {
    const result = await executeDynamicWorkflow({ input, template, client });

    db.prepare(`INSERT INTO executions (client_id, template_id, status, input, result)
                VALUES (?, ?, 'completed', ?, ?)`
    ).run(clientId || null, templateId, JSON.stringify(input), JSON.stringify(result));

    io.emit('workflow:completed', { client: client?.name, template: template.name });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── REST: client history ─────────────────────────────────────
app.get('/api/workflows/history/:clientId', (req, res) => {
  const rows = db.prepare(`
    SELECT e.*, t.name as template_name
    FROM executions e
    LEFT JOIN templates t ON e.template_id = t.id
    WHERE e.client_id = ?
    ORDER BY e.created_at DESC LIMIT 50
  `).all(req.params.clientId);
  res.json(rows);
});

// ─── WebSocket ────────────────────────────────────────────────
io.on('connection', (socket) => {
  logger.info(`🔌 Connected: ${socket.id}`);

  socket.on('workflow:request', async ({ input, templateId, clientId }) => {
    if (!templateId) {
      socket.emit('workflow:error', { error: 'templateId required' });
      return;
    }

    const raw = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
    if (!raw) {
      socket.emit('workflow:error', { error: 'Template not found' });
      return;
    }

    const template = { ...raw, agents: JSON.parse(raw.agents), input_config: JSON.parse(raw.input_config) };
    const client = clientId ? db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId) : null;

    logger.info(`▶ Workflow: ${template.name} · client: ${client?.name || 'none'}`);

    try {
      const onProgress = (agentName, status, result) => {
        socket.emit('workflow:agent:update', { agentName, status, result });
      };

      const result = await executeDynamicWorkflow({ input, template, client, onProgress });

      db.prepare(`INSERT INTO executions (client_id, template_id, status, input, result)
                  VALUES (?, ?, 'completed', ?, ?)`
      ).run(clientId || null, templateId, JSON.stringify(input), JSON.stringify(result));

      socket.emit('workflow:success', result);
      io.emit('workflow:completed', { client: client?.name, template: template.name, ts: new Date().toISOString() });
    } catch (err) {
      logger.error('Workflow error', { error: err.message });
      socket.emit('workflow:error', { error: err.message });
    }
  });

  socket.on('disconnect', () => logger.info(`❌ Disconnected: ${socket.id}`));
});

// ─── Error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT_FULLSTACK || 3005;
httpServer.listen(PORT, () => {
  logger.success(`✅ Server on port ${PORT}`);
  logger.info(`   http://localhost:${PORT}`);
});

export default app;
