#!/bin/bash

# Script para iniciar el servidor de desarrollo de Tuli
# Uso: ./dev.sh

echo "🚀 Iniciando Tuli..."
echo ""

# Definir puerto por defecto
PORT=3000

# Verificar si el puerto está en uso
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  El puerto $PORT ya está en uso"
    echo ""
    echo "¿Quieres cerrar el servidor existente y reiniciar? (s/n)"
    read -r respuesta

    if [ "$respuesta" = "s" ] || [ "$respuesta" = "S" ]; then
        echo "🔄 Cerrando servidor en puerto $PORT..."
        lsof -ti:$PORT | xargs kill -9 2>/dev/null
        sleep 1
        echo "✅ Servidor cerrado"
        echo ""
    else
        echo "ℹ️  El servidor seguirá corriendo en el puerto existente"
        echo "   Si quieres cerrarlo manualmente, usa: ./stop.sh"
        exit 0
    fi
fi

# Iniciar el servidor
echo "🎯 Iniciando servidor en http://localhost:$PORT"
echo ""
npm run dev
