#!/bin/bash
set -e

# VPS Deploy Script for Studio
# Usage: cd /path/to/ClienderOSV1 && ./deploy/vps-deploy.sh

VPS_HOST="root@185.97.144.72"
VPS_KEY="$HOME/.ssh/fullstackai_deploy"
VPS_DIR="/var/www/fullstackai"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🚀 ClienderOS Studio Deploy"
echo "============================"
echo ""

# Step 1: Commit current changes
echo "📝 Committing changes..."
cd "$LOCAL_DIR"
if [[ -n $(git status -s) ]]; then
  git add -A
  git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')"
else
  echo "   No changes to commit"
fi

# Step 2: Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

# Step 3: Sync files to VPS
echo "📡 Syncing frontend to VPS..."
rsync -avz -e "ssh -i $VPS_KEY" \
  apps/studio/frontend/src/ \
  root@185.97.144.72:/var/www/fullstackai/frontend/src/ 2>&1 | tail -5

echo "📡 Syncing backend to VPS..."
rsync -avz -e "ssh -i $VPS_KEY" \
  apps/studio/backend/ \
  root@185.97.144.72:/var/www/fullstackai/backend/ \
  --exclude node_modules --exclude .env 2>&1 | tail -5

# Step 4: Rebuild on VPS
echo "🔨 Rebuilding Docker image..."
ssh -i "$VPS_KEY" "$VPS_HOST" << 'SSHSCRIPT'
cd /var/www/fullstackai/docker

# Kill old Node process
pkill -f "node /var/www" 2>/dev/null || true
sleep 2

# Rebuild
docker compose --env-file ../.env down
docker compose --env-file ../.env build --no-cache studio

# Restart
docker compose --env-file ../.env up -d postgres studio

# Wait
sleep 15

# Status
echo ""
echo "✓ Container Status:"
docker compose ps
echo ""
echo "✓ Health:"
curl -s http://localhost:3006/health 2>/dev/null | jq . || echo "Waiting..."
SSHSCRIPT

echo ""
echo "✅ Deploy complete!"
echo ""
echo "📍 Studio: https://fullstackai.cliender.com"
echo "🐛 Logs: ssh -i $VPS_KEY $VPS_HOST 'docker logs -f cliender-studio'"
