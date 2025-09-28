#!/bin/bash

# AutoClick System - Script de Inicialização
# Inicia backend e frontend

echo "🚀 Iniciando AutoClick System..."
echo "================================"

# Verificar se MariaDB está rodando
if ! systemctl is-active --quiet mariadb; then
    echo "🗄️ Iniciando MariaDB..."
    sudo systemctl start mariadb
    sleep 2
fi

# Função para matar processos existentes
cleanup() {
    echo "🛑 Parando serviços..."
    pkill -f "python.*server.py" 2>/dev/null
    pkill -f "yarn.*dev" 2>/dev/null
    pkill -f "node.*vite" 2>/dev/null
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT SIGTERM

# Iniciar backend
echo "🐍 Iniciando backend..."
cd backend
source venv/bin/activate
python server.py &
BACKEND_PID=$!
cd ..

# Aguardar backend inicializar
echo "⏳ Aguardando backend inicializar..."
sleep 5

# Testar se backend está rodando
if curl -s http://localhost:8001/api/health > /dev/null; then
    echo "✅ Backend rodando em http://localhost:8001"
else
    echo "❌ Erro: Backend não está respondendo!"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Iniciar frontend
echo "⚛️  Iniciando frontend..."
cd frontend
yarn dev &
FRONTEND_PID=$!
cd ..

# Aguardar frontend inicializar
echo "⏳ Aguardando frontend inicializar..."
sleep 10

echo ""
echo "🎉 Sistema iniciado com sucesso!"
echo ""
echo "📱 Frontend: http://localhost:8080 (ou próxima porta disponível)"
echo "🔧 Backend API: http://localhost:8001"
echo "🗄️ Banco: MySQL rodando na porta 3306"
echo ""
echo "📋 Para parar o sistema, pressione Ctrl+C"
echo ""

# Manter o script rodando
wait