#!/bin/bash

# Script de diagnóstico para AutoClick System
echo "🔍 AutoClick System - Diagnóstico do Sistema"
echo "============================================="

# Função para testar comandos
test_command() {
    local cmd="$1"
    local name="$2"
    
    if command -v "$cmd" &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -n1)
        echo "✅ $name: $version"
    else
        echo "❌ $name: NÃO INSTALADO"
        return 1
    fi
}

# Testar dependências básicas
echo "📦 Verificando dependências..."
test_command python3 "Python3"
test_command pip3 "Pip3"
test_command node "Node.js"
test_command yarn "Yarn"
test_command geckodriver "Geckodriver"
test_command firefox "Firefox"

# Verificar MariaDB
echo ""
echo "🗄️ Verificando MariaDB..."
if systemctl is-active --quiet mariadb; then
    echo "✅ MariaDB: RODANDO"
    
    # Testar conexões de banco
    echo "🔐 Testando conexões de banco..."
    
    # Teste root
    mysql -u root -proot123 -e "SELECT 'OK' as root_connection;" 2>/dev/null > /tmp/root_test.log
    if [ $? -eq 0 ]; then
        echo "✅ Conexão root: OK"
    else
        echo "❌ Conexão root: FALHA"
        echo "   Tente executar: ./fix_mariadb.sh"
    fi
    
    # Teste autoclick
    mysql -u autoclick -pautoclick123 autoclick_db -e "SELECT 'OK' as autoclick_connection;" 2>/dev/null > /tmp/autoclick_test.log
    if [ $? -eq 0 ]; then
        echo "✅ Conexão autoclick: OK"
        
        # Verificar tabelas
        tables=$(mysql -u autoclick -pautoclick123 autoclick_db -e "SHOW TABLES;" 2>/dev/null | wc -l)
        if [ $tables -gt 1 ]; then
            echo "✅ Tabelas criadas: $((tables-1)) tabelas"
        else
            echo "⚠️  Tabelas: NÃO CRIADAS (execute setup.sh)"
        fi
    else
        echo "❌ Conexão autoclick: FALHA"
        echo "   Tente executar: ./fix_mariadb.sh"
    fi
else
    echo "❌ MariaDB: NÃO RODANDO"
    echo "   Execute: sudo systemctl start mariadb"
fi

# Verificar diretórios e arquivos
echo ""
echo "📂 Verificando arquivos do projeto..."

dirs=("backend" "frontend")
for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ Diretório $dir: EXISTE"
    else
        echo "❌ Diretório $dir: NÃO EXISTE"
    fi
done

files=("backend/requirements.txt" "backend/server.py" "frontend/package.json" "backend/.env")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Arquivo $file: EXISTE"
    else
        echo "❌ Arquivo $file: NÃO EXISTE"
    fi
done

# Verificar ambiente Python
echo ""
echo "🐍 Verificando ambiente Python..."
if [ -d "backend/venv" ]; then
    echo "✅ Virtual env: CRIADO"
    
    # Ativar venv e verificar pacotes
    cd backend
    source venv/bin/activate
    
    # Verificar pacotes principais
    packages=("fastapi" "uvicorn" "sqlalchemy" "pymysql" "selenium")
    for pkg in "${packages[@]}"; do
        if python -c "import $pkg" 2>/dev/null; then
            version=$(python -c "import $pkg; print($pkg.__version__)" 2>/dev/null)
            echo "✅ $pkg: $version"
        else
            echo "❌ $pkg: NÃO INSTALADO"
        fi
    done
    
    cd ..
else
    echo "❌ Virtual env: NÃO CRIADO (execute setup.sh)"
fi

# Verificar Node.js
echo ""
echo "⚛️ Verificando ambiente Node.js..."
if [ -d "frontend/node_modules" ]; then
    echo "✅ Node modules: INSTALADO"
else
    echo "❌ Node modules: NÃO INSTALADO (execute setup.sh)"
fi

# Verificar portas
echo ""
echo "🌐 Verificando portas..."
if netstat -tuln 2>/dev/null | grep -q ":8001"; then
    echo "✅ Porta 8001: OCUPADA (backend rodando)"
else
    echo "⚠️  Porta 8001: LIVRE (backend não rodando)"
fi

if netstat -tuln 2>/dev/null | grep -q ":8080"; then
    echo "✅ Porta 8080: OCUPADA (frontend rodando)"
else
    echo "⚠️  Porta 8080: LIVRE (frontend não rodando)"
fi

# Verificar processos
echo ""
echo "⚙️ Verificando processos..."
if pgrep -f "python.*server.py" > /dev/null; then
    echo "✅ Backend: RODANDO"
else
    echo "⚠️  Backend: NÃO RODANDO"
fi

if pgrep -f "yarn.*dev\|node.*vite" > /dev/null; then
    echo "✅ Frontend: RODANDO"
else
    echo "⚠️  Frontend: NÃO RODANDO"
fi

# Limpar arquivos temporários
rm -f /tmp/root_test.log /tmp/autoclick_test.log

echo ""
echo "📋 Diagnóstico concluído!"
echo ""
echo "🔧 Comandos para resolver problemas comuns:"
echo "   - MariaDB: ./fix_mariadb.sh"
echo "   - Ambiente: ./setup.sh"
echo "   - Iniciar: ./start.sh"
echo "   - Parar: pkill -f 'python.*server.py'; pkill -f 'yarn.*dev'"