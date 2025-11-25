#!/bin/bash

# Script para detener todos los servidores de desarrollo
# Uso: ./stop.sh

echo "🛑 Deteniendo servidores de Tuli..."
echo ""

# Buscar procesos de Next.js en los puertos comunes
PORTS=(3000 3001 3002)
STOPPED=0

for PORT in "${PORTS[@]}"; do
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "🔄 Cerrando servidor en puerto $PORT..."
        lsof -ti:$PORT | xargs kill -9 2>/dev/null
        STOPPED=$((STOPPED + 1))
    fi
done

if [ $STOPPED -eq 0 ]; then
    echo "ℹ️  No hay servidores corriendo"
else
    echo ""
    echo "✅ $STOPPED servidor(es) detenido(s)"
fi

echo ""
echo "Puertos verificados: ${PORTS[*]}"
