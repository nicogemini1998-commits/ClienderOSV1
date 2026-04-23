/**
 * 🎯 FullStackAI Backend Server
 * 
 * PROPÓSITO: Orquestador principal de CLIENDER OS
 * PUERTO: 3005
 * FEATURES:
 * - Express + Socket.io
 * - Rutas para agentes BOB
 * - Autenticación JWT
 * - Real-time updates
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../BOB-BRAIN/utils/logger.js';
import { executeWorkflow, notebook } from '../BOB-BRAIN/agentes/index.js';

// Config
dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

// ============================================================
// AGENTES — Rutas principales
// ============================================================

/**
 * POST /api/agents/execute-workflow
 * Ejecuta workflow completo: Lead → Propuesta
 * 
 * Body: { name, website, sector, country?, workflow_id? }
 * Response: { success, workflow_id, steps, final_proposal, complete_notebook }
 */

app.post('/api/agents/execute-workflow', async (req, res) => {
  const { name, website, sector, country, workflow_id } = req.body;

  if (!name || !website || !sector) {
    return res.status(400).json({ error: 'Missing required fields: name, website, sector' });
  }

  try {
    logger.info('🚀 Workflow iniciado desde API', { lead: name });

    // Ejecutar workflow
    const result = await executeWorkflow({
      name,
      website,
      sector,
      country: country || 'Unknown',
      workflow_id: workflow_id || `workflow_${Date.now()}`
    });

    // Broadcast a WebSocket
    io.emit('workflow:completed', {
      workflow_id: result.workflow_id,
      lead: name,
      status: 'completed',
      timestamp: new Date().toISOString()
    });

    logger.success('✅ Workflow completado vía API', { lead: name });

    res.json(result);
  } catch (error) {
    logger.error('❌ Workflow error vía API', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agents/history/:workflow_id
 * Obtiene historial de ejecución
 */

app.get('/api/agents/history/:workflow_id', (req, res) => {
  const { workflow_id } = req.params;
  
  try {
    // Aquí se buscaría en BD
    res.json({ 
      workflow_id, 
      entries: notebook.entries,
      status: 'retrieved'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// WEBSOCKETS — Real-time updates
// ============================================================

io.on('connection', (socket) => {
  logger.info(`🔌 Cliente conectado: ${socket.id}`);

  // Cliente solicita workflow
  socket.on('workflow:request', async (data) => {
    try {
      logger.info(`▶️ Workflow solicitado desde socket: ${socket.id}`);

      // Ejecutar workflow
      const result = await executeWorkflow(data);

      // Notificar al cliente
      socket.emit('workflow:success', result);

      // Broadcast a todos
      io.emit('workflow:completed', {
        workflow_id: result.workflow_id,
        lead: data.name,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Workflow socket error', { error: error.message });
      socket.emit('workflow:error', { error: error.message });
    }
  });

  // Cliente desconecta
  socket.on('disconnect', () => {
    logger.info(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// ============================================================
// ERROR HANDLING
// ============================================================

app.use((err, req, res, next) => {
  logger.error('❌ Unhandled error', { error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT_FULLSTACK || 3005;

httpServer.listen(PORT, () => {
  logger.success(`✅ FullStackAI Backend iniciado en puerto ${PORT}`);
  logger.info('📍 HTTP: http://localhost:' + PORT);
  logger.info('🔌 WebSocket: ws://localhost:' + PORT);
  logger.info('');
  logger.info('Endpoints:');
  logger.info('  POST /api/agents/execute-workflow — Ejecutar workflow completo');
  logger.info('  GET  /api/agents/history/:id — Obtener historial');
  logger.info('');
});

export default app;
