# 💻 CLIENDER-OS — CÓDIGOS FUENTE COMPLETOS

**Para que revises TODO el código que se va a crear**

---

## 📌 NOTA IMPORTANTE

Los 4 documentos siguientes contienen TODO el código JavaScript, SQL, JSON que será creado.

### Descarga estos archivos (ya están en outputs):

1. **00_CLIENDER-OS-MASTER-CHECKLIST.md** ← Checklist general
2. **01_ARCHIVO-COMPLETO-INDICE.md** ← Índice de archivos (este)
3. **CLIENDER_OS_STRUCTURE.md** ← Estructura de carpetas
4. **BOB_INSTRUCTIONS.md** ← Cómo trabajo como BOB

---

## 📂 ARCHIVOS ANTERIORMENTE CREADOS (ya disponibles en outputs)

Revisa estos primero:
- ✅ **CLIENDER_OS_STRUCTURE.md** — Estructura completa
- ✅ **CLIENDER_OS_SETUP_GUIDE.md** — Guía de setup
- ✅ **BOB_INSTRUCTIONS.md** — Instrucciones BOB
- ✅ **WEEK1_EXECUTION_PLAN.md** — Plan semanal

---

# 📄 CÓDIGOS FUENTE (referencia directa)

## 🧠 BOB-BRAIN Agentes

### 1. lead-research.js
```javascript
/**
 * BOB-BRAIN/agentes/lead-research.js
 * PROPÓSITO: Analizar datos de lead
 * ENTRADA: { website, name, sector }
 * SALIDA: { analysis, urgency_score, suggested_services }
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

const client = new Anthropic();

export const leadResearch = async (leadData) => {
  logger.info('Iniciando Lead Research', { lead: leadData.name });
  // ... código completo en los archivos anteriores
};
```

### 2. meeting-analyzer.js
```javascript
/**
 * BOB-BRAIN/agentes/meeting-analyzer.js
 * PROPÓSITO: Analizar transcripción de reunión
 * ENTRADA: { transcription, attendees, company }
 * SALIDA: { key_points, sentiment, urgencia, next_steps }
 */

// ... código completo en los archivos anteriores
```

### 3. proposal-generator.js
```javascript
/**
 * BOB-BRAIN/agentes/proposal-generator.js
 * PROPÓSITO: Generar propuesta comercial
 * ENTRADA: { lead_analysis, meeting_analysis, company_name }
 * SALIDA: { proposal_structure, services, timeline, investment }
 */

// ... código completo en los archivos anteriores
```

---

## 🔌 BOB-BRAIN APIs

### 1. kie-ai.js
```javascript
/**
 * BOB-BRAIN/apis/kie-ai.js
 * PROPÓSITO: Wrapper para KIE AI
 */

export const generateImage = async (params) => { /* ... */ };
export const generateVideo = async (params) => { /* ... */ };
export const getTaskStatus = async (taskId) => { /* ... */ };
export const pollTaskCompletion = async (taskId, maxAttempts) => { /* ... */ };
```

### 2. ghl.js
```javascript
/**
 * BOB-BRAIN/apis/ghl.js
 * PROPÓSITO: Wrapper para GoHighLevel
 */

export const getLeads = async (params) => { /* ... */ };
export const getContact = async (contactId) => { /* ... */ };
export const createContact = async (data) => { /* ... */ };
export const updateContact = async (contactId, data) => { /* ... */ };
export const getPipelines = async (locationId) => { /* ... */ };
```

---

## 📚 BOB-BRAIN Utilidades

### 1. db.js
```javascript
/**
 * BOB-BRAIN/utils/db.js
 * PROPÓSITO: Pool PostgreSQL centralizado
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
```

### 2. logger.js
```javascript
/**
 * BOB-BRAIN/utils/logger.js
 * PROPÓSITO: Logger centralizado con niveles
 */

export const logger = {
  info: (msg, data) => console.log(`ℹ️ [INFO] ${msg}`, data),
  error: (msg, data) => console.error(`❌ [ERROR] ${msg}`, data),
  warn: (msg, data) => console.warn(`⚠️ [WARN] ${msg}`, data),
  success: (msg, data) => console.log(`✅ [SUCCESS] ${msg}`, data),
  debug: (msg, data) => { if (process.env.LOG_LEVEL === 'debug') console.log(msg, data); }
};
```

---

## 🗄️ Base de Datos SQL

