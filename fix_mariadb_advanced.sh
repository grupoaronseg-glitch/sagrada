#!/bin/bash

# Script de correção avançada para MariaDB no Kali Linux
# Para usuário: boot01

echo "🔧 Correção Avançada do MariaDB para boot01"
echo "============================================="

# Verificar se está rodando como usuário correto
if [ "$USER" != "boot01" ]; then
    echo "⚠️  Execute este script como usuário boot01"
    echo "Usuário atual: $USER"
fi

# Parar MariaDB primeiro
echo "🛑 Parando MariaDB..."
sudo systemctl stop mariadb
sleep 2

# Verificar se há processos MySQL/MariaDB rodando
sudo pkill -f mysql 2>/dev/null || true
sudo pkill -f mariadb 2>/dev/null || true

# Verificar arquivos de socket
echo "🔍 Limpando arquivos de socket..."
sudo rm -f /var/run/mysqld/mysqld.sock
sudo rm -f /tmp/mysql.sock

# Garantir que o diretório existe
sudo mkdir -p /var/run/mysqld
sudo chown mysql:mysql /var/run/mysqld

# Reiniciar MariaDB
echo "🚀 Reiniciando MariaDB..."
sudo systemctl start mariadb

# Aguardar inicialização
sleep 5

# Verificar se está rodando
if ! sudo systemctl is-active --quiet mariadb; then
    echo "❌ MariaDB não conseguiu iniciar!"
    echo "Verificando logs..."
    sudo journalctl -u mariadb --no-pager -l -n 20
    exit 1
fi

echo "✅ MariaDB iniciado com sucesso"

# Método 1: Tentar como root sem senha (padrão no Kali)
echo ""
echo "🔐 Método 1: Tentando acesso root sem senha..."
sudo mysql << 'EOF'
-- Resetar usuário root
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('boot01');
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Root configurado com senha boot01"
    ROOT_PASSWORD="boot01"
else
    echo "⚠️  Método 1 falhou, tentando método 2..."
    
    # Método 2: Usar mysql_secure_installation reset
    echo "🔐 Método 2: Reset completo do MariaDB..."
    
    sudo systemctl stop mariadb
    
    # Iniciar em modo seguro
    sudo mysqld_safe --skip-grant-tables --skip-networking &
    SAFE_PID=$!
    sleep 5
    
    # Resetar senha
    mysql << 'EOF'
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('boot01');
FLUSH PRIVILEGES;
EOF
    
    # Matar processo seguro
    sudo kill $SAFE_PID 2>/dev/null
    sudo pkill mysqld_safe 2>/dev/null
    sleep 2
    
    # Reiniciar normalmente
    sudo systemctl start mariadb
    sleep 3
    
    ROOT_PASSWORD="boot01"
fi

# Testar conexão root
echo ""
echo "🔍 Testando conexão root..."
mysql -u root -p${ROOT_PASSWORD} -e "SELECT 'Root conectou OK' as status;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Conexão root: OK"
    
    # Criar usuário autoclick
    echo "👤 Criando usuário autoclick..."
    
    mysql -u root -p${ROOT_PASSWORD} << EOF
-- Remover usuário se existir
DROP USER IF EXISTS 'autoclick'@'localhost';
DROP USER IF EXISTS 'autoclick'@'%';

-- Criar usuário autoclick
CREATE USER 'autoclick'@'localhost' IDENTIFIED BY 'autoclick123';

-- Remover database se existir
DROP DATABASE IF EXISTS autoclick_db;

-- Criar database
CREATE DATABASE autoclick_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Dar todas as permissões
GRANT ALL PRIVILEGES ON autoclick_db.* TO 'autoclick'@'localhost';
GRANT PROCESS ON *.* TO 'autoclick'@'localhost';
FLUSH PRIVILEGES;

-- Mostrar usuários criados
SELECT User, Host, plugin FROM mysql.user WHERE User IN ('root', 'autoclick');

-- Mostrar databases
SHOW DATABASES;
EOF
    
    if [ $? -eq 0 ]; then
        echo "✅ Usuário autoclick criado com sucesso"
        
        # Testar conexão autoclick
        echo "🔍 Testando conexão autoclick..."
        mysql -u autoclick -pautoclick123 autoclick_db -e "SELECT 'Autoclick conectou OK' as status;" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo "✅ Conexão autoclick: OK"
            
            echo ""
            echo "🎉 MariaDB configurado com sucesso!"
            echo ""
            echo "📋 Credenciais finais:"
            echo "   Root: usuário='root', senha='boot01'"
            echo "   App:  usuário='autoclick', senha='autoclick123'"
            echo "   Database: autoclick_db"
            echo ""
            
            # Atualizar arquivo .env se existir
            if [ -f "backend/.env" ]; then
                echo "📝 Atualizando backend/.env..."
                sed -i 's/MYSQL_URL=.*/MYSQL_URL=mysql+pymysql:\/\/autoclick:autoclick123@localhost:3306\/autoclick_db/' backend/.env
                echo "✅ Arquivo .env atualizado"
            fi
            
        else
            echo "❌ Erro na conexão autoclick"
            exit 1
        fi
    else
        echo "❌ Erro ao criar usuário autoclick"
        exit 1
    fi
    
else
    echo "❌ Não conseguiu conectar como root"
    
    # Método 3: Diagnóstico avançado
    echo ""
    echo "🔍 Diagnóstico avançado..."
    
    echo "Status do MariaDB:"
    sudo systemctl status mariadb --no-pager -l
    
    echo ""
    echo "Processos MySQL/MariaDB:"
    ps aux | grep -i mysql
    
    echo ""
    echo "Arquivos de socket:"
    ls -la /var/run/mysqld/ 2>/dev/null || echo "Diretório não existe"
    ls -la /tmp/mysql* 2>/dev/null || echo "Sem arquivos mysql em /tmp"
    
    echo ""
    echo "Logs do MariaDB:"
    sudo tail -20 /var/log/mysql/error.log 2>/dev/null || echo "Log não encontrado"
    
    exit 1
fi

echo ""
echo "🚀 Execute agora: ./setup.sh"