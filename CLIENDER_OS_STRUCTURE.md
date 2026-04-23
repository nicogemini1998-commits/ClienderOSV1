# 🏗️ CLIENDER OS — Estructura Maestra
**Versión:** 1.0  
**Estado:** En construcción  
**Última actualización:** 2026-04-23

---

## 📂 ESTRUCTURA GLOBAL (VS CODE)

```
CLIENDER-OS/
│
├── 📦 BOB-BRAIN/                          ← Memoria compartida (Código + Lógica)
│   │
│   ├── 🧠 agentes/                        ← Agentes IA reutilizables
│   │   ├── lead-research.js               ← Analiza leads de GHL
│   │   ├── meeting-analyzer.js            ← Analiza grabaciones Fathom
│   │   ├── proposal-generator.js          ← Genera propuestas
│   │   ├── brand-extractor.js             ← Extrae identidad de marca
│   │   ├── landing-strategist.js          ← Estrategia de landing
│   │   ├── frontend-craftsman.js          ← Genera código React
│   │   ├── kickoff-analyzer.js            ← Analiza kickoff
│   │   └── planner.js                     ← Crea tareas en Planner
│   │
│   ├── 🔌 apis/                           ← Wrappers de APIs externas
│   │   ├── ghl.js                         ← GoHighLevel
│   │   ├── microsoft.js                   ← Microsoft Graph
│   │   ├── fathom.js                      ← Fathom grabaciones
│   │   ├── kie-ai.js                      ← Generador de imágenes/videos
│   │   ├── anthropic.js                   ← Claude SDK wrapper
│   │   └── index.js                       ← Exporta todos los APIs
│   │
│   ├── 📚 memory/                         ← Memoria empresarial
│   │   ├── sops/                          ← Procedimientos estándar
│   │   │   ├── sales-process.md
│   │   │   ├── landing-creation.md
│   │   │   └── content-workflow.md
│   │   ├── templates/                     ← Templates por sector
│   │   │   ├── abogados.json
│   │   │   ├── construccion.json
│   │   │   ├── ecommerce.json
│   │   │   └── tech-consulting.json
│   │   ├── prompts/                       ← Prompts maestros
│   │   │   ├── brand-extraction.txt
│   │   │   ├── lead-analysis.txt
│   │   │   ├── proposal-generation.txt
│   │   │   └── copy-writing.txt
│   │   ├── clients/                       ← Info de clientes
│   │   │   ├── client-001-metadata.json
│   │   │   ├── client-002-metadata.json
│   │   │   └── README.md
│   │   ├── glossary.md                    ← Glosario de términos
│   │   └── README.md                      ← Cómo usar la memoria
│   │
│   ├── 🛠️ utils/                          ← Utilidades compartidas
│   │   ├── db.js                          ← Pool PostgreSQL
│   │   ├── auth.js                        ← JWT + permisos
│   │   ├── logger.js                      ← Logging centralizado
│   │   ├── validators.js                  ← Validaciones
│   │   └── helpers.js                     ← Funciones auxiliares
│   │
│   └── README.md                          ← Documentación BOB-BRAIN
│
│
├── 🎯 FullStackAI/                        ← ORQUESTADOR (Canvas + Agentes)
│   │
│   ├── 📱 frontend/
│   │   ├── src/
│   │   │   ├── App.jsx                    ← Componente principal canvas
│   │   │   ├── main.jsx
│   │   │   ├── index.css
│   │   │   ├── components/
│   │   │   │   ├── Canvas/
│   │   │   │   │   ├── Canvas.jsx
│   │   │   │   │   ├── nodes/
│   │   │   │   │   │   ├── AgentNode.jsx
│   │   │   │   │   │   ├── WorkflowNode.jsx
│   │   │   │   │   │   ├── TriggerNode.jsx
│   │   │   │   │   │   └── NotificationNode.jsx
│   │   │   │   │   └── toolbar/
│   │   │   │   │       ├── AgentPalette.jsx
│   │   │   │   │       ├── WorkflowControls.jsx
│   │   │   │   │       └── SaveLoadPanel.jsx
│   │   │   │   ├── Auth/
│   │   │   │   │   ├── LoginPage.jsx
│   │   │   │   │   ├── RoleGuard.jsx
│   │   │   │   │   └── PermissionCheck.jsx
│   │   │   │   └── Dashboard/
│   │   │   │       ├── ExecutionHistory.jsx
│   │   │   │       ├── LogsViewer.jsx
│   │   │   │       └── StatusOverview.jsx
│   │   │   └── lib/
│   │   │       ├── api.js                 ← Cliente API
│   │   │       ├── socket.js              ← Socket.io client
│   │   │       └── workflows.js           ← Gestión de workflows
│   │   ├── vite.config.js
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── 🔧 backend/
│   │   ├── server.js                      ← Express principal
│   │   ├── routes/
│   │   │   ├── workflows.js               ← CRUD workflows
│   │   │   ├── agents.js                  ← Ejecución de agentes
│   │   │   ├── auth.js                    ← Login, register, permisos
│   │   │   └── health.js                  ← Health check
│   │   ├── middlewares/
│   │   │   ├── auth.js                    ← JWT verification
│   │   │   ├── permission.js              ← Role-based access
│   │   │   └── logging.js                 ← Request logging
│   │   ├── controllers/
│   │   │   ├── workflowController.js
│   │   │   ├── agentController.js
│   │   │   └── authController.js
│   │   ├── socket/
│   │   │   └── handlers.js                ← Socket.io event handlers
│   │   └── package.json
│   │
│   ├── 📚 docs/
│   │   ├── ARCHITECTURE.md                ← Arquitectura detallada
│   │   ├── API_REFERENCE.md               ← Endpoints disponibles
│   │   ├── AGENTS.md                      ← Cómo funcionan agentes
│   │   ├── WORKFLOWS.md                   ← Cómo crear workflows
│   │   └── SETUP.md                       ← Cómo arrancar en local
│   │
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
│
├── 🎨 ContentStudio/                      ← HERRAMIENTA DE CREATIVIDAD
│   │
│   ├── 📱 frontend/
│   │   ├── src/
│   │   │   ├── App.jsx                    ← Canvas de creatividad
│   │   │   ├── components/
│   │   │   │   ├── Canvas/
│   │   │   │   │   ├── CreativeCanvas.jsx
│   │   │   │   │   ├── nodes/
│   │   │   │   │   │   ├── ImageNode.jsx
│   │   │   │   │   │   ├── VideoNode.jsx
│   │   │   │   │   │   └── TextNode.jsx
│   │   │   │   │   └── toolbar/
│   │   │   │   │       ├── ClientSelector.jsx
│   │   │   │   │       ├── StyleGallery.jsx
│   │   │   │   │       ├── TemplateLibrary.jsx
│   │   │   │   │       └── AssetGallery.jsx
│   │   │   │   └── Sidebar/
│   │   │   │       ├── ClientTemplates.jsx
│   │   │   │       └── AssetPreview.jsx
│   │   │   └── lib/
│   │   │       ├── api.js
│   │   │       ├── socket.js
│   │   │       └── templates.js
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── 🔧 backend/
│   │   ├── server.js                      ← Express para ContentStudio
│   │   ├── routes/
│   │   │   ├── images.js                  ← Generar imágenes
│   │   │   ├── videos.js                  ← Generar videos
│   │   │   ├── templates.js               ← CRUD templates
│   │   │   └── assets.js                  ← Galería de assets
│   │   └── package.json
│   │
│   ├── .env.example
│   └── README.md
│
│
├── 🚀 LeadUp/                             ← HERRAMIENTA DE LEADS
│   │
│   ├── 📱 frontend/
│   │   ├── src/
│   │   │   ├── App.jsx
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── CreateTrigger.jsx
│   │   │   │   ├── Results.jsx
│   │   │   │   └── UserManagement.jsx     ← Nueva: gestión de usuarios
│   │   │   └── components/
│   │   │       ├── TriggerForm.jsx
│   │   │       ├── LeadTable.jsx
│   │   │       ├── UserTable.jsx          ← Nueva
│   │   │       └── PermissionControl.jsx  ← Nueva
│   │   └── package.json
│   │
│   ├── 🔧 backend/
│   │   ├── server.js
│   │   ├── routes/
│   │   │   ├── triggers.js
│   │   │   ├── leads.js
│   │   │   ├── results.js
│   │   │   └── users.js                   ← Nueva: manejo de usuarios
│   │   └── package.json
│   │
│   └── README.md
│
│
├── 🏠 SHARED/                             ← Recursos compartidos
│   │
│   ├── 📦 constants/
│   │   ├── roles.js                       ← Definiciones de roles
│   │   ├── permissions.js                 ← Matriz de permisos
│   │   └── environments.js                ← Config por ambiente
│   │
│   ├── 🎨 design-tokens/
│   │   ├── colors.js
│   │   ├── typography.js
│   │   └── spacing.js
│   │
│   ├── 🔐 .env.template
│   │   ├── DATABASE_URL
│   │   ├── ANTHROPIC_API_KEY
│   │   ├── KIE_API_KEY
│   │   ├── GHL_API_KEY
│   │   ├── MICROSOFT_CLIENT_ID
│   │   ├── FATHOM_API_KEY
│   │   ├── JWT_SECRET
│   │   └── etc.
│   │
│   └── 📝 SHARED_SETUP.md
│
│
├── 📊 DATABASE/                           ← Esquema PostgreSQL
│   │
│   ├── schema/
│   │   ├── 001_init.sql                   ← Tablas base
│   │   ├── 002_auth.sql                   ← Usuarios, roles, permisos
│   │   ├── 003_workflows.sql              ← Workflows guardados
│   │   ├── 004_executions.sql             ← Historial ejecuciones
│   │   ├── 005_assets.sql                 ← Imágenes, videos, templates
│   │   └── 006_logs.sql                   ← Auditoría
│   │
│   ├── seeds/
│   │   ├── users.sql                      ← Usuarios iniciales (admin)
│   │   ├── roles.sql                      ← Roles definidos
│   │   └── templates.sql                  ← Templates base
│   │
│   └── README.md
│
│
├── 📚 DOCS/                               ← Documentación general
│   │
│   ├── ARCHITECTURE.md                    ← Arquitectura completa
│   ├── SETUP.md                           ← Cómo arrancar TODO
│   ├── API_SPECIFICATION.md               ← Especificación de APIs
│   ├── DATABASE_SCHEMA.md                 ← Esquema de BD
│   ├── DEPLOYMENT.md                      ← Cómo desplegar
│   ├── SECURITY.md                        ← Seguridad
│   ├── TROUBLESHOOTING.md                 ← Solución de problemas
│   ├── GLOSSARY.md                        ← Glosario de términos
│   ├── WORKFLOWS_EXAMPLES.md              ← Ejemplos de workflows
│   └── TEAM_GUIDE.md                      ← Guía para el equipo
│
│
├── 📁 OBSIDIAN-VAULT/                     ← Memoria en Obsidian (SIN VERSIONADO)
│   │
│   ├── 📌 INDEX.md                        ← Índice central
│   ├── 🧠 BOB-Memory/
│   │   ├── Daily-Notes/
│   │   ├── Clients/
│   │   ├── Workflows/
│   │   ├── Learnings/
│   │   └── Ideas/
│   │
│   ├── 📊 Projects/
│   │   ├── FullStackAI/
│   │   ├── ContentStudio/
│   │   ├── LeadUp/
│   │   └── LandingPro/
│   │
│   ├── 🔗 Links & References/
│   │   ├── APIs/
│   │   ├── Tools/
│   │   └── Integrations/
│   │
│   └── .gitignore                         ← Obsidian NO en Git
│
│
├── .gitignore
├── .gitattributes
├── README.md                              ← README principal
├── ROADMAP.md                             ← Roadmap del proyecto
├── CHANGELOG.md                           ← Cambios por versión
│
└── package.json (monorepo root)

```

