#!/bin/bash

# Script de diagnóstico SIMPLES - SQLite
echo "🔍 Diagnóstico AutoClick System (SQLite)"
echo "======================================="

echo "👤 Usuário atual: $USER"
echo "📍 Diretório: $(pwd)"
echo ""

# Testar dependências básicas
echo "📦 Verificando dependências:"
deps=("python3" "node" "yarn" "geckodriver" "firefox" "sqlite3")

for dep in "${deps[@]}"; do
    if command -v "$dep" &> /dev/null; then
        case "$dep" in
            "python3") version=$(python3 --version) ;;
            "node") version=$(node --version) ;;
            "yarn") version=$(yarn --version) ;;
            "geckodriver") version=$(geckodriver --version 2>/dev/null | head -1) ;;
            "firefox") version=$(firefox --version 2>/dev/null) ;;
            "sqlite3") version=$(sqlite3 --version) ;;
            *) version="" ;;
        esac
        echo "✅ $dep: $version"
    else
        echo "❌ $dep: NÃO INSTALADO"
    fi
done

echo ""
echo "📂 Verificando arquivos do projeto:"

# Diretórios
dirs=("backend" "frontend")
for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ Diretório $dir: EXISTE"
    else
        echo "❌ Diretório $dir: NÃO EXISTE"
    fi
done

# Arquivos importantes
files=("backend/requirements.txt" "backend/server.py" "frontend/package.json" "backend/.env")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Arquivo $file: EXISTE"
    else
        echo "❌ Arquivo $file: NÃO EXISTE"
    fi
done

# Verificar banco SQLite
echo ""
echo "🗄️ Verificando banco SQLite:"
if [ -f "backend/autoclick.db" ]; then
    size=$(ls -lh backend/autoclick.db | awk '{print $5}')
    echo "✅ Banco SQLite: EXISTE ($size)"
    
    # Verificar tabelas
    tables=$(sqlite3 backend/autoclick.db ".tables" 2>/dev/null)
    if [ -n "$tables" ]; then
        echo "✅ Tabelas: $tables"
    else
        echo "⚠️  Tabelas: VAZIAS (execute setup_sqlite.sh)"
    fi
else
    echo "❌ Banco SQLite: NÃO EXISTE (execute setup_sqlite.sh)"
fi

# Verificar ambiente Python
echo ""
echo "🐍 Verificando ambiente Python:"
if [ -d "backend/venv" ]; then
    echo "✅ Virtual env: CRIADO"
    
    # Testar ativação
    cd backend
    source venv/bin/activate
    
    # Verificar pacotes principais
    packages=("fastapi" "uvicorn" "sqlalchemy" "selenium")
    for pkg in "${packages[@]}"; do
        if python -c "import $pkg" 2>/dev/null; then
            version=$(python -c "import $pkg; print(getattr($pkg, '__version__', 'unknown'))" 2>/dev/null)
            echo "✅ $pkg: $version"
        else
            echo "❌ $pkg: NÃO INSTALADO"
        fi
    done
    
    cd ..
else
    echo "❌ Virtual env: NÃO CRIADO (execute setup_sqlite.sh)"
fi

# Verificar Node.js
echo ""
echo "⚛️ Verificando ambiente Node.js:"
if [ -d "frontend/node_modules" ]; then
    echo "✅ Node modules: INSTALADO"
else
    echo "❌ Node modules: NÃO INSTALADO (execute setup_sqlite.sh)"
fi

# Verificar processos
echo ""
echo "⚙️ Verificando processos ativos:"
if pgrep -f "python.*server.py" > /dev/null; then
    echo "✅ Backend: RODANDO"
    
    # Testar porta 8001
    if curl -s http://localhost:8001/api/health > /dev/null 2>&1; then
        echo "✅ API: RESPONDENDO (http://localhost:8001)"
    else
        echo "⚠️  API: NÃO RESPONDE"
    fi
else
    echo "⚠️  Backend: NÃO RODANDO"
fi

if pgrep -f "yarn.*dev\|node.*vite" > /dev/null; then
    echo "✅ Frontend: RODANDO"
else
    echo "⚠️  Frontend: NÃO RODANDO"
fi

echo ""
echo "🎯 RESUMO:"
echo "========="

# Contar problemas
problems=0

if ! command -v python3 &> /dev/null; then ((problems++)); fi
if ! command -v node &> /dev/null; then ((problems++)); fi
if ! command -v yarn &> /dev/null; then ((problems++)); fi
if ! command -v geckodriver &> /dev/null; then ((problems++)); fi
if [ ! -d "backend" ]; then ((problems++)); fi
if [ ! -d "frontend" ]; then ((problems++)); fi

if [ $problems -eq 0 ]; then
    echo "🎉 Sistema está PRONTO!"
    echo ""
    echo "🚀 Comandos para usar:"
    echo "   Iniciar: ./start.sh"
    echo "   Parar: pkill -f 'python.*server.py'; pkill -f 'yarn.*dev'"
    echo "   Dashboard: http://localhost:8080"
    echo "   API: http://localhost:8001"
else
    echo "⚠️  $problems problema(s) encontrado(s)"
    echo ""
    echo "🔧 Para resolver:"
    echo "   1. ./install_simple.sh"
    echo "   2. ./setup_sqlite.sh"
fi