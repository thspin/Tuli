#!/bin/bash

# Script para reiniciar el servidor de desarrollo
# Uso: ./restart.sh

echo "🔄 Reiniciando Tuli..."
echo ""

# Detener servidores existentes
./stop.sh

# Esperar un momento
sleep 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Iniciar el servidor
./dev.sh