---

## 🔐 ESTRUCTURA DE USUARIOS Y PERMISOS

```
ROLES:
├── ADMIN (Nicolas, Toni, Dan)
│   ├── Acceso total a FullStackAI (orquestador)
│   ├── Crear/editar workflows
│   ├── Gestionar usuarios
│   ├── Ver todos los logs
│   ├── Acceso limitado a ContentStudio (solo lectura)
│   └── Acceso limitado a LeadUp (solo monitoreo)
│
├── ADMIN-LEADUP (3 usuarios)
│   ├── Crear triggers de leads
│   ├── Ver/editar resultados
│   ├── Gestionar usuarios LeadUp
│   └── SIN acceso a FullStackAI
│
├── ADMIN-LEADUP-NICOLAS (Nicolas - especial)
│   ├── Sin acceso a crear leads
│   ├── Solo monitoreo y estado
│   ├── Puede ver usuarios y configuración
│   └── SIN acceso a FullStackAI
│
├── CREATIVE (5 usuarios)
│   ├── Acceso total a ContentStudio
│   ├── Crear/editar templates por cliente
│   ├── Generar imágenes y videos
│   ├── Gestionar galería de assets
│   └── SIN acceso a FullStackAI ni LeadUp
│
└── VIEWER (Otros)
    ├── Solo lectura de resultados
    ├── NO puede crear nada
    └── SIN acceso a orquestador
```

