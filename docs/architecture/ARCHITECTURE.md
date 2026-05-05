# Arquitectura de ClienderOS V1

## 🏗️ Diagrama General

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                    │
│  React + Vite │ TypeScript │ Responsive Design      │
│  Studio │ LeadUp │ Shared Components                 │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS / WSS
┌──────────────────▼──────────────────────────────────┐
│              NGINX (Reverse Proxy)                   │
│  ├─ / → index.html (SPA routing)                     │
│  ├─ /api/* → backend:3001                           │
│  └─ /socket.io/* → WebSocket                        │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐  ┌───────▼────────┐
│ STUDIO BACKEND │  │ LEADUP BACKEND │
│ Express.js     │  │ Python/Flask   │
│ Port: 3005     │  │ Port: 8002     │
└───────┬────────┘  └───────┬────────┘
        │                   │
        └───────────┬───────┘
                    │
        ┌───────────▼────────────┐
        │   PostgreSQL 16        │
        │ - Usuarios             │
        │ - Clientes             │
        │ - Templates            │
        │ - Leads                │
        │ - Pipeline             │
        └────────────────────────┘
```

## 📚 Stack Tecnológico

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite 5
- **Lenguaje:** TypeScript / JSX
- **Styling:** CSS + Tailwind (opcional)
- **State:** React Context + Hooks
- **HTTP:** fetch API + Socket.io

### Backend (Studio)
- **Runtime:** Node.js v20+
- **Framework:** Express.js 4
- **Language:** JavaScript (ES Modules)
- **DB:** PostgreSQL 16
- **ORM:** pg (raw queries)
- **Auth:** JWT + bcryptjs

### Backend (LeadUp)
- **Runtime:** Python 3.9+
- **Framework:** Flask / FastAPI
- **DB:** PostgreSQL 16
- **Async:** asyncio
- **Features:** Google Maps scraping, AI enrichment

### Infrastructure
- **Containerization:** Docker + Compose
- **Process Manager:** PM2
- **Web Server:** Nginx
- **SSL:** Let's Encrypt + Certbot
- **Version Control:** Git + GitHub

## 🔐 Seguridad

```
┌─────────────────┐
│  HTTPS/TLS      │ Let's Encrypt (renovación automática)
│  (SSL Cert)     │ /etc/letsencrypt/live/
└────────┬────────┘
         │
┌────────▼────────┐
│  JWT Auth       │ Token en localStorage
│  (Stateless)    │ Expiración: 7 días
└────────┬────────┘
         │
┌────────▼────────┐
│  Password Hash  │ bcryptjs (10 salt rounds)
│  (bcrypt)       │ Nunca guardar plain-text
└────────┬────────┘
         │
┌────────▼────────┐
│  Role-Based     │ admin, user, guest
│  Access Control │ Middleware en Express
└─────────────────┘
```

## 🗄️ Base de Datos

### Esquema PostgreSQL

```sql
-- Usuarios (con roles)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clientes (compartidos)
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Plantillas de contenido (por usuario)
CREATE TABLE content_templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  client_id INTEGER REFERENCES clients(id),
  name TEXT NOT NULL,
  nodes JSONB,
  edges JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Estilos fotográficos
CREATE TABLE photography_styles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  is_predefined BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Flujo de Datos

### Creación de Contenido (Studio)
```
1. Usuario login → POST /api/auth/login
2. JWT token generado
3. Frontend almacena token en localStorage
4. API calls incluyen: Authorization: Bearer <token>
5. Backend verifica JWT → extrae user_id
6. Crea template con user_id automaticamente
7. Datos aislados por usuario
```

### Gestión de Leads (LeadUp)
```
1. Scraper Google Maps → leads
2. Claude AI → enriquecimiento
3. Inserta en PostgreSQL
4. Usuario asigna a vendedor
5. Pipeline visual en frontend
6. Webhooks opcionales para integraciones
```

## 🚀 Deployment

### Local (Docker)
```bash
docker-compose up -d
# Automáticamente:
# - Crea DB + tablas
# - Siembra datos iniciales
# - Levanta Studio en :3005
# - Levanta LeadUp en :8002
```

### Producción (VPS)
```bash
# Manual deploy via rsync + PM2
# SSL via Certbot (renovación automática)
# Nginx proxy desde :443 → :3001
```

## 📈 Escalabilidad

### Actual
- Single VPS
- PostgreSQL local
- PM2 en fork mode
- Nginx sin load balancing

### Futuro (recomendado)
- Múltiples servidores
- PostgreSQL en cluster RDS
- PM2 cluster mode
- Load balancer (Nginx, HAProxy)
- CDN para assets

