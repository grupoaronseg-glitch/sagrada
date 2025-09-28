#!/bin/bash

# AutoClick System - Configuração com SQLite (SEM MariaDB!)
# Muito mais simples e confiável

echo "⚙️  AutoClick System - Configuração SIMPLES (SQLite)"
echo "==================================================="
echo "✅ SQLite = Sem servidor de banco = Sem dor de cabeça!"
echo ""

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
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual Python..."
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
try:
    import fastapi
    import sqlalchemy
    import selenium
    print('✅ Todas as importações funcionando!')
except ImportError as e:
    print(f'❌ Erro de importação: {e}')
    exit(1)
"

if [ $? -ne 0 ]; then
    echo "❌ Erro nas importações Python!"
    exit 1
fi

# Testar e criar banco SQLite
echo "🗄️ Configurando banco SQLite..."
python test_db.py

if [ $? -eq 0 ]; then
    echo "✅ Banco SQLite configurado!"
    
    # Mostrar onde o arquivo foi criado
    if [ -f "autoclick.db" ]; then
        echo "📁 Arquivo do banco: $(pwd)/autoclick.db"
        echo "📊 Tamanho: $(ls -lh autoclick.db | awk '{print $5}')"
    fi
else
    echo "❌ Erro na configuração do banco SQLite!"
    exit 1
fi

cd ..

# Configurar frontend
echo ""
echo "⚛️  Configurando frontend Node.js..."
cd frontend

# Verificar se Node.js e Yarn estão disponíveis
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado! Execute: ./install_simple.sh"
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
    exit 1
fi

cd ..

echo ""
echo "🎉 Configuração concluída com SUCESSO!"
echo ""
echo "✅ Resumo do que foi configurado:"
echo "   🐍 Python virtual env criado"
echo "   📦 Dependências Python instaladas"
echo "   🗄️ Banco SQLite criado e funcionando"
echo "   ⚛️  Dependências Node.js instaladas"
echo "   🚫 SEM MariaDB/MySQL = SEM problemas!"
echo ""
echo "📁 Arquivos importantes:"
echo "   • backend/autoclick.db (banco de dados)"
echo "   • backend/venv/ (ambiente Python)"
echo "   • frontend/node_modules/ (dependências React)"
echo ""
echo "🚀 Para iniciar o sistema: ./start.sh"