---

## 📊 MATRIZ DE PERMISOS

| Acción | Admin | Creative | LeadUp-Admin | Viewer |
|--------|-------|----------|--------------|--------|
| **FullStackAI** | | | | |
| Ver canvas | ✅ | ❌ | ❌ | ❌ |
| Crear workflow | ✅ | ❌ | ❌ | ❌ |
| Ejecutar workflow | ✅ | ❌ | ❌ | ❌ |
| Ver logs | ✅ | ❌ | ❌ | ❌ |
| | | | | |
| **ContentStudio** | | | | |
| Generar imágenes | ✅ | ✅ | ❌ | ❌ |
| Generar videos | ✅ | ✅ | ❌ | ❌ |
| Crear templates | ✅ | ✅ | ❌ | ❌ |
| Cambiar cliente | ✅ | ✅ | ❌ | ❌ |
| Ver galería | ✅ | ✅ | ❌ | ❌ |
| | | | | |
| **LeadUp** | | | | |
| Crear triggers | ✅ | ❌ | ✅ | ❌ |
| Ver leads | ✅ | ❌ | ✅ | ✅ |
| Editar leads | ✅ | ❌ | ✅ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ✅ | ❌ |
| | | | | |
| **Gestión Sistema** | | | | |
| Crear usuarios | ✅ | ❌ | ❌ | ❌ |
| Cambiar roles | ✅ | ❌ | ❌ | ❌ |
| Ver auditoría | ✅ | ❌ | ❌ | ❌ |

