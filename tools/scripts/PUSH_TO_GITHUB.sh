#!/bin/bash

# 🚀 Script para subir ClienderOSV1 a GitHub
# 
# Uso:
#   bash PUSH_TO_GITHUB.sh

echo "╔════════════════════════════════════════════════════════╗"
echo "║        🚀 ClienderOSV1 - PUSH A GITHUB 🚀             ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Opción 1: Con SSH (recomendado si ya tienes configurado)
echo "1️⃣  Intentando con SSH..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PUSH EXITOSO con SSH"
    echo "   Tu repositorio: https://github.com/nicogemini1998-commits/ClienderOSV1"
    exit 0
fi

# Opción 2: Con Personal Access Token
echo ""
echo "⚠️  SSH no disponible. Usando HTTPS..."
echo ""
echo "Necesitas un Personal Access Token de GitHub:"
echo "  1. Ve a: https://github.com/settings/tokens"
echo "  2. Crea nuevo token (permisos: repo, workflow)"
echo "  3. Copia el token"
echo ""

read -p "¿Tienes el token? (s/n): " tiene_token

if [ "$tiene_token" = "s" ]; then
    read -sp "Pega tu Personal Access Token: " TOKEN
    echo ""
    
    git push https://${TOKEN}@github.com/nicogemini1998-commits/ClienderOSV1.git
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ PUSH EXITOSO con Token"
        echo "   Tu repositorio: https://github.com/nicogemini1998-commits/ClienderOSV1"
    else
        echo "❌ Error al hacer push"
    fi
else
    echo ""
    echo "Para hacer push manualmente:"
    echo ""
    echo "Opción A: SSH"
    echo "  git push -u origin main"
    echo ""
    echo "Opción B: HTTPS"
    echo "  git push https://TOKEN@github.com/nicogemini1998-commits/ClienderOSV1.git"
    echo ""
    echo "Opción C: Git Credential Storage"
    echo "  git config --global credential.helper store"
    echo "  git push -u origin main"
    echo "  (Pega tu token cuando pida credenciales)"
fi
