# 🚀 ClienderOS Studio Deployment Guide

## Quick Commands

```bash
# Deploy changes to VPS
./deploy/vps-deploy.sh

# View logs live
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 'docker logs -f cliender-studio'

# SSH into VPS
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72

# Restart containers
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 'cd /var/www/fullstackai/docker && docker compose --env-file ../.env restart studio'
```

## Architecture

### Local Development
```
/Volumes/BOB MEMORY/ClienderOSV1/
├── apps/studio/frontend/src/    (React source)
├── apps/studio/backend/         (Node.js server)
├── infrastructure/docker/       (Docker configs)
└── deploy/                      (Deploy scripts)
```

### Production (VPS)
```
/var/www/fullstackai/
├── frontend/                    (Synced from apps/studio/frontend)
├── backend/                     (Synced from apps/studio/backend)
├── docker/                      (docker-compose + Dockerfiles)
├── .env                         (API keys - NOT in git)
└── docker/postgres_data/        (Database volume)
```

## Ports

| Service | Local | VPS |
|---------|-------|-----|
| Studio | 3005 | 3006 |
| PostgreSQL | 5432 | 5433 |

**Note:** VPS uses different ports because native services occupy 3005/5432.

## Environment Variables

### Local (`.env` in repo root)
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
KIE_API_KEY=74946423891211d...
```

### VPS (`/var/www/fullstackai/.env`)
Same keys, pre-configured. Never commit to git.

## Deployment Process

### 1. Local: Make Changes
```bash
cd /Volumes/BOB\ MEMORY/ClienderOSV1
# Edit files in apps/studio/frontend/src or apps/studio/backend
git add .
git commit -m "feat: description"
```

### 2. Local: Test Locally
```bash
docker-compose -f infrastructure/docker/docker-compose.yml up -d
# Test at http://localhost:3005
docker-compose down
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

## Common Fixes

### Container won't start
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72
docker logs cliender-studio
```

### Need to restart
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72
cd /var/www/fullstackai/docker
docker compose --env-file ../.env restart studio
```

### Update API keys
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72
cat > /var/www/fullstackai/.env << EOF
ANTHROPIC_API_KEY=new_key
KIE_API_KEY=new_key
EOF
cd /var/www/fullstackai/docker
docker compose --env-file ../.env restart studio
```

### Clear database
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72
cd /var/www/fullstackai/docker
docker compose down -v  # Removes volumes
docker compose --env-file ../.env up -d postgres
```

## API Compliance

- ✅ One API call per image/video (no duplication)
- ✅ Only `gpt-image-2-text-to-image` for images
- ✅ Only `bytedance/seedance-2` for videos
- ✅ No other models without explicit approval

See `/apps/studio/backend/routes/kie.js` for enforcement.

## Nginx Configuration

Update `/etc/nginx/sites-available/fullstackai` to proxy port 3006:

```nginx
upstream studio {
    server localhost:3006;
}

server {
    server_name fullstackai.cliender.com;
    
    location / {
        proxy_pass http://studio;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Then reload:
```bash
sudo systemctl reload nginx
```

## Monitoring

### Check all containers
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 \
  'cd /var/www/fullstackai/docker && docker compose ps'
```

### Real-time logs
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 \
  'docker logs -f cliender-studio'
```

### Database backup
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 \
  'docker exec cliender-db pg_dump -U cliender cliender_db > backup.sql'
```

## Git Workflow

1. Work locally in `apps/studio/`
2. Commit to `main`
3. Run `./deploy/vps-deploy.sh`
4. Verify at `https://fullstackai.cliender.com`

**Never commit `.env` files.**

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3005/3006 in use | `lsof -i :3006` and kill process |
| Build fails | Check `docker logs` for npm errors |
| Database connection fails | Verify `DB_HOST=postgres`, `DB_PORT=5432` |
| API keys not working | Verify `--env-file ../.env` in docker-compose command |
| Nginx not proxying | Check upstream, reload nginx |

---

**Last Updated:** 2026-05-05
**Maintainer:** Nicolas AG
