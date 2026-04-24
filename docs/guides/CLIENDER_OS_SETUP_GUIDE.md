# 🚀 GUÍA DE SETUP — CLIENDER OS
**Objetivo:** Tener TODO operativo en local en 6 horas  
**Plataforma:** VS Code + Node.js + PostgreSQL  
**Versión:** 1.0 (2026-04-23)

---

## ✅ PRERREQUISITOS

Antes de empezar, asegúrate de tener:

```bash
# Verificar versiones
node --version          # v18+ (preferible v24)
npm --version           # v10+
psql --version          # PostgreSQL 13+
git --version           # v2.40+
```

Si falta algo:
- **Node.js:** https://nodejs.org (descargar v24 LTS)
- **PostgreSQL:** https://postgresql.org (descargar local)
- **VS Code:** https://code.visualstudio.com

---

## 📂 PASO 1: CREAR ESTRUCTURA DE CARPETAS

### 1.1 Crear carpeta raíz
```bash
cd ~/Desktop  (o donde prefieras)
mkdir CLIENDER-OS
cd CLIENDER-OS
git init
```

### 1.2 Crear subcarpetas (copiar exactamente)
```bash
# BOB-BRAIN
mkdir -p BOB-BRAIN/{agentes,apis,memory/{sops,templates,prompts,clients},utils}

# FullStackAI
mkdir -p FullStackAI/{frontend/src/{components,lib,pages},backend/{routes,middlewares,controllers,socket},docs}

# ContentStudio
mkdir -p ContentStudio/{frontend/src/{components,lib},backend/{routes,controllers}}

# LeadUp
mkdir -p LeadUp/{frontend/src/{pages,components},backend/{routes,controllers}}

# SHARED
mkdir -p SHARED/{constants,design-tokens}

# DATABASE
mkdir -p DATABASE/{schema,seeds}

# DOCS
mkdir -p DOCS

# OBSIDIAN-VAULT
mkdir -p OBSIDIAN-VAULT/{BOB-Memory,Projects}
```

### 1.3 Verificar estructura
```bash
# Desde la raíz de CLIENDER-OS
tree -L 2  # (si tienes tree instalado)
# o ver en VS Code: Ctrl+Shift+E
```

---

## 🗄️ PASO 2: CONFIGURAR POSTGRESQL

### 2.1 Crear usuario y BD
```bash
# Conectarse a PostgreSQL
psql -U postgres

# Dentro de psql:
CREATE USER fai_user WITH PASSWORD 'fai_db_2024_secure';
CREATE DATABASE cliender_os OWNER fai_user;
CREATE DATABASE landingpro OWNER fai_user;

# Asignar permisos
GRANT ALL PRIVILEGES ON DATABASE cliender_os TO fai_user;
GRANT ALL PRIVILEGES ON DATABASE landingpro TO fai_user;
ALTER ROLE fai_user CREATEDB;

# Salir
\q
```

### 2.2 Crear esquemas
```bash
# Conectarse a la BD
psql -U fai_user -d cliender_os

# Dentro de psql, ejecutar:
CREATE SCHEMA auth;
CREATE SCHEMA workflows;
CREATE SCHEMA assets;
CREATE SCHEMA logs;
CREATE SCHEMA execution;
CREATE SCHEMA landingpro;

\q
```

### 2.3 Crear tablas base (ejecutar SQL)
```bash
# Crear archivo: DATABASE/schema/001_init.sql

# Ejecutar:
psql -U fai_user -d cliender_os -f DATABASE/schema/001_init.sql
```

---

## 🔐 PASO 3: CONFIGURAR VARIABLES DE ENTORNO

### 3.1 Crear `.env` centralizado
```bash
# Crear archivo: SHARED/.env
# (copiar de SHARED/.env.template)
```

**Contenido de `SHARED/.env`:**
```env
# ===== DATABASE =====
DATABASE_URL=postgresql://fai_user:fai_db_2024_secure@127.0.0.1:5432/cliender_os
DATABASE_URL_LANDINGPRO=postgresql://fai_user:fai_db_2024_secure@127.0.0.1:5432/landingpro

# ===== APIS EXTERNAS =====
ANTHROPIC_API_KEY=sk-ant-...          (obtener de https://console.anthropic.com)
KIE_API_KEY=...                       (obtener de KIE AI)
GHL_API_KEY=...                       (obtener de GoHighLevel)
MICROSOFT_CLIENT_ID=...               (obtener de Azure)
FATHOM_API_KEY=...                    (obtener de Fathom)

# ===== APLICACIÓN =====
NODE_ENV=development
JWT_SECRET=tu-secret-super-seguro-cambiar-en-produccion
PORT_FULLSTACK=3005
PORT_CONTENTSTUDIO=3006
PORT_LEADUP=3007

# ===== FRONTEND URLs =====
NEXT_PUBLIC_API_URL_FULLSTACK=http://localhost:3005
NEXT_PUBLIC_API_URL_CREATIVESTUDIO=http://localhost:3006
NEXT_PUBLIC_API_URL_LEADUP=http://localhost:3007

# ===== FEATURES =====
ENABLE_LOGGING=true
ENABLE_OBSIDIAN_SYNC=true
```

