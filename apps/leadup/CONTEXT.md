LeadUp — Documento Completo de Contexto
¿Qué es LeadUp?
LeadUp es una herramienta CRM de prospección automática B2B construida para el equipo comercial de Cliender. Su función principal es generar, enriquecer y distribuir leads calificados diariamente a cada comercial, eliminando el trabajo manual de prospección.

No es un CRM genérico. Es un pipeline cerrado que:

Busca empresas objetivo en España vía Apollo.io
Filtra solo contactos con móvil español válido (+34 6x / +34 7x)
Enriquece cada lead con análisis de IA (Claude Haiku)
Asigna 20 leads/día/usuario automáticamente
Presenta la cola diaria en una interfaz donde el comercial gestiona el estado de cada llamada
¿Para qué fue creada?
Cliender vende servicios de marketing digital, vídeo, CRM y web a empresas del sector construcción y reformas en España. El problema era que el equipo perdía tiempo prospectando manualmente. LeadUp automatiza todo eso:

Sector objetivo: constructoras + empresas de reforma
Ciudades cubiertas: Madrid, Valencia, Barcelona, Sevilla, Bilbao, Zaragoza, Málaga, Alicante
Quota: 20 leads enriquecidos por comercial por día
Exclusión explícita: agencias de marketing, competidores directos, consultoras digitales
Usuarios y Contraseñas
Nombre	Email	Contraseña	Rol
Nicolas	nicolas@cliender.com	[ver .env o gestor de contraseñas]	admin
Toni	toni@cliender.com	[ver .env o gestor de contraseñas]	admin
Dan	dan@cliender.com	[ver .env o gestor de contraseñas]	admin
Rubén	ruben@cliender.com	[ver .env o gestor de contraseñas]	commercial
Ethan	ethan@cliender.com	[ver .env o gestor de contraseñas]	commercial
Roles:

admin — ve analytics globales, puede disparar enrichment manual, ve todos los datos
commercial — solo ve sus 20 leads del día, gestiona estados de llamada
APIs y Credenciales Operativas
Todas las credenciales se configuran en backend/.env (ver backend/.env.example).

Base de Datos (PostgreSQL)

Host:     DB_HOST (default: 127.0.0.1)
Puerto:   DB_PORT (default: 5432)
Base:     DB_NAME
Usuario:  DB_USER
Password: DB_PASSWORD
JWT (autenticación interna)

Secret:   JWT_SECRET (en .env)
Expiry:   8 horas
Algoritmo: HS256
Apollo.io (fuente de leads)

APOLLO_API_KEY=<set en .env>
Usado para buscar personas con cargo en empresas del sector objetivo. Búsqueda paginada con filtros de país (ES), industria, y validación de teléfono.

Anthropic / Claude (enriquecimiento IA)

ANTHROPIC_API_KEY=<set en .env>
Modelo: claude-haiku-4-5-20251001. Genera por cada lead: digital_score, opportunity_level, hooks de conversación, líneas de apertura, análisis de oportunidad. Costo: ~$0.05 por run de 20 leads.

Apify (scraping Google Maps)

APIFY_API_KEY=<set en .env>
Actor: compass~crawler-google-places. Extrae rating GMB, número de reviews, teléfono empresa.

Hostinger API (gestión VPS)

HOSTINGER_API_TOKEN=<set en .env>
Deploy Webhook

DEPLOY_SECRET=<set en .env>
Endpoint: POST /deploy?secret=... — hace git pull + rebuild del frontend en VPS.

