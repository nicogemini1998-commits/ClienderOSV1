# 🚀 Deploy Scripts & Tools

Quick reference for deployment, monitoring, and maintenance.

## Scripts

### `vps-deploy.sh` - Full Deployment
Automates the entire deploy process:
1. Commits changes locally
2. Pushes to GitHub
3. Syncs files to VPS via rsync
4. Rebuilds Docker image
5. Restarts containers
6. Verifies health

**Usage:**
```bash
cd /Volumes/BOB\ MEMORY/ClienderOSV1
./deploy/vps-deploy.sh
```

### `healthcheck.sh` - Automatic Monitoring
Monitors Studio health and auto-restarts if needed.

**Setup (run on VPS):**
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72

# Copy script
scp -i ~/.ssh/fullstackai_deploy deploy/healthcheck.sh root@185.97.144.72:/var/www/fullstackai/deploy/

# Make executable
chmod +x /var/www/fullstackai/deploy/healthcheck.sh

# Add to crontab (runs every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/fullstackai/deploy/healthcheck.sh") | crontab -
```

## Makefile Commands

From project root:

```bash
make help          # Show all commands
make deploy        # Deploy to VPS
make logs          # View live logs
make restart       # Restart Studio
make status        # Check container status
make health        # Run health checks
make backup        # Backup database
make clean         # Stop local containers
```

## Common Workflows

### Deploy Changes
```bash
# Make changes locally
cd /Volumes/BOB\ MEMORY/ClienderOSV1
git add .
git commit -m "feat: your change"

# Deploy
make deploy

# Check logs
make logs
```

### Quick Restart
```bash
make restart
```

### Database Backup
```bash
make backup
```

### Emergency Rollback

If deployment breaks:

```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72

cd /var/www/fullstackai/docker

# Go back to last working image
docker compose --env-file ../.env down
git log --oneline  # Find last good commit hash
git checkout <hash>

# Rebuild from that point
docker compose --env-file ../.env build --no-cache studio
docker compose --env-file ../.env up -d postgres studio
```

## Monitoring

### Real-time Logs
```bash
make logs
```

### Status Dashboard
```bash
watch -n 5 'ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 \
  "cd /var/www/fullstackai/docker && docker compose ps && echo && curl -s http://localhost:3006/health | jq ."'
```

### Database Size
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 \
  'docker exec cliender-db du -h /var/lib/postgresql/data'
```

## Troubleshooting

### 1. Deploy fails - "Port already in use"
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72
lsof -i :3006
kill -9 <PID>
```

### 2. Build fails - "npm install error"
```bash
# Check logs
make logs

# Most common: missing API keys in .env
# Verify /var/www/fullstackai/.env has ANTHROPIC_API_KEY and KIE_API_KEY
```

### 3. Container restarts constantly
```bash
make logs

# Common causes:
# - API keys not set
# - Database not healthy
# - Port conflicts
```

### 4. Database connection fails
```bash
# Verify PostgreSQL is running
make status

# Check DB health
make health

# Rebuild clean
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72
cd /var/www/fullstackai/docker
docker compose --env-file ../.env down -v
docker compose --env-file ../.env up -d postgres
```

## Security Notes

- ✅ Never commit `.env` to git
- ✅ Always use SSH key auth (not password)
- ✅ Keep database backups
- ✅ Rotate API keys periodically
- ✅ Use strong DB password in production

## Next Steps

1. **Set up health monitoring:**
   ```bash
   scp deploy/healthcheck.sh root@185.97.144.72:/var/www/fullstackai/deploy/
   ssh root@185.97.144.72 'chmod +x /var/www/fullstackai/deploy/healthcheck.sh'
   ```

2. **Configure nginx** to proxy to port 3006

3. **Test deployment:**
   ```bash
   make deploy
   ```

4. **Verify production:**
   ```bash
   curl https://fullstackai.cliender.com/api/health
   ```

---

**For detailed deployment guide, see:** [../DEPLOY.md](../DEPLOY.md)
