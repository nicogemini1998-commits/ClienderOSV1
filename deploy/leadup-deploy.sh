#!/bin/bash
set -e

# VPS Deploy Script for LeadUp
# Usage: cd /path/to/ClienderOSV1 && ./deploy/leadup-deploy.sh

VPS_HOST="root@185.97.144.72"
VPS_KEY="$HOME/.ssh/fullstackai_deploy"
VPS_DIR="/var/www/leadup"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🚀 ClienderOS LeadUp Deploy"
echo "============================"
echo ""

# Step 1: Commit current changes
echo "📝 Committing changes..."
cd "$LOCAL_DIR"
if [[ -n $(git status -s apps/leadup/) ]]; then
  git add apps/leadup/
  git commit -m "deploy(leadup): $(date '+%Y-%m-%d %H:%M')"
else
  echo "   No changes to commit"
fi

# Step 2: Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

# Step 3: Sync files to VPS
echo "📡 Syncing frontend to VPS..."
rsync -avz -e "ssh -i $VPS_KEY" \
  apps/leadup/frontend/src/ \
  root@185.97.144.72:/var/www/leadup/frontend/src/ 2>&1 | tail -5

echo "📡 Syncing frontend public..."
rsync -avz -e "ssh -i $VPS_KEY" \
  apps/leadup/frontend/public/ \
  root@185.97.144.72:/var/www/leadup/frontend/public/ 2>&1 | tail -3

echo "📡 Syncing backend to VPS..."
rsync -avz -e "ssh -i $VPS_KEY" \
  apps/leadup/backend/ \
  root@185.97.144.72:/var/www/leadup/backend/ \
  --exclude "__pycache__" --exclude ".venv" --exclude "*.pyc" --exclude "*.db" --exclude ".env" 2>&1 | tail -5

# Step 4: Rebuild on VPS
echo "🔨 Rebuilding Docker image..."
ssh -i "$VPS_KEY" "$VPS_HOST" << 'SSHSCRIPT'
cd /var/www/fullstackai/docker

# Stop old container
docker compose --env-file ../.env stop leadup 2>/dev/null || true
docker compose --env-file ../.env rm leadup -f 2>/dev/null || true
sleep 2

# Rebuild
docker compose --env-file ../.env build --no-cache leadup

# Restart
docker compose --env-file ../.env up -d postgres leadup

# Wait
sleep 15

# Status
echo ""
echo "✓ Container Status:"
docker compose ps
echo ""
echo "✓ Health:"
curl -s http://localhost:8002/health 2>/dev/null | jq . || echo "Waiting..."
SSHSCRIPT

echo ""
echo "✅ Deploy complete!"
echo ""
echo "📍 LeadUp: https://leadup.cliender.com"
echo "🐛 Logs: ssh -i $VPS_KEY $VPS_HOST 'docker logs -f leadup-backend'"
