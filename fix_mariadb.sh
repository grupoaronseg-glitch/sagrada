#!/bin/bash

# Script para corrigir problema de autenticação do MariaDB no Kali Linux
echo "🔧 Corrigindo configuração do MariaDB..."

# Parar MariaDB se estiver rodando
sudo systemctl stop mariadb

# Reiniciar MariaDB em modo seguro
echo "📝 Configurando MariaDB..."
sudo systemctl start mariadb

# Aguardar MariaDB inicializar
sleep 3

# Configurar autenticação do usuário root
echo "🔐 Configurando autenticação..."
sudo mysql << EOF
-- Alterar método de autenticação do root
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('root123');

-- Criar usuário autoclick se não existir
DROP USER IF EXISTS 'autoclick'@'localhost';
CREATE USER 'autoclick'@'localhost' IDENTIFIED BY 'autoclick123';

-- Criar database
DROP DATABASE IF EXISTS autoclick_db;
CREATE DATABASE autoclick_db;

-- Dar permissões
GRANT ALL PRIVILEGES ON autoclick_db.* TO 'autoclick'@'localhost';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';
FLUSH PRIVILEGES;

-- Mostrar usuários criados
SELECT User, Host, plugin FROM mysql.user WHERE User IN ('root', 'autoclick');
EOF

if [ $? -eq 0 ]; then
    echo "✅ MariaDB configurado com sucesso!"
    echo ""
    echo "📋 Credenciais configuradas:"
    echo "   Root: usuário='root', senha='root123'"
    echo "   App:  usuário='autoclick', senha='autoclick123'"
    echo "   Database: autoclick_db"
    echo ""
    
    # Testar conexão
    echo "🔍 Testando conexões..."
    
    # Teste com usuário root
    mysql -u root -proot123 -e "SELECT 'Conexão root OK' as status;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Conexão root: OK"
    else
        echo "❌ Conexão root: FALHA"
    fi
    
    # Teste com usuário autoclick
    mysql -u autoclick -pautoclick123 autoclick_db -e "SELECT 'Conexão autoclick OK' as status;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Conexão autoclick: OK"
    else
        echo "❌ Conexão autoclick: FALHA"
    fi
    
else
    echo "❌ Erro na configuração do MariaDB!"
    exit 1
fi