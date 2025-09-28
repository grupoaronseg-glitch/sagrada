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

# Verificar se MariaDB está rodando
if ! systemctl is-active --quiet mariadb; then
    echo "🗄️ Iniciando MariaDB..."
    sudo systemctl start mariadb
    sleep 2
fi

# Testar conexão com banco ANTES de configurar Python
echo "🔍 Testando conexão com banco de dados..."
mysql -u autoclick -pautoclick123 autoclick_db -e "SELECT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Conexão com banco: OK"
else
    echo "❌ Erro de conexão com banco!"
    echo "🔧 Executando correção do MariaDB..."
    
    if [ -f "fix_mariadb.sh" ]; then
        chmod +x fix_mariadb.sh
        ./fix_mariadb.sh
        
        # Testar novamente
        mysql -u autoclick -pautoclick123 autoclick_db -e "SELECT 1;" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Banco corrigido com sucesso!"
        else
            echo "❌ Falha na correção do banco. Execute manualmente:"
            echo "   ./fix_mariadb.sh"
            exit 1
        fi
    else
        echo "❌ Arquivo fix_mariadb.sh não encontrado!"
        echo "Execute primeiro: ./install_kali.sh"
        exit 1
    fi
fi

# Configurar backend
echo ""
echo "🐍 Configurando backend Python..."
cd backend

# Criar e ativar ambiente virtual
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv
fi

source venv/bin/activate

# Verificar se ativação funcionou
if [[ "$VIRTUAL_ENV" != "" ]]; then
    echo "✅ Ambiente virtual ativado: $VIRTUAL_ENV"
else
    echo "❌ Erro ao ativar ambiente virtual!"
    exit 1
fi

# Instalar dependências Python
echo "📦 Instalando dependências Python..."
pip install --upgrade pip
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependências Python instaladas!"
else
    echo "❌ Erro na instalação das dependências Python!"
    exit 1
fi

# Testar importações principais
echo "🔍 Testando importações Python..."
python -c "
import fastapi
import sqlalchemy
import pymysql
import selenium
print('✅ Todas as importações funcionando!')
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Importações Python: OK"
else
    echo "❌ Erro nas importações Python!"
    echo "Reinstale as dependências: pip install -r requirements.txt"
    exit 1
fi

# Testar conexão com banco via Python
echo "🔍 Testando conexão Python → Banco..."
python test_db.py

if [ $? -eq 0 ]; then
    echo "✅ Banco de dados configurado corretamente!"
else
    echo "❌ Erro na configuração do banco de dados!"
    echo "🔧 Possíveis soluções:"
    echo "   1. Execute: ./fix_mariadb.sh"
    echo "   2. Verifique se MariaDB está rodando: sudo systemctl status mariadb"
    echo "   3. Teste conexão manual: mysql -u autoclick -pautoclick123 autoclick_db"
    exit 1
fi

cd ..

# Configurar frontend
echo ""
echo "⚛️  Configurando frontend Node.js..."
cd frontend

# Verificar se Node.js e Yarn estão disponíveis
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado! Execute: ./install_kali.sh"
    exit 1
fi

if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn não encontrado! Execute: sudo npm install -g yarn"
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências Node.js..."
yarn install

if [ $? -eq 0 ]; then
    echo "✅ Dependências Node.js instaladas!"
else
    echo "❌ Erro na instalação das dependências Node.js!"
    echo "🔧 Tente:"
    echo "   rm -rf node_modules yarn.lock"
    echo "   yarn install"
    exit 1
fi

cd ..

echo ""
echo "🎉 Configuração concluída com sucesso!"
echo ""
echo "📋 Resumo:"
echo "   ✅ Python virtual env criado e configurado"
echo "   ✅ Dependências Python instaladas"
echo "   ✅ Banco de dados conectando corretamente"
echo "   ✅ Dependências Node.js instaladas"
echo ""
echo "🚀 Para iniciar o sistema, execute: ./start.sh"