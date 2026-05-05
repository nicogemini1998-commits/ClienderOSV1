# LeadUp — CRM de Prospección B2B para Cliender

## Estado: ✅ OPERACIONAL 100%

LeadUp está completamente funcional en Docker en **puerto 8002** con:

- ✅ Backend FastAPI + SQLite
- ✅ Frontend React integrado (served desde backend)
- ✅ 5 leads de prueba pre-cargados para Nicolas
- ✅ Autenticación JWT
- ✅ WhatsApp one-click integration
- ✅ Pipeline Kanban view
- ✅ Scripts library (13 guiones de venta)
- ✅ Follow-up reminders con date picker
- ✅ Analytics dashboard (admin)

---

## Iniciar LeadUp

```bash
cd /Volumes/BOB\ MEMORY/ClienderOSV1
docker-compose up -d leadup
```

El contenedor **carga automáticamente** 5 leads cuando inicia.

---

## Login

**URL:** http://localhost:8002

**Credenciales (Admin):**
- Email: `nicolas@cliender.com`
- Password: `Master123`

---

## Leads Pre-cargados para Nicolas

Al hacer login, verás 5 leads automáticamente asignados:

| Empresa | Ciudad | Score | Oportunidad |
|---------|--------|-------|-------------|
| ConstructHogar Madrid SL | Madrid | 45 | Media |
| Albañilería García y Hijos | Barcelona | 28 | Alta |
| Reformas Integral Sevilla | Sevilla | 12 | Alta |
| Construcciones Modernas Valencia | Valencia | 56 | Media |
| Constructora Andersen SL | Bilbao | 72 | Baja |

Cada lead incluye:
- ✅ 3 hooks de conversación en español
- ✅ 3 opening lines personalizadas
- ✅ Análisis de oportunidad IA
- ✅ Teléfono verificado
- ✅ Contacto directo

---

## Features Principales

### 📊 Dashboard
- Cola diaria de 20 leads por usuario
- Filtros por estado (Pendiente, Sin respuesta, Cerrado, Rechazado)
- Tarjetas con: nombre, score digital, oportunidad, contacto, teléfono

### 💬 WhatsApp Integration
- Botón verde en cada lead
- Abre WhatsApp directamente con opening line pre-cargada

### 📋 Pipeline Kanban
- 4 columnas: Pendiente | Sin Respuesta | Cerrado | Rechazado
- Drag-drop ready
- Cards mini con información esencial

### 📖 Scripts Library
- 13 guiones listos para usar:
  - 5 aperturas de llamada
  - 4 manejos de objeciones
  - 3 cierres y siguientes pasos
  - 3 mensajes WhatsApp
- Botón "Copiar" para pegue directo

### ⏰ Follow-up Reminders
- Date picker en el modal de cada lead
- Badge automático: vencido (🔴) | hoy (🟡) | mañana (🔵) | futuro (⚪)

### 📊 Analytics (Admin)
- Estadísticas globales
- Breakdown por comercial
- Conversion rates

---

## Estructura Backend

```
/apps/leadup/backend/
├── main.py                    # FastAPI app + init en startup
├── init_db.py                 # Carga usuarios y leads de prueba
├── database.py                # SQLite async
├── config.py                  # Settings desde .env
├── auth.py                    # JWT + auth middleware
├── routers/
│   ├── leads.py              # GET /today, PATCH status, PATCH followup
│   ├── auth.py               # POST /login, GET /me
│   ├── admin.py              # Analytics, assign-now, enrichment
│   ├── notes.py              # Notas por lead
│   └── contacts.py           # CRUD contactos
├── services/
│   ├── scheduler.py          # APScheduler (daily assignment)
│   ├── enrichment.py         # Claude Haiku (AI scoring)
│   └── apollo_leads.py       # Lead generation (Apollo.io)
└── requirements.txt          # Python dependencies
```

---

## API Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/login` | - | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Current user |
| GET | `/api/leads/today` | JWT | 20 leads for today |
| PATCH | `/api/leads/{id}/status` | JWT | Update status + notes |
| PATCH | `/api/leads/{id}/followup` | JWT | Set follow-up date |
| GET | `/api/admin/analytics` | admin | Stats |
| POST | `/api/admin/assign-now` | admin | Manual assign |
| PATCH | `/api/admin/lead-search-toggle` | admin | Toggle search per user |
| POST | `/api/admin/trigger-enrichment` | admin | Enrich companies |
| GET | `/health` | - | Health check |

---

## Estructura Frontend

```
/apps/leadup/frontend/
├── src/
│   ├── App.jsx                # Routes + auth guards
│   ├── pages/
│   │   ├── Dashboard.jsx      # Main queue view
│   │   ├── Pipeline.jsx       # Kanban 4 columns
│   │   ├── Scripts.jsx        # Sales scripts library
│   │   ├── Login.jsx          # Auth
│   │   ├── Analytics.jsx      # Admin stats
│   │   └── Ajustes.jsx        # Admin settings
│   ├── components/
│   │   ├── CompanyCard.jsx    # Mini card + WhatsApp button
│   │   ├── CompanyModal.jsx   # Detail view + follow-up picker
│   │   ├── StatusBar.jsx      # 4-state selector
│   │   └── CompanyCard.jsx    # Lead mini card
│   ├── hooks/
│   │   └── useAuth.jsx        # Auth context + JWT
│   └── lib/
│       └── api.js             # Axios instance + endpoints
├── dist/                       # Built static files (served by backend)
└── package.json               # React 18 + Vite + Tailwind
```

---

## Variables de Entorno

El contenedor Docker carga desde env:

```env
PORT=8002
FRONTEND_URL=http://localhost:8002
ENVIRONMENT=development
ANTHROPIC_API_KEY=sk-ant-api03-...  # Para enriquecimiento IA
JWT_SECRET=leadup_secret_jwt_2024_...
APOLLO_API_KEY=...  # Para generación de leads (futuro)
```

Edita `/Volumes/BOB\ MEMORY/ClienderOSV1/.env.docker`

---

## Datos Persistentes

SQLite se guarda en volumen Docker:

```
Volume: clienderosv1_leadup_data
Ubicación: /app/backend/leadup.db (dentro del contenedor)
```

Los datos persisten entre restarts.

---

## Carga de Leads Adicionales

Para añadir más leads desde el API (cuando sea necesario):

1. Admin: `/api/admin/assign-now` → genera nuevos leads automáticamente
2. Usa Apollo.io para buscar prospectos (requiere `APOLLO_API_KEY`)
3. Claude Haiku enriquece automáticamente con scoring + hooks + opening lines

---

## Próximas Mejoras (Roadmap)

- [ ] Email template library
- [ ] SMS integration
- [ ] Real-time CRM sync (Pipedrive/HubSpot)
- [ ] Call recording (Aircall integration)
- [ ] Team collaboration (notes + @mentions)
- [ ] Mobile app (React Native)

---

## Troubleshooting

**Container unhealthy?**
```bash
docker logs cliender-leadup
# Health check busca GET /health
# Debe devolver 200 OK
```

**No se ven los leads?**
```bash
# Verifica que init_db.py se ejecutó:
docker logs cliender-leadup | grep "Query returned"
# Debe mostrar: "Query returned 5 rows"
```

**Password error?**
```bash
# Los usuarios se crean con hash bcrypt
# Credenciales hardcoded en init_db.py
nicolas@cliender.com / Master123  # ✅ Funciona
```

---

## Contacto

- **Tipo:** CRM B2B Prospección
- **Sector:** Construcción + Reformas en España
- **Versión:** 1.0.0
- **Última actualización:** 2026-05-04