---

## 🚀 CÓMO ARRANCAR (LOCAL)

### **Terminal 1: BOB-BRAIN (Servicios compartidos)**
```bash
cd CLIENDER-OS/BOB-BRAIN
npm install
npm run dev  # Para que los cambios se detecten
```

### **Terminal 2: FullStackAI Backend**
```bash
cd CLIENDER-OS/FullStackAI/backend
npm install
npm run dev  # :3005
```

### **Terminal 3: FullStackAI Frontend**
```bash
cd CLIENDER-OS/FullStackAI/frontend
npm install
npm run dev  # localhost:5173
```

### **Terminal 4: ContentStudio Backend**
```bash
cd CLIENDER-OS/ContentStudio/backend
npm install
npm run dev  # :3006
```

### **Terminal 5: ContentStudio Frontend**
```bash
cd CLIENDER-OS/ContentStudio/frontend
npm install
npm run dev  # localhost:5174
```

### **Terminal 6: LeadUp Backend**
```bash
cd CLIENDER-OS/LeadUp/backend
npm install
npm run dev  # :3007
```

### **Terminal 7: LeadUp Frontend**
```bash
cd CLIENDER-OS/LeadUp/frontend
npm install
npm run dev  # localhost:5175
```

---

## 🧠 CÓMO CONECTAR CON OBSIDIAN

### **Paso 1: Crear Obsidian Vault en la carpeta**
```
CLIENDER-OS/OBSIDIAN-VAULT/
```

### **Paso 2: Plugins recomendados**
- **Dataview** — Para queries de memoria
- **Templater** — Para crear documentos automáticos
- **Graph View** — Ver conexiones entre notas
- **File Tree Alternative** — Mejor navegación
- **Quick Switcher Plus** — Búsqueda rápida

### **Paso 3: Estructura de notas**
```
OBSIDIAN-VAULT/
├── 📌 INDEX.md (Nota central)
│   └── Links a:
│       ├── BOB-Memory (Qué sabe BOB)
│       ├── Projects (Estado de cada proyecto)
│       ├── Workflows (Workflows en uso)
│       └── Clients (Info de clientes)
│
├── 🧠 BOB-Memory/
│   ├── Hoy-en-BOB.md (Daily note)
│   ├── Que-he-aprendido.md
│   ├── Clientes.md
│   └── Ideas-pendientes.md
│
└── 📊 Projects/
    ├── FullStackAI.md
    ├── ContentStudio.md
    ├── LeadUp.md
    └── LandingPro.md
```

### **Paso 4: Bot de Obsidian (Automático)**
```javascript
// En FullStackAI/backend/services/obsidian-sync.js
// Cada vez que ocurre algo importante:
// - Se crea una nota en Obsidian
// - Se actualiza el INDEX.md
// - Se conectan los links automáticamente

const syncToObsidian = async (event) => {
  // Crear archivo en OBSIDIAN-VAULT/
  // Actualizar backlinks en INDEX.md
}
```

---

## 📋 CHECKLIST DE SETUP INICIAL

- [ ] Crear estructura de carpetas (copiar de arriba)
- [ ] Inicializar Git en `CLIENDER-OS/`
- [ ] Crear `.env` centralizado en `SHARED/`
- [ ] Crear BD PostgreSQL con esquemas
- [ ] Crear usuarios admin (Nicolas, Toni, Dan)
- [ ] Instalar Obsidian y crear vault
- [ ] Configurar conexión BOB-BRAIN con BD
- [ ] Instalar dependencias en cada proyecto
- [ ] Crear primeros workflows de prueba
- [ ] Sincronizar todo con Obsidian

---

## 🎯 SIGUIENTES PASOS

1. **Hoy (4-5 horas):** Crear estructura y setup DB
2. **Mañana:** Implementar Auth en FullStackAI
3. **Día 3:** Canvas orquestador funcional
4. **Día 4:** Integración primeros agentes
5. **Día 5:** ContentStudio separado y operativo
6. **Día 6:** LeadUp con sistema de usuarios

---

*Documento generado por Claude Code | CLIENDER OS v1.0 | 2026-04-23*
