# Setup Local - Desarrollo

## ✅ Requisitos

- **Node.js:** v20+ (v22 recomendado)
- **Docker & Docker Compose:** Latest
- **PostgreSQL:** 16+ (en Docker)
- **Git:** Para control de versión

## 🚀 Pasos de Setup

### 1. Clonar repositorio
```bash
git clone <repo-url> ClienderOS
cd ClienderOS
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus valores
```

### 3. Levantar infraestructura (Docker)
```bash
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

Esto ejecuta:
- PostgreSQL en :5432
- Studio backend en :3005
- LeadUp backend en :8002

### 4. Instalar dependencias
```bash
# Root
npm install

# Studio
cd apps/studio
npm install
npm run dev

# LeadUp (en otra terminal)
cd apps/leadup
npm install
npm run dev
```

### 5. Acceder a aplicaciones

- **Studio:** http://localhost:3005
  - Frontend: npm run dev (Vite dev server en :5173)
  - Backend: npm start (Express en :3005)

- **LeadUp:** http://localhost:8002
  - Frontend: npm run dev
  - Backend: python app.py (Flask en :8002)

## 🧪 Pruebas

### Test de login (Studio)
```bash
curl -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nicolas@cliender.com","password":"Master123"}'

# Deberías obtener un token JWT
```

### Test de API
```bash
# Obtener token
TOKEN=$(curl -s -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nicolas@cliender.com","password":"Master123"}' \
  | jq -r '.token')

# Usar token en requests
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3005/api/styles
```

## 📊 Estructura de directorios

```
ClienderOS/
├── apps/studio/
│   ├── frontend/          # React app (Vite)
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── assets/
│   │   └── package.json
│   └── backend/           # Express server
│       ├── routes/        # Endpoints API
│       ├── utils/         # db.js, logger.js
│       ├── server.js
│       └── package.json
│
├── apps/leadup/
│   ├── frontend/          # React app
│   ├── backend/           # Python backend
│   └── package.json
│
└── infrastructure/docker/
    ├── docker-compose.yml
    ├── Dockerfile.studio
    └── Dockerfile.leadup
```

## 🔧 Comandos útiles

```bash
# Ver logs
docker-compose -f infrastructure/docker/docker-compose.yml logs studio

# Rebuild imagen
docker-compose -f infrastructure/docker/docker-compose.yml up -d --build

# Parar todo
docker-compose -f infrastructure/docker/docker-compose.yml down

# Eliminar volúmenes (cuidado: pierdes datos)
docker-compose -f infrastructure/docker/docker-compose.yml down -v

# Acceder a PostgreSQL
docker exec -it cliender-db psql -U postgres -d cliender
```

## 🐛 Troubleshooting

| Error | Solución |
|-------|----------|
| `Port 3005 already in use` | `lsof -i :3005` y detener proceso |
| `Cannot connect to DB` | Verificar que Docker está corriendo |
| `npm ERR! 404 Not Found` | Limpiar cache: `npm cache clean --force` |
| `ENOENT: no such file` | Ejecutar `npm install` nuevamente |

