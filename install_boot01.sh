#!/bin/bash

# Instalação específica para usuário boot01 no Kali Linux
echo "🚀 AutoClick System - Instalação para boot01@Kali"
echo "=================================================="

# Verificar usuário
if [ "$USER" != "boot01" ]; then
    echo "⚠️  Este script deve ser executado como boot01"
    echo "Usuário atual: $USER"
    exit 1
fi

# Atualizar sistema
echo "📦 Atualizando sistema (pode pedir senha sudo)..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências essenciais
echo "📦 Instalando dependências..."
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    mariadb-server \
    mariadb-client \
    firefox-esr \
    wget \
    curl \
    git \
    unzip \
    net-tools \
    lsof

# Instalar Yarn globalmente
echo "📦 Instalando Yarn..."
sudo npm install -g yarn

# Verificar instalações
echo "🔍 Verificando instalações..."
python3 --version
node --version
yarn --version

# Instalar Geckodriver
echo "📦 Instalando Geckodriver..."
cd /tmp

# Detectar arquitetura
ARCH=$(uname -m)
if [[ "$ARCH" == "x86_64" ]]; then
    GECKO_ARCH="linux64"
elif [[ "$ARCH" == "aarch64" ]]; then
    GECKO_ARCH="linux-aarch64"
else
    echo "⚠️  Arquitetura não suportada: $ARCH"
    GECKO_ARCH="linux64"  # Tentar x64 como fallback
fi

echo "Baixando Geckodriver para $GECKO_ARCH..."
wget -q https://github.com/mozilla/geckodriver/releases/download/v0.34.0/geckodriver-v0.34.0-$GECKO_ARCH.tar.gz

if [ $? -eq 0 ]; then
    tar -xzf geckodriver-v0.34.0-$GECKO_ARCH.tar.gz
    sudo mv geckodriver /usr/local/bin/
    sudo chmod +x /usr/local/bin/geckodriver
    
    # Verificar instalação
    if which geckodriver > /dev/null; then
        echo "✅ Geckodriver instalado: $(geckodriver --version | head -1)"
    else
        echo "❌ Erro na instalação do Geckodriver"
        exit 1
    fi
else
    echo "❌ Erro ao baixar Geckodriver"
    exit 1
fi

# Configurar MariaDB
echo ""
echo "🗄️ Configurando MariaDB..."

# Parar MariaDB se estiver rodando
sudo systemctl stop mariadb 2>/dev/null || true

# Garantir que está limpo
sudo pkill -f mysql 2>/dev/null || true
sudo pkill -f mariadb 2>/dev/null || true

# Limpar sockets
sudo rm -f /var/run/mysqld/mysqld.sock
sudo rm -f /tmp/mysql.sock

# Criar diretório se não existir
sudo mkdir -p /var/run/mysqld
sudo chown mysql:mysql /var/run/mysqld

# Iniciar MariaDB
echo "🚀 Iniciando MariaDB..."
sudo systemctl enable mariadb
sudo systemctl start mariadb

# Aguardar inicialização
sleep 5

# Verificar se iniciou
if sudo systemctl is-active --quiet mariadb; then
    echo "✅ MariaDB iniciado com sucesso"
else
    echo "❌ MariaDB não iniciou. Verificando logs..."
    sudo journalctl -u mariadb --no-pager -l -n 10
    exit 1
fi

# Configurar segurança básica do MariaDB
echo "🔐 Configurando MariaDB..."

# Tentar acessar como root (sem senha inicialmente no Kali)
sudo mysql << 'EOF' || {
    echo "❌ Não conseguiu acessar MariaDB"
    exit 1
}

-- Configurar usuário root com senha
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('boot01');

-- Remover usuários anônimos
DELETE FROM mysql.user WHERE User='';

-- Remover database de teste
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';

-- Aplicar mudanças
FLUSH PRIVILEGES;

-- Mostrar usuários
SELECT User, Host FROM mysql.user;
EOF

if [ $? -eq 0 ]; then
    echo "✅ MariaDB configurado com senha boot01"
else
    echo "❌ Erro na configuração inicial do MariaDB"
    exit 1
fi

echo ""
echo "✅ Instalação base concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Execute: ./fix_mariadb_advanced.sh"
echo "2. Execute: ./setup.sh"
echo "3. Execute: ./start.sh"
echo ""
echo "🔧 Informações do sistema:"
echo "   Usuário: boot01"
echo "   MariaDB: root/boot01"
echo "   Python: $(python3 --version)"
echo "   Node.js: $(node --version)"