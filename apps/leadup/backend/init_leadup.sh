#!/bin/bash
set -e

echo "[LeadUp] Inicializando base de datos y cargando datos de prueba..."

# Esperar a que la app esté lista
sleep 5

# Crear usuarios iniciales
python3 create_users.py

# Cargar leads de prueba para Nicolas
python3 seed_test_leads.py

echo "[LeadUp] ✓ Inicialización completada"
