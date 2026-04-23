# 📅 PLAN DE EJECUCIÓN — SEMANA 1
**Objetivo:** Tener FullStackAI + ContentStudio + LeadUp operativos  
**Duración:** 5 días (Lunes a Viernes)  
**Resultado esperado:** Sistema ordenado, escalable y funcional

---

## 🎯 RESUMEN SEMANAL

| Día | Objetivo | Entregables |
|-----|----------|-------------|
| **Lunes** | Setup y estructura | Carpetas + BD + Auth básico |
| **Martes** | FullStackAI orquestador | Canvas + primeros nodos + persistencia |
| **Miércoles** | Agentes ejecutables | 3 agentes BOB funcionando |
| **Jueves** | ContentStudio independiente | Canvas separado operativo |
| **Viernes** | LeadUp con usuarios | Sistema de roles y permisos |

---

## 📋 LUNES: SETUP Y FUNDACIÓN

### Morning (4 horas): Estructura y Bases de Datos

#### 🎯 Tarea 1.1: Crear estructura de carpetas
```bash
# Ejecutar desde CLIENDER-OS/
mkdir -p BOB-BRAIN/{agentes,apis,memory/{sops,templates,prompts,clients},utils}
mkdir -p FullStackAI/{frontend/src/{components,lib,pages},backend/{routes,middlewares,controllers,socket},docs}
mkdir -p ContentStudio/{frontend/src/{components,lib},backend/{routes,controllers}}
mkdir -p LeadUp/{frontend/src/{pages,components},backend/{routes,controllers}}
mkdir -p SHARED/{constants,design-tokens}
mkdir -p DATABASE/{schema,seeds}
mkdir -p DOCS
mkdir -p OBSIDIAN-VAULT/{BOB-Memory,Projects}
```

**✅ Checklist:**
- [ ] Todas las carpetas creadas
- [ ] `.gitignore` actualizado
- [ ] Estructura visible en VS Code

---

#### 🎯 Tarea 1.2: Configurar PostgreSQL
```bash
# 1. Crear usuario y BDs
psql -U postgres
CREATE USER fai_user WITH PASSWORD 'fai_db_2024_secure';
CREATE DATABASE cliender_os OWNER fai_user;
ALTER ROLE fai_user CREATEDB;

# 2. Crear esquemas
psql -U fai_user -d cliender_os
CREATE SCHEMA auth;
CREATE SCHEMA workflows;
CREATE SCHEMA assets;
CREATE SCHEMA logs;
CREATE SCHEMA execution;
```

**✅ Checklist:**
- [ ] Usuario `fai_user` creado
- [ ] BDs `cliender_os` y `landingpro` creadas
- [ ] Esquemas creados
- [ ] Puedo conectarme: `psql -U fai_user -d cliender_os`

---

#### 🎯 Tarea 1.3: Crear `.env` centralizado
**Crear: `SHARED/.env`**
```env
# ===== DATABASE =====
DATABASE_URL=postgresql://fai_user:fai_db_2024_secure@127.0.0.1:5432/cliender_os

# ===== APIS EXTERNAS =====
ANTHROPIC_API_KEY=sk-ant-...
KIE_API_KEY=...
GHL_API_KEY=...
MICROSOFT_CLIENT_ID=...
FATHOM_API_KEY=...

# ===== APLICACIÓN =====
NODE_ENV=development
JWT_SECRET=tu-secret-super-seguro-2024
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

**✅ Checklist:**
- [ ] `.env` creado en SHARED/
- [ ] Todas las variables rellenadas
- [ ] Symlinks creados en cada proyecto

---

### Afternoon (4 horas): Autenticación y Schema

#### 🎯 Tarea 1.4: Crear schema BD (auth + usuarios)
**Crear: `DATABASE/schema/001_auth.sql`**
```sql
-- Schema: auth
CREATE SCHEMA auth;

