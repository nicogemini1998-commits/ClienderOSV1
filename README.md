# ClienderOS V1

Sistema integrado de gestión de contenido y CRM construido con tecnologías modernas.

## 📦 Aplicaciones

### Studio
Herramienta visual para crear y gestionar contenido con IA.
- **Tech:** React + Express + PostgreSQL
- **Puerto:** 3005
- **Estado:** ✅ Funcional en Docker & Producción
- **Usuarios:** 4 cuentas de desarrollo predefinidas

### LeadUp
CRM para equipos comerciales con gestión de leads y pipeline.
- **Tech:** React + Python + PostgreSQL
- **Puerto:** 8002
- **Estado:** ✅ Funcional en Docker

## 🚀 Inicio rápido

### Local (Docker)
```bash
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

- Studio: http://localhost:3005
- LeadUp: http://localhost:8002
- PostgreSQL: localhost:5432

### Producción (VPS)
Consultar `/docs/deployment/` para instrucciones.

## 🔐 Credenciales (Desarrollo)

```
Studio:
  nicolas@cliender.com / Master123
  toni@cliender.com / Cliender123
  sara@cliender.com / Cliender123
  pablo@cliender.com / Cliender123
```

## 📁 Estructura

```
ClienderOS/
├── apps/                  # Aplicaciones principales
│   ├── studio/           # Tool de creación de contenido
│   ├── leadup/           # CRM comercial
│   └── shared/           # Recursos compartidos
├── infrastructure/        # Deploy y configuración
│   ├── docker/           # Dockerfiles + docker-compose
│   └── deploy/           # Scripts de deployment
├── docs/                 # Documentación
├── scripts/              # Herramientas de desarrollo
├── tests/                # Pruebas automatizadas
└── .tools/               # Herramientas internas

```

## 🛠️ Desarrollo

### Requisitos
- Node.js v20+ (v22 recomendado)
- Docker & Docker Compose
- PostgreSQL 16+

### Setup
```bash
# Variables de entorno
cp .env.example .env

# Instalar dependencias
npm install
cd apps/studio && npm install
cd ../leadup && npm install
```

### Build & Deploy
```bash
# Desarrollo local
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Compilar frontend
cd apps/studio && npm run build
cd ../leadup && npm run build

# Logs en tiempo real
docker-compose -f infrastructure/docker/docker-compose.yml logs -f
```

## 📚 Documentación

- [Arquitectura](docs/architecture/)
- [Deployment](docs/deployment/)
- [API Reference](docs/reference/)
- [Guías de desarrollo](docs/guides/)

## 🔄 Versión Actual

- **Studio:** PostgreSQL backend ✅
- **LeadUp:** Google Maps integration ✅
- **Docker:** Compatible con ARM64 Mac ✅
- **GitHub:** Repositorio sincronizado ✅

## 📝 Notas Importantes

1. **Base de datos:** Usa PostgreSQL (no SQLite). Migración completada.
2. **Frontend SPA:** React Router requiere configuración de nginx para catch-all.
3. **SSL/TLS:** En producción, configurado con Let's Encrypt via Certbot.
4. **PM2:** Gestiona procesos Node.js en VPS.

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| "db.prepare is not a function" | Migración incompleta a PostgreSQL. Actualizar todas las routes. |
| Puerto 3005 en uso | `lsof -i :3005` y detener el proceso anterior. |
| PostgreSQL no conecta | Verificar DB_HOST, DB_USER, DB_PASSWORD en .env |
| Docker build lento | Usar `--no-cache` y limpiar imágenes viejas: `docker system prune` |

## 📊 Estadísticas del Proyecto

- **Líneas de código:** ~15,000+
- **Commits:** 100+
- **Cobertura:** Pruebas en progreso
- **Tiempo de setup:** <5 min (Docker)

---

**Última actualización:** 2026-05-05  
**Mantenedor:** @nicolasag  
**Licencia:** Privado (Cliender)
