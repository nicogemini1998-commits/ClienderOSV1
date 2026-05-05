# 📦 ClienderOS Studio - Deployment Ready

**Status:** ✅ Production-ready with automated deployment

## Quick Start

```bash
# 1. Make changes locally
cd /Volumes/BOB\ MEMORY/ClienderOSV1
git add .
git commit -m "feat: your change"

# 2. Deploy to production
make deploy
# or: ./deploy/vps-deploy.sh

# 3. Verify
make health
```

## Files You Need to Know

| File | Purpose |
|------|---------|
| `DEPLOY.md` | Full deployment guide + troubleshooting |
| `Makefile` | Quick commands (make deploy, logs, restart, etc) |
| `deploy/vps-deploy.sh` | Automated deployment script |
| `deploy/healthcheck.sh` | Auto-monitoring + restart |
| `deploy/README.md` | Deploy scripts reference |
| `.env.example` | Template for environment variables |
| `.gitignore` | Ensures .env never gets committed |

## Available Commands

```bash
make deploy      # Deploy to VPS (full process)
make logs        # View live logs
make restart     # Restart Studio container
make status      # Show container status
make health      # Health check endpoints
make backup      # Backup database
make clean       # Stop local containers
```

## Production Setup (VPS)

### Configuration
```bash
# VPS IP: 185.97.144.72
# SSH Key: ~/.ssh/fullstackai_deploy
# Studio Port: 3006 (was 3005 - native service conflict)
# DB Port: 5433 (was 5432 - native service conflict)
```

### Environment Variables
Stored in `/var/www/fullstackai/.env` (not in git):
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
KIE_API_KEY=74946423891211d...
```

### Monitoring
```bash
# Real-time logs
make logs

# Health check
make health

# Check containers
make status
```

## Deployment Process (What Happens)

1. **Commit locally** - Git commit with timestamp
2. **Push to GitHub** - Your changes go to GitHub
3. **Sync files** - Frontend/backend source synced to VPS via rsync
4. **Build Docker** - New image built from latest source
5. **Restart containers** - Old container stopped, new one started
6. **Health check** - Waits 15s then verifies endpoints respond
7. **Report status** - Shows container status + health endpoints

**Total time:** ~3-5 minutes

## Key Features

✅ **One-command deployment** - `make deploy` does everything  
✅ **Auto-monitoring** - Healthcheck every 5 minutes  
✅ **Auto-restart** - Fails over automatically if down  
✅ **Database backups** - `make backup` with timestamps  
✅ **Emergency rollback** - Git history available on VPS  
✅ **Simple logging** - `make logs` shows live output  
✅ **Documented** - Guides for every common task  

## Important Rules

🔐 **Security:**
- Never commit `.env` (use `.env.example` as template)
- API keys only in `/var/www/fullstackai/.env` on VPS
- SSH key auth only (no passwords)

⚙️ **API Compliance:**
- ✅ One call per image/video (no duplication)
- ✅ Only `gpt-image-2-text-to-image` for images
- ✅ Only `bytedance/seedance-2` for videos
- ✅ No other models without approval

📡 **Production Notes:**
- Studio runs on port **3006** (reverse proxied by nginx to 3005)
- PostgreSQL on port **5433**
- Both ports changed due to native services occupying 3005/5432

## Troubleshooting

### "Deploy fails"
```bash
make logs  # Check what went wrong
# Most common: API keys not in /var/www/fullstackai/.env
```

### "Container keeps restarting"
```bash
make logs  # Check error messages
# Usually: Database not ready, missing dependencies, or API key issues
```

### "Need to quickly restart"
```bash
make restart  # Instant restart
```

### "Want to see live logs"
```bash
make logs  # Shows docker logs -f
```

## Next Steps (If Something Breaks)

1. **Check logs:** `make logs`
2. **Check health:** `make health`
3. **Restart:** `make restart`
4. **SSH to VPS:** `ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72`
5. **See full guide:** Read `DEPLOY.md`

## Architecture

```
Local Development
├── apps/studio/frontend/src/    (React)
├── apps/studio/backend/         (Node.js)
└── infrastructure/docker/       (Docker configs)

Production (VPS at 185.97.144.72)
├── /var/www/fullstackai/
│   ├── frontend/                (Synced from local)
│   ├── backend/                 (Synced from local)
│   ├── docker/                  (docker-compose + Dockerfiles)
│   ├── .env                     (API keys - never in git)
│   ├── deploy/                  (vps-deploy.sh, healthcheck.sh)
│   └── docker/
│       ├── postgres_data/       (Database volume)
│       └── docker-compose.yml   (Service config)

Reverse Proxy (nginx)
├── https://fullstackai.cliender.com → localhost:3006 (Studio)
```

## Git Workflow

```bash
# Local: Make changes
git add .
git commit -m "feat: description"

# Deploy to production
make deploy

# This automatically:
✓ Pushes to GitHub
✓ Syncs source to VPS
✓ Rebuilds Docker image
✓ Restarts containers
✓ Verifies health
```

## Support

For detailed information:
- 📖 **Full guide:** See `DEPLOY.md`
- 🛠️ **Script reference:** See `deploy/README.md`
- 🔧 **Make commands:** See `Makefile`
- 🚨 **Troubleshooting:** See `DEPLOY.md` → Troubleshooting section

---

**Last Updated:** 2026-05-05  
**Deployment Status:** ✅ Ready for production  
**Monitoring:** ✅ Enabled (cron healthcheck)  
**Auto-Restart:** ✅ Enabled  
**Backups:** ✅ Available via `make backup`  

**Need help?** Check DEPLOY.md or deploy/README.md
