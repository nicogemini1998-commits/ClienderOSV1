# 🚀 ClienderOS Deployment Guide

## Quick Commands

### Studio
```bash
./deploy/vps-deploy.sh                          # Deploy Studio to prod
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 'docker logs -f cliender-studio'
```

### LeadUp
```bash
./deploy/leadup-deploy.sh                       # Deploy LeadUp to prod
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 'docker logs -f leadup-backend'
```

### Both
```bash
./deploy/update-vps-docker.sh                   # Update both Dockerfiles + restart
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 'cd /var/www/fullstackai/docker && docker compose --env-file ../.env ps'
```

---

## Architecture

### Local Development
```
/Volumes/BOB MEMORY/ClienderOSV1/
├── apps/
│   ├── studio/
│   │   ├── frontend/src/
│   │   └── backend/
│   └── leadup/
│       ├── frontend/src/
│       └── backend/
├── infrastructure/docker/
│   ├── Dockerfile.studio
│   ├── Dockerfile.leadup
│   └── docker-compose-vps.yml
└── deploy/
    ├── vps-deploy.sh              (Studio)
    ├── leadup-deploy.sh           (LeadUp)
    └── update-vps-docker.sh       (Both)
```

### Production (VPS: 185.97.144.72)
```
/var/www/fullstackai/
├── frontend/                      (Studio frontend)
├── backend/                       (Studio backend)
├── docker/
│   ├── docker-compose.yml         (Studio + LeadUp + PostgreSQL)
│   ├── Dockerfile.studio
│   └── Dockerfile.leadup
├── .env                           (API keys - NOT in git)
└── docker/postgres_data/          (Database volume)

/var/www/leadup/
├── frontend/                      (LeadUp frontend)
└── backend/                       (LeadUp backend)
```

---

## Ports

| Service | Local | VPS | URL |
|---------|-------|-----|-----|
| Studio Backend | 3005 | 3006 | https://fullstackai.cliender.com |
| Studio Frontend | 5173 | 80/443 nginx | https://fullstackai.cliender.com |
| LeadUp Backend | 8002 | 8002 | https://leadup.cliender.com/api |
| LeadUp Frontend | 5174 | 80/443 nginx | https://leadup.cliender.com |
| PostgreSQL | 5432 | 5433 | -

**Note:** VPS uses different ports (3006, 5433) because native services occupy 3005/5432.

---

## Environment Variables

### Local (`.env` in repo root)
```bash
POSTGRES_USER=cliender
POSTGRES_PASSWORD=cliender_dev_pass_cambia_en_prod
POSTGRES_DB=cliender

ANTHROPIC_API_KEY=sk-ant-api03-...
STUDIO_JWT_SECRET=studio_jwt_dev_secret_...
KIE_API_KEY=...

LEADUP_JWT_SECRET=leadup_jwt_dev_secret_...
LUSHA_API_KEY=...
APOLLO_API_KEY=...
```

### VPS (`/var/www/fullstackai/.env`)
Same structure as local. **Pre-configured. Never commit to git.**

---

## Deployment: Studio

### 1. Make Changes
```bash
cd /Volumes/BOB\ MEMORY/ClienderOSV1
# Edit files in apps/studio/frontend/src or apps/studio/backend
git add .
git commit -m "feat: description"
```

### 2. Test Locally
```bash
docker compose --profile studio up -d
# Test at http://localhost:5173
docker compose down
```

### 3. Deploy to VPS
```bash
./deploy/vps-deploy.sh
```

This script:
- Commits pending changes
- Pushes to GitHub
- Syncs source files to VPS
- Rebuilds Docker image
- Restarts containers
- Verifies health

### 4. Verify Production
```bash
curl https://fullstackai.cliender.com/api/health
```

---

## Deployment: LeadUp

### 1. Make Changes
```bash
cd /Volumes/BOB\ MEMORY/ClienderOSV1
# Edit files in apps/leadup/frontend/src or apps/leadup/backend
git add .
git commit -m "feat(leadup): description"
```

### 2. Test Locally
```bash
docker compose --profile leadup up -d
# Test at http://localhost:5174
docker compose down
```

### 3. Deploy to VPS
```bash
./deploy/leadup-deploy.sh
```

This script:
- Commits changes
- Pushes to GitHub
- Syncs LeadUp frontend + backend to VPS
- Rebuilds LeadUp Docker image
- Restarts LeadUp container
- Verifies health

### 4. Verify Production
```bash
curl https://leadup.cliender.com/api/health
```

---

## Deployment: Update Both (Docker configs)

When updating Dockerfiles or docker-compose configuration:

```bash
./deploy/update-vps-docker.sh
```

This script:
- Syncs new Dockerfiles to VPS
- Syncs new docker-compose.yml to VPS
- Rebuilds both Studio and LeadUp
- Restarts all containers

---

## Common Fixes

### Container won't start (Studio)
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72
docker logs cliender-studio
```

### Container won't start (LeadUp)
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72
docker logs leadup-backend
```

### Restart Studio
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 \
  'cd /var/www/fullstackai/docker && docker compose --env-file ../.env restart studio'
```

### Restart LeadUp
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 \
  'cd /var/www/fullstackai/docker && docker compose --env-file ../.env restart leadup'
```

### Update API keys
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72
cat > /var/www/fullstackai/.env << EOF
POSTGRES_USER=cliender
POSTGRES_PASSWORD=...
ANTHROPIC_API_KEY=new_key
KIE_API_KEY=new_key
LUSHA_API_KEY=new_key
APOLLO_API_KEY=new_key
STUDIO_JWT_SECRET=...
LEADUP_JWT_SECRET=...
EOF
cd /var/www/fullstackai/docker
docker compose --env-file ../.env restart studio leadup
```

### Clear LeadUp database (SQLite reset)
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72
cd /var/www/leadup/backend
rm -f leadup.db  # Will be recreated on next startup
```

---

## Nginx Configuration

Both apps already configured on VPS at:
- `/etc/nginx/sites-enabled/fullstackai` (Studio)
- `/etc/nginx/sites-enabled/leadup.cliender.com` (LeadUp)

Reload nginx if you modify:
```bash
sudo systemctl reload nginx
```

---

## Monitoring

### All containers
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 \
  'cd /var/www/fullstackai/docker && docker compose --env-file ../.env ps'
```

### Real-time logs (Studio)
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 'docker logs -f cliender-studio'
```

### Real-time logs (LeadUp)
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 'docker logs -f leadup-backend'
```

### Database backup
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 \
  'docker exec cliender-db pg_dump -U cliender cliender_db > /tmp/backup.sql && cat /tmp/backup.sql' > backup.sql
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | `lsof -i :8002` and kill process |
| Build fails | Check `docker logs` for npm/pip errors |
| Database connection fails | Verify `DB_HOST=postgres` in .env |
| API keys not working | Verify `--env-file ../.env` in docker-compose |
| Nginx not proxying | Check upstream, reload nginx |
| LeadUp can't connect to API | Check that leadup-backend is running: `docker ps` |

---

## Git Workflow

### For any app (Studio or LeadUp):
1. Work locally in `apps/studio/` or `apps/leadup/`
2. Test locally with Docker Compose
3. Commit: `git add . && git commit -m "..."`
4. Deploy: `./deploy/vps-deploy.sh` (Studio) or `./deploy/leadup-deploy.sh` (LeadUp)
5. Verify in production

**Never commit `.env` files.**

---

**Last Updated:** 2026-05-06
**Maintainer:** Nicolas AG
