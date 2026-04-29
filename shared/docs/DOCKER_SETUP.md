# Docker Setup — ClienderOS v1

## Overview

Proyecto ejecutando en Docker con contenedores separados para cada app:
- **Studio** — Node.js + React (puerto 3005)
- **LeadUp** — Python + React (puerto 8002)
- **PostgreSQL** — Base de datos compartida (puerto 5432)
- **Adminer** — Web UI para BD (puerto 8080, opcional)

## Requisitos

- Docker Desktop (Mac/Windows) o Docker + Docker Compose (Linux)
- 4GB RAM mínimo
- ~10GB disco para imágenes + volúmenes

## Inicio rápido

### 1. Primer arranque

```bash
# Actualiza variables de entorno si es necesario
cp .env.docker .env

# Construye imágenes y levanta contenedores
docker-compose up --build

# En otra terminal, inicializa base de datos (opcional)
docker-compose exec leadup python create_users.py
```

### 2. Acceso a aplicaciones

| App | URL | Backend |
|-----|-----|---------|
| Studio | http://localhost:3005 | :3005 |
| LeadUp | http://localhost:8002 | :8002 |
| Adminer (DB) | http://localhost:8080 | - |

### 3. Comandos comunes

```bash
# Ver logs en vivo
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f studio
docker-compose logs -f leadup
docker-compose logs -f postgres

# Detener contenedores
docker-compose down

# Parar con volumen de DB preservado
docker-compose down --volumes

# Recrear contenedores
docker-compose up --build --force-recreate

# Acceder a shell de contenedor
docker-compose exec studio sh
docker-compose exec leadup bash
docker-compose exec postgres psql -U cliender cliender_db

# Ver estado de contenedores
docker-compose ps

# Ver recursos usados
docker stats
```

## Desarrollo

### Hot-reload (cambios automáticos)

Ambos contenedores tienen volúmenes mapeados:
- Backend: cambios reflejados al guardar (npm/uvicorn watch)
- Frontend: recarga automática en navegador

```bash
# Studio (Node watches con --watch)
docker-compose up studio

# LeadUp (Uvicorn reload mode activado)
docker-compose up leadup
```

### Variables de entorno

Edita `.env.docker` o `.env` para cambiar:
- Credenciales de BD
- Puertos
- Claves de API (Anthropic, Apollo)
- URLs de frontend/backend

**Importante:** Después de cambiar .env, reconstruye:
```bash
docker-compose up --build
```

## Base de datos

### Conexión desde CLI

```bash
# Desde dentro del contenedor
docker-compose exec postgres psql -U cliender cliender_db

# Desde tu máquina (si tienes psql instalado)
psql -h localhost -U cliender -d cliender_db
# Contraseña: cliender_secure_password_change_me
```

### Adminer (UI web)

Visita http://localhost:8080
- Sistema: PostgreSQL
- Servidor: postgres
- Usuario: cliender
- Contraseña: cliender_secure_password_change_me
- BD: cliender_db

### Volumen de datos

Los datos de BD se guardan en volumen Docker llamado `postgres_data`:
```bash
# Ver volumen
docker volume ls | grep postgres_data

# Inspeccionar
docker volume inspect clienderosv1_postgres_data

# Limpiar volumen (ATENCIÓN: borra todos los datos)
docker volume rm clienderosv1_postgres_data
```

## Troubleshooting

### Puerto ya en uso
```bash
# Encontrar qué está usando el puerto (ej: 3005)
lsof -i :3005

# O cambiar puerto en docker-compose.yml:
# ports:
#   - "3006:3005"  # mapea 3006 en host a 3005 en contenedor
```

### Contenedor no levanta
```bash
# Ver logs de error
docker-compose logs studio  # o leadup
docker-compose logs postgres

# Reconstruir desde cero
docker-compose down --volumes
docker-compose up --build
```

### Base de datos corrupta
```bash
# Eliminar volumen y recrear
docker-compose down --volumes
docker-compose up  # crea nuevo volumen vacío
```

### Aplicación lenta
```bash
# Ver recursos
docker stats

# Si falta RAM, incrementa Docker memory en Settings
# Mac: Docker Desktop → Preferences → Resources → Memory
# Windows: Similar en Docker Desktop settings
```

## Conexión entre servicios

Dentro de la red Docker:
- **Studio → BD**: `postgres:5432` (desde Node.js)
- **LeadUp → BD**: `postgres:5432` (desde Python)
- **Studio → LeadUp API**: `http://leadup:8002` (si necesario)
- **LeadUp → Studio API**: `http://studio:3005` (si necesario)

## Seguridad

⚠️ **Para desarrollo únicamente:**
- Cambia `POSTGRES_PASSWORD` en docker-compose.yml antes de producción
- Cambia `JWT_SECRET` en variables de entorno
- Usa `.env` secreto, no lo commits (ya está en .gitignore)
- Genera claves de API reales (no placeholders)

## Producción

Para deploy en producción:

1. Crea `.env.prod` con valores reales
2. Modifica docker-compose.yml:
   - `NODE_ENV: production`, `ENVIRONMENT: production`
   - Elimina `--watch` en Studio
   - Usa imagen base más pequeña (alpine)
   - Configura reverse proxy (nginx)
   - Usa BD externa (AWS RDS, etc)

3. Deploy con Kubernetes o Docker Swarm

## Resources

- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Node.js Docker](https://hub.docker.com/_/node)
- [Python Docker](https://hub.docker.com/_/python)