### 3.2 Copiar `.env` a cada proyecto
```bash
# Cada proyecto tendrá un symlink al .env centralizado
# Esto evita duplicación

cd FullStackAI
ln -s ../SHARED/.env .env

cd ../ContentStudio
ln -s ../SHARED/.env .env

cd ../LeadUp
ln -s ../SHARED/.env .env
```

---

## 🧠 PASO 4: SETUP BOB-BRAIN

### 4.1 Crear `BOB-BRAIN/package.json`
```json
{
  "name": "bob-brain",
  "version": "1.0.0",
  "type": "module",
  "description": "Sistema nervioso central de CLIENDER OS",
  "main": "index.js",
  "scripts": {
    "dev": "node --watch index.js",
    "test": "node --test"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "pg": "^8.13.3",
    "dotenv": "^16.0.3",
    "jsonwebtoken": "^9.0.0",
    "axios": "^1.6.0"
  }
}
```

### 4.2 Crear `BOB-BRAIN/index.js`
```javascript
// BOB-BRAIN - Punto de entrada
import * as agents from './agentes/index.js';
import * as apis from './apis/index.js';
import * as utils from './utils/index.js';

export { agents, apis, utils };
console.log('✅ BOB-BRAIN initialized');
```

### 4.3 Crear `BOB-BRAIN/agentes/index.js`
```javascript
// Exporta todos los agentes
export { leadResearch } from './lead-research.js';
export { meetingAnalyzer } from './meeting-analyzer.js';
export { proposalGenerator } from './proposal-generator.js';
// ... etc
```

### 4.4 Instalar dependencias
```bash
cd BOB-BRAIN
npm install
```

---

## 🎯 PASO 5: SETUP FULLSTACKAI (ORQUESTADOR)

### 5.1 Backend `FullStackAI/backend/package.json`
```json
{
  "name": "fullstackai-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "dev": "node --watch server.js",
    "test": "node --test tests/"
  },
  "dependencies": {
    "express": "^4.21.0",
    "socket.io": "^4.7.0",
    "@anthropic-ai/sdk": "^0.39.0",
    "pg": "^8.13.3",
    "jsonwebtoken": "^9.0.0",
    "dotenv": "^16.0.3",
    "cors": "^2.8.5"
  }
}
```

### 5.2 Backend `FullStackAI/backend/server.js` (esqueleto)
```javascript
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' }
});

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'FullStackAI Backend' });
});

// Socket.io
io.on('connection', (socket) => {
  console.log('✅ Usuario conectado:', socket.id);
  socket.on('disconnect', () => console.log('❌ Usuario desconectado'));
});

// Arrancar
const PORT = process.env.PORT_FULLSTACK || 3005;
server.listen(PORT, () => {
  console.log(`🚀 FullStackAI Backend escuchando en puerto ${PORT}`);
});
```

### 5.3 Frontend `FullStackAI/frontend/package.json`
```json
{
  "name": "fullstackai-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@xyflow/react": "^12.0.0",
    "socket.io-client": "^4.7.0",
    "lucide-react": "^0.383.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

### 5.4 Instalar dependencias
```bash
cd FullStackAI/backend
npm install

cd ../frontend
npm install
```

---

## 🎨 PASO 6: SETUP CONTENTSTUDIO (CREATIVIDAD)

**Igual que FullStackAI pero:**
- Backend en puerto 3006
- Frontend componentes: Image, Video, Text
- Ruta base: `/api/creative`

```bash
cd ContentStudio/backend
npm install

cd ../frontend
npm install
```

---

## 🚀 PASO 7: SETUP LEADUP (LEADS)

**Igual que FullStackAI pero:**
- Backend en puerto 3007
- Rutas: `/api/triggers`, `/api/leads`, `/api/results`
- Gestión de usuarios con roles

```bash
cd LeadUp/backend
npm install

cd ../frontend
npm install
```

---

## 🧠 PASO 8: CONFIGURAR OBSIDIAN

### 8.1 Abrir Obsidian
```
File → Open Folder as Vault
→ Seleccionar: CLIENDER-OS/OBSIDIAN-VAULT
```

### 8.2 Crear INDEX.md
```markdown
# 🧠 BOB-BRAIN — Memoria Central