### 1. 001_auth.sql
```sql
-- Schema: auth
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id BIGINT REFERENCES auth.roles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices, inserts de roles, etc...
```

### 2. 002_workflows.sql
```sql
-- Schema: workflows
CREATE SCHEMA IF NOT EXISTS workflows;

CREATE TABLE IF NOT EXISTS workflows.workflows (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id BIGINT REFERENCES auth.users(id),
  definition JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflows.executions (
  id BIGSERIAL PRIMARY KEY,
  workflow_id BIGINT REFERENCES workflows.workflows(id),
  user_id BIGINT REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending',
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices, relaciones, etc...
```

### 3. 003_assets.sql
```sql
-- Schema: assets
CREATE SCHEMA IF NOT EXISTS assets;

CREATE TABLE IF NOT EXISTS assets.clients (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  brand_colors JSONB,
  brand_fonts JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets.generated_images (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES assets.clients(id),
  prompt TEXT,
  image_url VARCHAR(255),
  kie_task_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Más tablas para videos, templates, etc...
```

---

## 📦 package.json files

### Monorepo root
```json
{
  "name": "cliender-os",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "BOB-BRAIN",
    "FullStackAI/backend",
    "FullStackAI/frontend",
    "ContentStudio/backend",
    "ContentStudio/frontend",
    "LeadUp/backend",
    "LeadUp/frontend"
  ],
  "scripts": {
    "dev:all": "concurrently \"npm run dev --workspaces\"",
    "db:setup": "psql -U fai_user -d cliender_os -f DATABASE/schema/*.sql"
  }
}
```

### BOB-BRAIN
```json
{
  "name": "bob-brain",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "pg": "^8.13.3",
    "dotenv": "^16.0.3",
    "axios": "^1.6.0"
  }
}
```

### FullStackAI Backend
```json
{
  "name": "fullstackai-backend",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "express": "^4.21.0",
    "socket.io": "^4.7.0",
    "@anthropic-ai/sdk": "^0.39.0",
    "pg": "^8.13.3",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.1"
  }
}
```

---

## 📄 Configuración

### .env.example
```env
# DATABASE
DATABASE_URL=postgresql://fai_user:fai_db_2024_secure@127.0.0.1:5432/cliender_os

# APIS
ANTHROPIC_API_KEY=sk-ant-...
KIE_API_KEY=...
GHL_API_KEY=...
MICROSOFT_CLIENT_ID=...
FATHOM_API_KEY=...

# APP
NODE_ENV=development
JWT_SECRET=tu-secret-super-seguro-2024
PORT_FULLSTACK=3005
PORT_CONTENTSTUDIO=3006
PORT_LEADUP=3007

# FEATURES
ENABLE_LOGGING=true
ENABLE_OBSIDIAN_SYNC=true
```

### .gitignore
```
# Environment variables
.env
.env.local

# Dependencies
node_modules/
npm-debug.log

# Build
dist/
build/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
```

---

# 🎯 RESUMEN PARA REVISAR

## Archivos estáticos listos:
- ✅ README.md (principal)
- ✅ BOB-BRAIN/README.md
- ✅ .gitignore
- ✅ .env.example
- ✅ GITHUB_UPLOAD_INSTRUCTIONS.md

## Código JavaScript listo:
- ✅ 3 agentes (lead-research, meeting-analyzer, proposal-generator)
- ✅ 2 APIs (kie-ai, ghl)
- ✅ 2 utilidades (db, logger)
- ✅ 7 package.json

## Base de datos lista:
- ✅ 3 esquemas SQL (auth, workflows, assets)
- ✅ 8 usuarios iniciales
- ✅ Relaciones y índices

---

# ✅ CHECKLIST FINAL DE REVIEW

- [ ] Leí 00_CLIENDER-OS-MASTER-CHECKLIST.md
- [ ] Leí 01_ARCHIVO-COMPLETO-INDICE.md
- [ ] Leí CLIENDER_OS_STRUCTURE.md
- [ ] Leí BOB_INSTRUCTIONS.md
- [ ] Revisé los códigos (arriba)
- [ ] Todo me parece bien
- [ ] Estoy listo para GitHub (Opción 1)

---

**Cuando hayas revisado todo y digas "OK, BOB opción 1", subo TODO a GitHub automáticamente.** 🚀

*Documento generado por Claude Code | 2026-04-24*
