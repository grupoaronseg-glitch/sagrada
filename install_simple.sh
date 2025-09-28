#!/bin/bash

# AutoClick System - Instalador SIMPLES para Kali Linux (SQLite)
# Sem MariaDB/MySQL - muito mais fácil!

echo "🚀 AutoClick System - Instalação SIMPLES (SQLite)"
echo "================================================="
echo "✅ Sem MariaDB/MySQL - Sem complicações!"
echo ""

# Verificar se está rodando no Kali Linux
if ! grep -q "kali" /etc/os-release 2>/dev/null; then
    echo "⚠️  Este script foi desenvolvido para Kali Linux"
    read -p "Deseja continuar mesmo assim? (s/N): " continue
    if [[ ! $continue =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Atualizar sistema
echo "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar APENAS as dependências necessárias
echo "📦 Instalando dependências..."
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    firefox-esr \
    wget \
    curl \
    git \
    unzip \
    sqlite3

# Verificar instalações
echo "🔍 Verificando versões..."
echo "Python: $(python3 --version)"
echo "Node.js: $(node --version)"
echo "SQLite: $(sqlite3 --version)"

# Instalar Yarn
echo "📦 Instalando Yarn..."
sudo npm install -g yarn
echo "Yarn: $(yarn --version)"

# Instalar Geckodriver
echo "📦 Instalando Geckodriver..."
GECKODRIVER_VERSION="0.34.0"
if [[ $(uname -m) == "x86_64" ]]; then
    ARCH="linux64"
else
    ARCH="linux-aarch64"
fi

cd /tmp
wget -q https://github.com/mozilla/geckodriver/releases/download/v${GECKODRIVER_VERSION}/geckodriver-v${GECKODRIVER_VERSION}-${ARCH}.tar.gz

if [ $? -eq 0 ]; then
    tar -xzf geckodriver-v${GECKODRIVER_VERSION}-${ARCH}.tar.gz
    sudo mv geckodriver /usr/local/bin/
    sudo chmod +x /usr/local/bin/geckodriver
    
    if which geckodriver > /dev/null; then
        echo "✅ Geckodriver: $(geckodriver --version | head -1)"
    else
        echo "❌ Erro na instalação do Geckodriver"
        exit 1
    fi
else
    echo "❌ Erro ao baixar Geckodriver"
    exit 1
fi

echo ""
echo "🎉 Instalação concluída com sucesso!"
echo ""
echo "✅ O que foi instalado:"
echo "   📦 Python 3 + pip + venv"
echo "   📦 Node.js + Yarn"
echo "   📦 Firefox + Geckodriver"
echo "   📦 SQLite (banco de dados local)"
echo "   🚫 SEM MariaDB/MySQL!"
echo ""
echo "📋 Próximos passos:"
echo "1. Execute: ./setup_sqlite.sh"
echo "2. Execute: ./start.sh"
echo ""
echo "💾 Banco de dados será criado em: ./autoclick.db"