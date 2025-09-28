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

# Verificar se geckodriver foi instalado
if which geckodriver > /dev/null; then
    echo "✅ Geckodriver instalado: $(which geckodriver)"
else
    echo "❌ Erro na instalação do Geckodriver!"
    exit 1
fi

# Configurar MariaDB
echo "📦 Iniciando MariaDB..."
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Aguardar MariaDB inicializar
sleep 3

# Executar script de correção do MariaDB
if [ -f "fix_mariadb.sh" ]; then
    echo "🔧 Executando correção do MariaDB..."
    chmod +x fix_mariadb.sh
    ./fix_mariadb.sh
    
    if [ $? -eq 0 ]; then
        echo "✅ MariaDB configurado corretamente!"
    else
        echo "❌ Erro na configuração do MariaDB!"
        exit 1
    fi
else
    # Configuração manual caso o script não exista
    echo "🗄️ Configurando banco de dados manualmente..."
    
    # Configurar root com senha
    sudo mysql << 'EOF'
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('root123');
FLUSH PRIVILEGES;
EOF

    # Criar database e usuário
    mysql -u root -proot123 << 'EOF'
DROP DATABASE IF EXISTS autoclick_db;
CREATE DATABASE autoclick_db;
DROP USER IF EXISTS 'autoclick'@'localhost';
CREATE USER 'autoclick'@'localhost' IDENTIFIED BY 'autoclick123';
GRANT ALL PRIVILEGES ON autoclick_db.* TO 'autoclick'@'localhost';
FLUSH PRIVILEGES;
EOF

fi

echo ""
echo "✅ Instalação das dependências concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Execute: ./setup.sh"
echo "2. Execute: ./start.sh"
echo ""
echo "🔧 Credenciais do banco:"
echo "   Usuário: autoclick"
echo "   Senha: autoclick123"
echo "   Database: autoclick_db"