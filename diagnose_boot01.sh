#!/bin/bash

# Script de diagnóstico específico para boot01
echo "🔍 Diagnóstico MariaDB para boot01"
echo "=================================="

echo "👤 Usuário atual: $USER"
echo "🏠 Home: $HOME"
echo "📍 Diretório: $(pwd)"

echo ""
echo "🗄️ Status do MariaDB:"
sudo systemctl status mariadb --no-pager -l | head -10

echo ""
echo "🔌 Processos MySQL/MariaDB:"
ps aux | grep -E "(mysql|mariadb)" | grep -v grep

echo ""
echo "🌐 Portas ocupadas (MySQL/MariaDB):"
sudo netstat -tuln | grep -E "(3306|3307)" || echo "Nenhuma porta MySQL ocupada"

echo ""
echo "📁 Arquivos de socket:"
ls -la /var/run/mysqld/ 2>/dev/null || echo "❌ Diretório /var/run/mysqld não existe"
ls -la /tmp/mysql* 2>/dev/null || echo "❌ Sem arquivos mysql em /tmp"

echo ""
echo "🔐 Testando acessos MariaDB:"

# Teste 1: Root sem senha (padrão Kali)
echo "Teste 1: Root sem senha..."
sudo mysql -e "SELECT 'Root sem senha OK' as status;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Root sem senha: OK"
    ROOT_ACCESS="no_password"
else
    echo "❌ Root sem senha: FALHA"
fi

# Teste 2: Root com senha boot01
echo "Teste 2: Root com senha boot01..."
mysql -u root -pboot01 -e "SELECT 'Root com boot01 OK' as status;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Root com boot01: OK"
    ROOT_ACCESS="boot01"
else
    echo "❌ Root com boot01: FALHA"
fi

# Teste 3: Root com senha vazia
echo "Teste 3: Root com senha vazia..."
mysql -u root -e "SELECT 'Root senha vazia OK' as status;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Root senha vazia: OK"
    ROOT_ACCESS="empty"
else
    echo "❌ Root senha vazia: FALHA"
fi

# Teste 4: Autoclick user
echo "Teste 4: Usuário autoclick..."
mysql -u autoclick -pautoclick123 -e "SELECT 'Autoclick OK' as status;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Autoclick: OK"
else
    echo "❌ Autoclick: FALHA"
fi

echo ""
echo "📋 Informações de usuários MySQL:"
if [ "$ROOT_ACCESS" = "no_password" ]; then
    sudo mysql -e "SELECT User, Host, plugin, authentication_string FROM mysql.user;" 2>/dev/null
elif [ "$ROOT_ACCESS" = "boot01" ]; then
    mysql -u root -pboot01 -e "SELECT User, Host, plugin, authentication_string FROM mysql.user;" 2>/dev/null
elif [ "$ROOT_ACCESS" = "empty" ]; then
    mysql -u root -e "SELECT User, Host, plugin, authentication_string FROM mysql.user;" 2>/dev/null
else
    echo "❌ Nenhum método de acesso funcionou"
fi

echo ""
echo "📊 Databases existentes:"
if [ "$ROOT_ACCESS" = "no_password" ]; then
    sudo mysql -e "SHOW DATABASES;" 2>/dev/null
elif [ "$ROOT_ACCESS" = "boot01" ]; then
    mysql -u root -pboot01 -e "SHOW DATABASES;" 2>/dev/null
elif [ "$ROOT_ACCESS" = "empty" ]; then
    mysql -u root -e "SHOW DATABASES;" 2>/dev/null
fi

echo ""
echo "📝 Logs do MariaDB (últimas 10 linhas):"
sudo tail -10 /var/log/mysql/error.log 2>/dev/null || echo "❌ Log não encontrado"

echo ""
echo "🔧 Arquivo de configuração MariaDB:"
ls -la /etc/mysql/ 2>/dev/null || echo "❌ Diretório de configuração não encontrado"

echo ""
echo "💾 Espaço em disco:"
df -h / | head -2

echo ""
echo "🎯 RESUMO:"
echo "========="
if [ -n "$ROOT_ACCESS" ]; then
    echo "✅ MariaDB está acessível"
    echo "📋 Método de acesso: $ROOT_ACCESS"
    
    case $ROOT_ACCESS in
        "no_password")
            echo "🔧 Para criar usuário autoclick, execute:"
            echo "   sudo mysql < script_mysql.sql"
            ;;
        "boot01")
            echo "🔧 Para criar usuário autoclick, execute:"
            echo "   mysql -u root -pboot01 < script_mysql.sql"
            ;;
        "empty")
            echo "🔧 Para criar usuário autoclick, execute:"
            echo "   mysql -u root < script_mysql.sql"
            ;;
    esac
else
    echo "❌ MariaDB não está acessível"
    echo "🔧 Soluções:"
    echo "   1. sudo systemctl restart mariadb"
    echo "   2. ./fix_mariadb_advanced.sh"
    echo "   3. Reinstalar: sudo apt remove --purge mariadb-server && sudo apt install mariadb-server"
fi