Stack Tecnológico
Backend
Lenguaje: Python 3.9
Framework: FastAPI
Puerto: :8002 (producción VPS)
ORM/DB: asyncpg (PostgreSQL async nativo)
Auth: JWT con bcrypt para passwords
Rate limiting: slowapi
Scheduler: APScheduler (asignación diaria automática)
Frontend
Framework: React 18 + Vite
CSS: Tailwind CSS
Puerto dev: :5173
HTTP client: axios (api.js centralizado)
Infraestructura
VPS: Hostinger
Dominio producción: https://leadup.cliender.com
Proxy: nginx (enruta /api/* al puerto 8002)
Proceso backend: uvicorn con nohup o systemd
Deploy: rsync + script deploy-vps.sh
Arquitectura del Código

LeadUp-Standalone/
├── backend/
│   ├── main.py              ← FastAPI app, CORS, lifespan, routers
│   ├── config.py            ← Settings via pydantic-settings + .env
│   ├── database.py          ← Pool asyncpg + migraciones automáticas
│   ├── auth.py              ← JWT verify_token, require_admin
│   ├── create_users.py      ← Script seed usuarios iniciales
│   ├── routers/
│   │   ├── auth.py          ← POST /api/auth/login, /me
│   │   ├── leads.py         ← GET /api/leads/today, PATCH status
│   │   ├── companies.py     ← CRUD empresas
│   │   ├── admin.py         ← Analytics, trigger-enrichment, lead-search-toggle
│   │   ├── apollo.py        ← Endpoint manual Apollo search
│   │   └── notes.py         ← Notas por empresa
│   └── services/
│       ├── apollo_leads.py  ← Pipeline completo: Apollo→Apify→Claude
│       ├── scheduler.py     ← Asignación diaria, assign-now, MAX_PER_SESSION=20
│       ├── enrichment.py    ← Wrapper enrichment para router admin
│       └── fullstackai_client.py ← Cliente HTTP al runner FullStackAI (legado)
│
└── frontend/
    └── src/
        ├── App.jsx           ← Router principal, rutas protegidas
        ├── lib/api.js        ← axios instance con JWT interceptor
        ├── hooks/
        │   ├── useAuth.jsx   ← Context auth global
        │   └── useTheme.js   ← Dark/light mode
        ├── pages/
        │   ├── Login.jsx     ← Form login
        │   ├── Dashboard.jsx ← Cola del día (20 leads)
        │   ├── Pipeline.jsx  ← Vista kanban/pipeline
        │   ├── Analytics.jsx ← Stats admin (solo admins)
        │   ├── Notas.jsx     ← Notas por empresa
        │   └── Ajustes.jsx   ← Toggle lead_search_enabled
        └── components/
            ├── CompanyCard.jsx   ← Tarjeta lead con datos enriquecidos
            ├── CompanyModal.jsx  ← Modal detalle completo
            ├── ContactBadge.jsx  ← Badge contacto con teléfono
            └── StatusBar.jsx     ← Estado llamada (pending/no_answer/closed/rejected)
Base de Datos — Tablas Principales
Tabla	Propósito
lu_users	Usuarios del sistema (id, name, email, password_hash, role, lead_search_enabled)
lu_companies	Empresas prospectadas con todos los datos enriquecidos
lu_contacts	Contactos de cada empresa (nombre, cargo, teléfono, email)
lu_daily_assignments	Asignación empresa↔usuario↔fecha con status de llamada
Constraint clave en lu_daily_assignments: UNIQUE(company_id, user_id) — cada empresa solo se asigna una vez por usuario (dedup per-user, no global).

Pipeline de Leads (Flujo Completo)

Scheduler (manual via /api/admin/assign-now o automático)
    │
    ▼
Apollo.io API
    → Busca personas en constructoras/reformas en ciudad española
    → Filtra: tiene teléfono + es móvil español (6x/7x)
    → Paginación hasta encontrar suficientes (3 páginas max)
    │
    ▼
Filtro deduplicación
    → CHECK lu_daily_assignments WHERE company_id + user_id ya existe
    → Solo pasan leads nuevos para ese usuario
    │
    ▼
Claude Haiku (enriquecimiento)
    → Input: datos empresa (nombre, web, sector, ciudad)
    → Output JSON: digital_score (0-100), opportunity_level,
      redes_sociales, captacion_leads, email_marketing,
      video_contenido, seo_info, oportunidad_hbd,
      hooks[], opening_lines[], opportunity_sales/tech/av
    → Fallback graceful si no hay ANTHROPIC_API_KEY
    │
    ▼
INSERT lu_companies + lu_contacts + lu_daily_assignments
    → Asignado con fecha=hoy, status='pending'
    → Apollo rate limit: sleep 120s entre páginas si necesario
Endpoints API Principales
Método	Ruta	Auth	Descripción
POST	/api/auth/login	—	Login, devuelve JWT
GET	/api/auth/me	JWT	Perfil usuario actual
GET	/api/leads/today	JWT	20 leads del día del usuario
PATCH	/api/leads/{id}/status	JWT	Actualizar estado llamada
POST	/api/admin/assign-now	admin	Triggerear asignación manual
GET	/api/admin/analytics	admin	Stats globales + por comercial
PATCH	/api/admin/lead-search-toggle	JWT	Activar/desactivar búsqueda
POST	/api/admin/trigger-enrichment	admin	Enriquecimiento manual
GET	/health	—	Health check JSON
POST	/deploy?secret=...	secret	Webhook deploy VPS
Estados de un Lead
Estado	Significado
pending	Sin llamar aún (aparece primero)
no_answer	Llamado, no contestó (aparece segundo)
closed	Cerrado / convertido
rejected	Rechazado / no interesa
Cómo Arrancar en Local

# Terminal 1 — Backend
cd LeadUp-Standalone/backend
cp .env.example .env   # rellenar keys reales
python -m uvicorn backend.main:app --reload --port 8002

# Terminal 2 — Frontend
cd LeadUp-Standalone/frontend
npm install
npm run dev   # http://localhost:5173
Requisito previo: PostgreSQL corriendo con base de datos leadup y usuario configurado en .env.

Relación con FullStackAI
LeadUp es un proyecto satélite de FullStackAI. Comparten:

La misma instancia PostgreSQL (distintas bases de datos)
Las API keys del .env
El runner de agentes (FullStackAI corre en :8001)
LeadUp puede operar de forma completamente independiente. La dependencia de FullStackAI es opcional (el campo FULLSTACKAI_URL en config está presente pero el pipeline actual ya no lo requiere).
