#!/bin/bash

# AutoClick System - Instalador para Kali Linux
# Este script instala todas as dependências e configura o sistema

echo "🚀 AutoClick System - Instalador para Kali Linux"
echo "================================================="

# Verificar se está rodando no Kali Linux
if ! grep -q "kali" /etc/os-release; then
    echo "⚠️  Este script foi desenvolvido para Kali Linux"
    read -p "Deseja continuar mesmo assim? (s/N): " continue
    if [[ ! $continue =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Atualizar sistema
echo "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências do sistema
echo "📦 Instalando dependências do sistema..."
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    mariadb-server \
    firefox-esr \
    wget \
    curl \
    git \
    unzip

# Instalar Yarn
echo "📦 Instalando Yarn..."
sudo npm install -g yarn

# Baixar e instalar Geckodriver
echo "📦 Instalando Geckodriver..."
GECKODRIVER_VERSION="0.34.0"
if [[ $(uname -m) == "x86_64" ]]; then
    ARCH="linux64"
else
    ARCH="linux-aarch64"
fi

cd /tmp
wget -q https://github.com/mozilla/geckodriver/releases/download/v${GECKODRIVER_VERSION}/geckodriver-v${GECKODRIVER_VERSION}-${ARCH}.tar.gz
tar -xzf geckodriver-v${GECKODRIVER_VERSION}-${ARCH}.tar.gz
sudo mv geckodriver /usr/local/bin/
sudo chmod +x /usr/local/bin/geckodriver

# Configurar MariaDB
echo "📦 Configurando MariaDB..."
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Configurar banco de dados
echo "🗄️ Configurando banco de dados..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS autoclick_db;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'autoclick'@'localhost' IDENTIFIED BY 'autoclick123';"
sudo mysql -e "GRANT ALL PRIVILEGES ON autoclick_db.* TO 'autoclick'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "✅ Instalação das dependências concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Clone ou copie os arquivos do projeto para um diretório"
echo "2. Execute: cd /caminho/do/projeto && ./setup.sh"
echo "3. Execute: ./start.sh"