## 📊 Proyectos Activos
- [[FullStackAI]] — Orquestador
- [[ContentStudio]] — Creatividad
- [[LeadUp]] — Leads
- [[LandingPro]] — Landings

## 🔗 Conexiones
- [[BOB-Memory]] — Lo que sé
- [[Clients]] — Info de clientes
- [[Workflows]] — Flujos activos
- [[Learnings]] — Lecciones aprendidas
```

### 8.3 Instalar plugins recomendados
En Obsidian:
- Settings → Community plugins
- Buscar: **Dataview**, **Templater**, **Graph View**
- Instalar y habilitar

---

## 🚀 PASO 9: ARRANCAR TODO EN LOCAL

### Opción A: Manual (7 terminales)

**Terminal 1 - BOB-BRAIN:**
```bash
cd CLIENDER-OS/BOB-BRAIN
npm run dev
```

**Terminal 2 - FullStackAI Backend:**
```bash
cd CLIENDER-OS/FullStackAI/backend
npm run dev
```

**Terminal 3 - FullStackAI Frontend:**
```bash
cd CLIENDER-OS/FullStackAI/frontend
npm run dev
```

**Terminal 4 - ContentStudio Backend:**
```bash
cd CLIENDER-OS/ContentStudio/backend
npm run dev
```

**Terminal 5 - ContentStudio Frontend:**
```bash
cd CLIENDER-OS/ContentStudio/frontend
npm run dev
```

**Terminal 6 - LeadUp Backend:**
```bash
cd CLIENDER-OS/LeadUp/backend
npm run dev
```

**Terminal 7 - LeadUp Frontend:**
```bash
cd CLIENDER-OS/LeadUp/frontend
npm run dev
```

### Opción B: Con tmux (todas a la vez)
```bash
# Crear archivo: scripts/dev-all.sh
#!/bin/bash

tmux new-session -d -s cliender
tmux send-keys -t cliender "cd BOB-BRAIN && npm run dev" Enter
tmux new-window -t cliender -n fullstack-backend
tmux send-keys -t cliender:fullstack-backend "cd FullStackAI/backend && npm run dev" Enter
# ... etc para cada servicio

# Ejecutar:
bash scripts/dev-all.sh
```

---

## ✅ VERIFICAR QUE TODO FUNCIONA

### Checklist:
```
✅ PostgreSQL corriendo (psql -U fai_user -d cliender_os)
✅ BOB-BRAIN: http://localhost:3005/health (después de crear health endpoint)
✅ FullStackAI Backend: http://localhost:3005/api/health
✅ FullStackAI Frontend: http://localhost:5173
✅ ContentStudio Backend: http://localhost:3006/api/health
✅ ContentStudio Frontend: http://localhost:5174
✅ LeadUp Backend: http://localhost:3007/api/health
✅ LeadUp Frontend: http://localhost:5175
✅ Obsidian: Abre la carpeta OBSIDIAN-VAULT
```

---

## 🔓 PASO 10: CREAR USUARIOS INICIALES

### 10.1 Script de seed (DATABASE/seeds/users.sql)
```sql
INSERT INTO auth.users (email, name, role, password_hash, created_at) VALUES
  ('nicolas@cliender.com', 'Nicolas', 'ADMIN', '$2b$10$...hash...', NOW()),
  ('toni@cliender.com', 'Toni', 'ADMIN', '$2b$10$...hash...', NOW()),
  ('dan@cliender.com', 'Dan', 'ADMIN', '$2b$10$...hash...', NOW()),
  ('creative1@cliender.com', 'Creative 1', 'CREATIVE', '$2b$10$...hash...', NOW()),
  ('leadup1@cliender.com', 'LeadUp Admin 1', 'ADMIN_LEADUP', '$2b$10$...hash...', NOW());
```

### 10.2 Ejecutar seed
```bash
psql -U fai_user -d cliender_os -f DATABASE/seeds/users.sql
```

---

## 📚 SIGUIENTE PASO

Una vez que TODO está arriba:
1. Prueba login en FullStackAI (usa credenciales de admin)
2. Crea tu primer workflow en el canvas
3. Verifica que se guarda en BD
4. Revisa que Obsidian sincronice

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### "psql: command not found"
```bash
# Agregar PostgreSQL al PATH
export PATH="/usr/local/opt/postgresql/bin:$PATH"
```

### "Cannot find module"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### "Port 3005 already in use"
```bash
# Encontrar qué usa el puerto
lsof -i :3005
# Matar el proceso
kill -9 <PID>
```

### "DATABASE_URL undefined"
```bash
# Verificar que .env está en la carpeta correcta
# y que está enlazado (symlink) en cada proyecto
```

---

*Setup generado por Claude Code | CLIENDER OS v1.0 | 2026-04-23*
