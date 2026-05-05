.PHONY: help deploy logs restart status health backup clean

VPS_HOST := root@185.97.144.72
VPS_KEY := ~/.ssh/fullstackai_deploy
VPS_DIR := /var/www/fullstackai

help:
	@echo "ClienderOS Studio - Common Commands"
	@echo "===================================="
	@echo ""
	@echo "  make deploy         - Deploy to VPS (git push + rsync + rebuild)"
	@echo "  make logs           - View Studio logs live"
	@echo "  make restart        - Restart Studio container"
	@echo "  make status         - Show container status"
	@echo "  make health         - Check health endpoints"
	@echo "  make backup         - Backup database"
	@echo "  make clean          - Stop all containers locally"
	@echo ""

deploy:
	@echo "🚀 Running deploy script..."
	@./deploy/vps-deploy.sh

logs:
	@ssh -i $(VPS_KEY) $(VPS_HOST) 'docker logs -f cliender-studio'

restart:
	@echo "🔄 Restarting Studio..."
	@ssh -i $(VPS_KEY) $(VPS_HOST) \
		'cd $(VPS_DIR)/docker && docker compose --env-file ../.env restart studio'
	@echo "✓ Restarted"

status:
	@echo "📊 Container Status:"
	@ssh -i $(VPS_KEY) $(VPS_HOST) \
		'cd $(VPS_DIR)/docker && docker compose ps'

health:
	@echo "🏥 Health Checks:"
	@echo ""
	@echo "Studio (3006):"
	@ssh -i $(VPS_KEY) $(VPS_HOST) \
		'curl -s http://localhost:3006/health | jq .'
	@echo ""
	@echo "PostgreSQL (5433):"
	@ssh -i $(VPS_KEY) $(VPS_HOST) \
		'docker exec cliender-db pg_isready -U cliender'

backup:
	@echo "💾 Backing up database..."
	@ssh -i $(VPS_KEY) $(VPS_HOST) \
		'docker exec cliender-db pg_dump -U cliender cliender_db > $(VPS_DIR)/backup_$(shell date +%Y%m%d_%H%M%S).sql'
	@echo "✓ Backup complete"

clean:
	@echo "🧹 Stopping local containers..."
	@docker-compose -f infrastructure/docker/docker-compose.yml down
	@echo "✓ Stopped"

.DEFAULT_GOAL := help
