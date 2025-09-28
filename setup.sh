#!/bin/bash

# AutoClick System - Script de Configuração
# Configura o ambiente Python e Node.js

echo "⚙️  AutoClick System - Configuração do Ambiente"
echo "==============================================="

# Verificar se os diretórios existem
if [[ ! -d "backend" || ! -d "frontend" ]]; then
    echo "❌ Erro: Diretórios 'backend' e 'frontend' não encontrados!"
    echo "Certifique-se de estar no diretório raiz do projeto."
    exit 1
fi

# Configurar backend
echo "🐍 Configurando backend Python..."
cd backend

# Criar e ativar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências Python
pip install --upgrade pip
pip install -r requirements.txt

# Testar conexão com banco
echo "🔍 Testando conexão com banco de dados..."
python test_db.py

if [ $? -eq 0 ]; then
    echo "✅ Banco de dados configurado corretamente!"
else
    echo "❌ Erro na configuração do banco de dados!"
    exit 1
fi

cd ..

# Configurar frontend
echo "⚛️  Configurando frontend Node.js..."
cd frontend

# Instalar dependências
yarn install

# Verificar se a instalação foi bem-sucedida
if [ $? -eq 0 ]; then
    echo "✅ Frontend configurado corretamente!"
else
    echo "❌ Erro na configuração do frontend!"
    exit 1
fi

cd ..

echo ""
echo "🎉 Configuração concluída com sucesso!"
echo ""
echo "Para iniciar o sistema, execute: ./start.sh"