-- Tabla: users
CREATE TABLE auth.users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'VIEWER',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: roles
CREATE TABLE auth.roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: permissions
CREATE TABLE auth.permissions (
  id BIGSERIAL PRIMARY KEY,
  role_id BIGINT REFERENCES auth.roles(id),
  resource VARCHAR(100),
  action VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_users_role ON auth.users(role);
```

**Ejecutar:**
```bash
psql -U fai_user -d cliender_os -f DATABASE/schema/001_auth.sql
```

**✅ Checklist:**
- [ ] Script SQL creado
- [ ] Schema `auth` existe
- [ ] Tablas creadas correctamente
- [ ] Índices funcionales

---

#### 🎯 Tarea 1.5: Crear tabla de workflows
**Crear: `DATABASE/schema/002_workflows.sql`**
```sql
CREATE SCHEMA workflows;

CREATE TABLE workflows.workflows (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id BIGINT REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'draft',
  definition JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workflows.executions (
  id BIGSERIAL PRIMARY KEY,
  workflow_id BIGINT REFERENCES workflows.workflows(id),
  user_id BIGINT REFERENCES auth.users(id),
  status VARCHAR(50),
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflows_user ON workflows.workflows(user_id);
CREATE INDEX idx_executions_workflow ON workflows.executions(workflow_id);
```

**✅ Checklist:**
- [ ] Tabla `workflows` creada
- [ ] Tabla `executions` creada
- [ ] Relaciones correctas

---

#### 🎯 Tarea 1.6: Seed de usuarios iniciales
**Crear: `DATABASE/seeds/001_init_users.sql`**
```sql
-- Roles
INSERT INTO auth.roles (name, description) VALUES
('ADMIN', 'Acceso total al sistema'),
('CREATIVE', 'Acceso a ContentStudio'),
('ADMIN_LEADUP', 'Administrador de LeadUp'),
('VIEWER', 'Solo lectura');

-- Usuarios (contraseña temporal: changeme123)
INSERT INTO auth.users (email, name, password_hash, role) VALUES
('nicolas@cliender.com', 'Nicolas', '$2b$10$...', 'ADMIN'),
('toni@cliender.com', 'Toni', '$2b$10$...', 'ADMIN'),
('dan@cliender.com', 'Dan', '$2b$10$...', 'ADMIN'),
('creative1@cliender.com', 'Creative 1', '$2b$10$...', 'CREATIVE'),
('leadup-admin@cliender.com', 'LeadUp Admin', '$2b$10$...', 'ADMIN_LEADUP');
```

**Ejecutar:**
```bash
psql -U fai_user -d cliender_os -f DATABASE/seeds/001_init_users.sql
```

**✅ Checklist:**
- [ ] Roles creados
- [ ] Usuarios iniciales creados
- [ ] Puedo hacer SELECT * FROM auth.users

---

## 🛠️ MARTES: FULLSTACKAI ORQUESTADOR

### Morning (4 horas): Backend + Socket.io

#### 🎯 Tarea 2.1: Setup backend FullStackAI
```bash
cd FullStackAI/backend
npm init -y
npm install express socket.io @anthropic-ai/sdk pg jsonwebtoken dotenv cors
npm install --save-dev nodemon
```

**Crear: `FullStackAI/backend/server.js`**
```javascript
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/auth.js';
import workflowRoutes from './routes/workflows.js';
import { authMiddleware } from './middlewares/auth.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'FullStackAI Backend', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/workflows', authMiddleware, workflowRoutes);

// Socket.io
io.on('connection', (socket) => {
  console.log(`✅ Usuario conectado: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`❌ Usuario desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT_FULLSTACK || 3005;
server.listen(PORT, () => {
  console.log(`🚀 FullStackAI Backend en puerto ${PORT}`);
});
```

**✅ Checklist:**
- [ ] `server.js` funciona sin errores
- [ ] `/api/health` responde correctamente
- [ ] Socket.io conecta sin problemas

---

#### 🎯 Tarea 2.2: Crear rutas de autenticación
**Crear: `FullStackAI/backend/routes/auth.js`**
```javascript
import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../lib/db.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await query('SELECT * FROM auth.users WHERE email = $1', [email]);
    
    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

**✅ Checklist:**
- [ ] Ruta `/api/auth/login` funciona
- [ ] JWT se genera correctamente
- [ ] Token incluye rol de usuario

---

#### 🎯 Tarea 2.3: Middleware de autenticación
**Crear: `FullStackAI/backend/middlewares/auth.js`**
```javascript
import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

export const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};
```

**✅ Checklist:**
- [ ] Middleware valida tokens
- [ ] Check de rol funciona
- [ ] Rechaza solicitudes sin token

---

### Afternoon (4 horas): Frontend setup

#### 🎯 Tarea 2.4: Setup frontend React + Vite
```bash
cd FullStackAI/frontend
npm create vite@latest . -- --template react
npm install
npm install @xyflow/react socket.io-client lucide-react tailwindcss
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**✅ Checklist:**
- [ ] Vite corre en `localhost:5173`
- [ ] React renderiza sin errores
- [ ] TailwindCSS funciona

---

#### 🎯 Tarea 2.5: Crear Login page
**Crear: `FullStackAI/frontend/src/pages/Login.jsx`**
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('nicolas@cliender.com');
  const [password, setPassword] = useState('changeme123');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3005/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      navigate('/canvas');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">FullStackAI Orquestador</h1>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
          placeholder="Email"
        />
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
          placeholder="Contraseña"
        />
        <button className="w-full bg-blue-600 p-2 rounded hover:bg-blue-700">
          Ingresar
        </button>
      </form>
    </div>
  );
}
```

**✅ Checklist:**
- [ ] Login page se ve bien
- [ ] Puedo entrar con credenciales de admin
- [ ] Token se guarda en localStorage

---

## 🎨 MIÉRCOLES: AGENTES BOB

### Morning (5 horas): Crear BOB-BRAIN base

#### 🎯 Tarea 3.1: Setup BOB-BRAIN
```bash
cd BOB-BRAIN
npm init -y
npm install @anthropic-ai/sdk pg dotenv
```

**Crear: `BOB-BRAIN/package.json` actualizado**
```json
{
  "name": "bob-brain",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "pg": "^8.13.3",
    "dotenv": "^16.0.3"
  }
}
```

**✅ Checklist:**
- [ ] BOB-BRAIN inicializado
- [ ] Dependencias instaladas

---

#### 🎯 Tarea 3.2: Crear utilidades compartidas
**Crear: `BOB-BRAIN/utils/db.js`**
```javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const query = (text, params) => pool.query(text, params);
export const client = () => pool.connect();
export default pool;
```

**Crear: `BOB-BRAIN/utils/logger.js`**
```javascript
export const logger = {
  info: (msg, data) => console.log(`ℹ️  ${msg}`, data),
  error: (msg, data) => console.error(`❌ ${msg}`, data),
  success: (msg, data) => console.log(`✅ ${msg}`, data),
  warn: (msg, data) => console.warn(`⚠️  ${msg}`, data)
};
```

**✅ Checklist:**
- [ ] DB pool conecta
- [ ] Logger funciona
- [ ] Sin errores al importar

---

#### 🎯 Tarea 3.3: Crear primer agente (Lead Research)
**Crear: `BOB-BRAIN/agentes/lead-research.js`**
```javascript
/**
 * lead-research.js
 * PROPÓSITO: Analizar datos de un lead desde GHL
 * ENTRADA: { website, name, sector }
 * SALIDA: { analysis, urgency_score, suggested_services }
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

const client = new Anthropic();

export const leadResearch = async (leadData) => {
  logger.info('Iniciando Lead Research', { lead: leadData.name });

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Eres un experto en ventas B2B. Analiza este lead y proporciona insights:

Nombre: ${leadData.name}
Website: ${leadData.website}
Sector: ${leadData.sector}

Analiza:
1. Posicionamiento actual
2. Problemas probables (puntos de dolor)
3. Urgencia de la solución (1-10)
4. Servicios de Cliender que podrían ayudar
5. Estrategia de abordaje

Responde en JSON.`
      }]
    });

    const analysis = message.content[0].text;
    logger.info('Lead Research completado', { tokens: message.usage.output_tokens });
    
    return {
      analysis,
      model: 'claude-haiku-4-5',
      tokens_used: message.usage.output_tokens,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error en Lead Research', { error: error.message });
    throw error;
  }
};
```

**✅ Checklist:**
- [ ] Agente creado
- [ ] Logging funciona
- [ ] Respuesta JSON válida

---

#### 🎯 Tarea 3.4: Crear segundo agente (Meeting Analyzer)
**Crear: `BOB-BRAIN/agentes/meeting-analyzer.js`**
```javascript
/**
 * meeting-analyzer.js
 * PROPÓSITO: Analizar transcripción de reunión
 * ENTRADA: { transcription, attendees }
 * SALIDA: { key_points, next_steps, sentiment }
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

const client = new Anthropic();

export const meetingAnalyzer = async (meetingData) => {
  logger.info('Iniciando Meeting Analyzer', { 
    attendees: meetingData.attendees?.length 
  });

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Analiza esta transcripción de reunión de ventas:

Asistentes: ${meetingData.attendees?.join(', ')}

Transcripción:
${meetingData.transcription}

Proporciona:
1. Puntos clave discutidos
2. Objeciones planteadas
3. Próximos pasos acordados
4. Sentimiento general (positivo/neutral/negativo)
5. Probabilidad de cierre (%)

Responde en JSON.`
      }]
    });

    const analysis = message.content[0].text;
    logger.success('Meeting Analyzer completado');
    
    return { analysis, tokens: message.usage.output_tokens };
  } catch (error) {
    logger.error('Error en Meeting Analyzer', { error: error.message });
    throw error;
  }
};
```

**✅ Checklist:**
- [ ] Agente creado
- [ ] Acepta transcripción
- [ ] Devuelve análisis estructurado

---

### Afternoon (3 horas): Integrar agentes en FullStackAI

#### 🎯 Tarea 3.5: Crear rutas de agentes
**Crear: `FullStackAI/backend/routes/agents.js`**
```javascript
import express from 'express';
import { leadResearch, meetingAnalyzer } from '../../BOB-BRAIN/agentes/index.js';
import { logger } from '../../BOB-BRAIN/utils/logger.js';

const router = express.Router();

router.post('/lead-research', async (req, res) => {
  try {
    const result = await leadResearch(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error executing lead-research', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.post('/meeting-analyzer', async (req, res) => {
  try {
    const result = await meetingAnalyzer(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

**✅ Checklist:**
- [ ] Ruta `/api/agents/lead-research` funciona
- [ ] Ruta `/api/agents/meeting-analyzer` funciona
- [ ] Respuestas válidas

---

## 🚀 JUEVES: CONTENTSTUDIO SEPARADO

### Morning + Afternoon (8 horas): Crear ContentStudio

Seguir el mismo patrón que FullStackAI pero con:
- Nodos: `ImageNode`, `VideoNode`, `TextNode`
- Rutas: `/api/generate/image`, `/api/generate/video`
- Frontend: Canvas similar pero enfocado en creatividad
- Backend en puerto 3006

**Entregables:**
- [ ] Login funciona
- [ ] Canvas genera imágenes (KIE AI integrado)
- [ ] Canvas genera videos (KIE AI integrado)
- [ ] Galería de assets por cliente
- [ ] Guardado de templates

---

## 🔵 VIERNES: LEADUP CON USUARIOS

### Morning + Afternoon (8 horas): Sistema de usuarios en LeadUp

**Entregables:**
- [ ] Login para 5 usuarios
- [ ] 3 usuarios como ADMIN_LEADUP
- [ ] 1 usuario (Nicolas) con acceso limitado
- [ ] Tabla de gestión de usuarios (ADMIN)
- [ ] Triggers y leads funcionales

---

## ✅ CHECKLIST FINAL VIERNES

```
FullStackAI:
✅ Backend en puerto 3005 funcionando
✅ Frontend en localhost:5173 sin errores
✅ Auth (login) operativo
✅ 2 agentes BOB ejecutables (lead-research, meeting-analyzer)
✅ Canvas básico renderiza
✅ Workflows se guardan en BD

ContentStudio:
✅ Backend en puerto 3006
✅ Frontend en localhost:5174
✅ Generación de imágenes con KIE AI
✅ Generación de videos con KIE AI
✅ Selector de cliente funciona
✅ Galería de assets por cliente

LeadUp:
✅ Backend en puerto 3007
✅ Frontend en localhost:5175
✅ Login para 5 usuarios
✅ Creación de triggers
✅ Gestión de usuarios para admin

BOB-BRAIN:
✅ Estructura clara
✅ 2 agentes funcionales
✅ APIs wrappers listos
✅ Utils compartidas

BD:
✅ PostgreSQL con 4 esquemas
✅ Usuarios iniciales creados
✅ Tablas de workflows
✅ Tablas de logs

Documentación:
✅ DOCS/ completo
✅ README en cada carpeta
✅ Obsidian vault sincronizado
✅ CHANGELOG actualizado
```

---

**¡Fin de la Semana 1!**

*Si todo sale bien, el lunes empezamos integración de APIs reales (GHL, Microsoft, Fathom).* 🚀
