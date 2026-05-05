#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_DIR"

echo "🐳 ClienderOS Docker Initialization"
echo "===================================="
echo ""

# Check Docker installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Descárgalo de https://docker.com"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

echo "✓ Docker detectado: $(docker --version)"
echo "✓ Docker Compose detectado: $(docker-compose --version)"
echo ""

# Check if .env exists, if not copy from .env.docker
if [ ! -f .env ]; then
    echo "⚙️  Creando .env desde .env.docker..."
    cp .env.docker .env
    echo "✓ .env creado"
    echo ""
    echo "⚠️  IMPORTANTE: Edita .env con tus claves de API:"
    echo "   - ANTHROPIC_API_KEY"
    echo "   - APOLLO_API_KEY"
    echo "   - POSTGRES_PASSWORD (cambiar para producción)"
    echo ""
else
    echo "✓ .env ya existe"
fi

echo "🔨 Construcción de imágenes..."
docker-compose build

echo ""
echo "🚀 Levantando contenedores..."
docker-compose up -d

echo ""
echo "⏳ Esperando servicios listos..."
sleep 5

# Check health
echo ""
echo "🏥 Estado de servicios:"
docker-compose ps

echo ""
echo "✅ Setup completado!"
echo ""
echo "📍 Accede a:"
echo "   • Studio:  http://localhost:3005"
echo "   • LeadUp:  http://localhost:8002"
echo "   • Adminer: http://localhost:8080 (BD)"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Espera 30s a que levanten completamente"
echo "   2. Abre http://localhost:3005 en el navegador"
echo "   3. Para ver logs: docker-compose logs -f"
echo "   4. Para parar: docker-compose down"
echo ""
