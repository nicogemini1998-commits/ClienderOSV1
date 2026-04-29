# 🚀 Cliender OS v1

**Plataforma integrada de IA para orquestación, diseño de contenido y prospección automática**

Herramientas especializadas para generación de contenido visual con IA, orquestación de flujos de trabajo y prospección B2B automática.

---

## ✨ Características

### 🎨 Studio - Diseño de Contenido
- Generación de imágenes con **Flux** (KIE AI)
- Generación de videos con **Seedance 2.0** (KIE AI)
- Enhancement de prompts con Claude Haiku (`/shaq` agent)
- Canvas visual con **ReactFlow**
- Galería integrada con historial

### 🤖 Prospección - LeadUp
- Búsqueda y enriquecimiento automático de leads B2B
- Filtrado por sector (construcción, reformas)
- Distribución diaria a equipo comercial
- Análisis de IA por lead

### 📋 Orquestador [En desarrollo]
- Flujos de trabajo templados
- Ejecución automática de procesos
- Integración con múltiples APIs

### 💰 Optimizado
- APIs eficientes con Claude Haiku
- Caching inteligente
- Arquitectura escalable

---

## 🚀 Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables
cp .env.example .env
# Editar: ANTHROPIC_API_KEY, KIE_API_KEY, JWT_SECRET

# 3. Studio Backend (Terminal 1)
cd apps/studio/backend
npm install
npm start  # Puerto 3005

# 4. Studio Frontend (Terminal 2)
cd apps/studio/frontend
npm install
npm run dev  # Puerto 5177

# 5. Abrir navegador
http://localhost:5177
```

---

## 📊 Arquitectura

```
Studio Frontend (React + ReactFlow)
    ↓ REST API
Studio Backend (Express)
    ↓
Core Bot (Agentes IA + Utilidades)
    ↓
SQLite Database
```

---

## 📁 Estructura Actual

```
ClienderOSV1/
├── apps/
│   ├── studio/              # Herramienta de diseño
│   │   ├── backend/         # Express + rutas KIE/Anthropic
│   │   └── frontend/        # React + ReactFlow canvas
│   ├── orchestrator/        # [En desarrollo]
│   └── leadup/              # Prospección B2B
│
├── core/
│   ├── bot/                 # Agentes IA + executor
│   └── utils/               # Helpers compartidos
│
├── docs/
│   ├── reference/           # Documentación y contextos
│   ├── guides/              # Guías de implementación
│   └── architecture/        # Decisiones técnicas
│
├── data/                    # SQLite database
├── imagenes/                # Screenshots y diseños
├── scripts/                 # Utilidades
└── config/                  # Configuración global
```

---

## 🔧 Tecnologías

**Frontend**
- React 19 + Vite
- ReactFlow (canvas visual)
- Vite + SWC
- Tailwind CSS

**Backend**
- Express.js 4.x
- SQLite3 (better-sqlite3)
- Anthropic SDK
- Node.js (ESM)

**APIs Externas**
- Anthropic Claude (prompts, enhancement)
- KIE AI (generación imagen/video)

---

## 📂 Guía de Uso

### Documentación
Todos los documentos están organizados en `docs/reference/`:
- `BOB_INSTRUCTIONS.md` - Instrucciones principales
- `BOB_AGENTES_v2_EXPLICACION.md` - Arquitectura de agentes
- `CLIENDER_PROJECT_AUDIT.md` - Auditoría del proyecto
- Y más...

### Flujo de Desarrollo
1. **Idea** → Documente en `docs/`
2. **Código** → Organice en `apps/` o `core/`
3. **Commit** → Use mensaje descriptivo
4. **Push** → A rama main

---

## ✅ Estatus de Organización

- ✅ Todas las carpetas tienen propósito claro
- ✅ Documentación centralizada en `docs/reference/`
- ✅ Apps aisladas con estructura uniforme
- ✅ Código compartido en `core/`
- ✅ Sin archivos sueltos en la raíz
- ✅ Estructura lista para escalar

---

**Actualizado**: 2026-04-24  
**Mantenedor**: Cliender Team

## Docker Setup

Proyecto completamente dockerizado. Todos los servicios corren en contenedores aislados:

### Servicios

```
Studio (Node.js + React)      → :3005
LeadUp (Python + React)        → :8002
PostgreSQL (BD compartida)     → :5432
Adminer (UI de BD)            → :8080
```

### Inicio rápido

```bash
# Crear .env desde template
cp .env.docker .env

# Levantar contenedores
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Comandos útiles

```bash
# Detener
docker-compose down

# Reconstruir
docker-compose up --build

# Acceder a shell
docker-compose exec studio sh
docker-compose exec leadup bash
docker-compose exec postgres psql -U cliender cliender_db
```

### Desarrollo

Cambios en backend/frontend se reflejan automáticamente (hot-reload):
- Node: Usa `npm run dev` con `--watch`
- Python: Uvicorn con `reload=true`

Documentación completa: [shared/docs/DOCKER_SETUP.md](shared/docs/DOCKER_SETUP.md)
