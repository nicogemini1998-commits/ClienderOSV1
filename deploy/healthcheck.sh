#!/bin/bash

# Health Check Script for Studio
# Run this in cron: */5 * * * * /var/www/fullstackai/deploy/healthcheck.sh

VPS_DIR="/var/www/fullstackai"
LOG_FILE="$VPS_DIR/healthcheck.log"
ALERT_EMAIL="nicolasa@hbdeuropa.com"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Running health check..." >> "$LOG_FILE"

# Check Studio container
if ! docker ps | grep -q cliender-studio; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Studio container not running!" >> "$LOG_FILE"
    docker compose --env-file ../.env -f "$VPS_DIR/docker/docker-compose.yml" restart studio
    sleep 10
fi

# Check health endpoint
HEALTH=$(curl -s http://localhost:3006/health)
if [[ -z "$HEALTH" || ! "$HEALTH" =~ "ok" ]]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Health endpoint failed!" >> "$LOG_FILE"
    echo "Response: $HEALTH" >> "$LOG_FILE"
    # Alert
    echo "Studio health check failed at $(date)" | mail -s "Alert: Studio Down" "$ALERT_EMAIL"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] OK - All systems healthy" >> "$LOG_FILE"
fi

# Cleanup old logs (keep 30 days)
find "$VPS_DIR" -name "healthcheck.log*" -mtime +30 -delete
