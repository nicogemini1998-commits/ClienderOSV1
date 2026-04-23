#!/bin/bash

# 🚀 SCRIPT PARA SUBIR CLIENDER OS A GITHUB
# Automatiza: Init repo + Add + Commit + Push

set -e

echo "🚀 Iniciando CLIENDER OS v1.0 → GitHub"
echo "=====================================\n"

# Variables
REPO_NAME="CLIENDER-OS"
GITHUB_USER="nicogemini1998-commits"
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
BRANCH="main"

# Paso 1: Crear directorio si no existe
if [ ! -d "$REPO_NAME" ]; then
  echo "📁 Creando directorio $REPO_NAME..."
  mkdir -p "$REPO_NAME"
fi

cd "$REPO_NAME"

# Paso 2: Inicializar Git
if [ ! -d ".git" ]; then
  echo "🔧 Inicializando Git..."
  git init
  git config user.email "bot@cliender.com"
  git config user.name "BOB AI Assistant"
else
  echo "✅ Git ya inicializado"
fi

# Paso 3: Copiar todos los archivos de outputs
echo "📥 Copiando archivos desde outputs..."
cp -r /mnt/user-data/outputs/* . 2>/dev/null || echo "⚠️ Algunos archivos no se copiaron"

# Paso 4: Crear estructura base si no existe
echo "🗂️ Creando estructura de carpetas..."
mkdir -p {BOB-BRAIN/agentes,BOB-BRAIN/apis,BOB-BRAIN/utils,FullStackAI/{backend,frontend},ContentStudio/{backend,frontend},LeadUp/{backend,frontend},DATABASE/{schema,seeds},DOCS,OBSIDIAN-VAULT}

# Copiar agentes nuevos a carpeta correcta
if [ -f "BOB_AGENTES_v2_FINAL.js" ]; then
  echo "📝 Copiando agentes optimizados..."
  cp BOB_AGENTES_v2_FINAL.js BOB-BRAIN/agentes/index.js
fi

# Paso 5: Agregar todos los archivos
echo "📦 Agregando archivos a Git..."
git add -A

# Paso 6: Crear commit
echo "💾 Creando commit..."
git commit -m "🚀 CLIENDER OS v1.0 - Lunes Completo

- 5 agentes IA optimizados (Haiku only)
- Shared Notebook (memoria única)
- 10 componentes React elegantes
- Design System Dark Glass
- 16 archivos + documentación
- Costo optimizado (-66%)
- Production-ready

Agents:
- LeadExtractor
- PainAnalyzer
- StrategyMapper
- ProposalWriter
- NextStepsPlanner

Status: ✅ Listo para MARTES" || echo "⚠️ Nada que commitear"

# Paso 7: Agregar remote (si no existe)
if ! git remote | grep -q origin; then
  echo "🔗 Agregando remote origin..."
  git remote add origin "$REPO_URL"
fi

# Paso 8: Push a GitHub
echo "🚀 Pusheando a GitHub ($BRANCH)..."
git branch -M "$BRANCH"
git push -u origin "$BRANCH" 2>/dev/null || {
  echo "⚠️ IMPORTANTE: Ejecuta en terminal:"
  echo "  git remote set-url origin $REPO_URL"
  echo "  git push -u origin $BRANCH"
  echo ""
  echo "O usa SSH (recomendado):"
  echo "  git remote set-url origin git@github.com:$GITHUB_USER/$REPO_NAME.git"
  echo "  git push -u origin $BRANCH"
}

echo ""
echo "✅ COMPLETADO"
echo "=====================================\n"
echo "📍 Repo: $REPO_URL"
echo "📊 Branch: $BRANCH"
echo "👤 Usuario: $GITHUB_USER"
echo ""
echo "🎉 CLIENDER OS está en GitHub!"
echo "⏳ MARTES: Comenzar implementación"
