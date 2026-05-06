#!/bin/bash
set -e

# Update VPS Docker configuration for both Studio and LeadUp
# Usage: cd /path/to/ClienderOSV1 && ./deploy/update-vps-docker.sh

VPS_HOST="root@185.97.144.72"
VPS_KEY="$HOME/.ssh/fullstackai_deploy"
VPS_DOCKER="/var/www/fullstackai/docker"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🔧 Updating VPS Docker Configuration"
echo "===================================="
echo ""

# Step 1: Sync new Dockerfiles
echo "📡 Syncing Dockerfiles to VPS..."
rsync -avz -e "ssh -i $VPS_KEY" \
  infrastructure/docker/Dockerfile.studio \
  infrastructure/docker/Dockerfile.leadup \
  root@185.97.144.72:$VPS_DOCKER/ 2>&1 | tail -3

# Step 2: Sync new docker-compose
echo "📡 Syncing docker-compose-vps.yml to VPS..."
rsync -avz -e "ssh -i $VPS_KEY" \
  infrastructure/docker/docker-compose-vps.yml \
  root@185.97.144.72:$VPS_DOCKER/docker-compose.yml 2>&1 | tail -3

# Step 3: Update on VPS
echo "🔨 Rebuilding containers on VPS..."
ssh -i "$VPS_KEY" "$VPS_HOST" << 'SSHSCRIPT'
cd /var/www/fullstackai/docker

# Stop all containers
echo "Stopping containers..."
docker compose --env-file ../.env down

# Rebuild both
echo "Building Studio..."
docker compose --env-file ../.env build --no-cache studio

echo "Building LeadUp..."
docker compose --env-file ../.env build --no-cache leadup

# Start all
echo "Starting services..."
docker compose --env-file ../.env up -d postgres studio leadup

# Wait
sleep 20

# Status
echo ""
echo "✓ Container Status:"
docker compose ps
echo ""
echo "✓ Health Checks:"
echo "  Studio: $(curl -s http://localhost:3006/health 2>/dev/null | head -c 50)"
echo "  LeadUp: $(curl -s http://localhost:8002/health 2>/dev/null | head -c 50)"
SSHSCRIPT

echo ""
echo "✅ VPS Docker updated!"
echo ""
echo "📍 Studio:  https://fullstackai.cliender.com"
echo "📍 LeadUp:  https://leadup.cliender.com"
