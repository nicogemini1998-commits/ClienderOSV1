# ClienderOS V1

Sistema integrado de gestión de contenido y CRM.

## 🏗️ Estructura

```
ClienderOSV1/
├── apps/
│   ├── studio/       Herramienta de creación de contenido
│   └── leadup/       CRM para equipos comerciales
├── infrastructure/
│   ├── docker/       Docker Compose + Dockerfiles
│   └── deploy/       Configuraciones de deployment
├── scripts/          Scripts de desarrollo
├── tests/            Pruebas unitarias e integración
└── docs/             Documentación del proyecto
```

## 🚀 Inicio rápido

```bash
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

## 📦 Aplicaciones

### Studio
- Herramienta visual para crear contenido
- Port: 3005
- Tech: React + Node.js + PostgreSQL

### LeadUp
- CRM para gestión de leads
- Port: 8002
- Tech: React + Python + PostgreSQL

## 🔐 Credenciales (Desarrollo)

Studio:
- nicolas@cliender.com / Master123
- toni@cliender.com / Cliender123
- sara@cliender.com / Cliender123
- pablo@cliender.com / Cliender123

## 📚 Documentación

Ver `/docs/` para arquitectura, deployment, y guías.
