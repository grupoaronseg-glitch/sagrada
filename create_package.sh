#!/bin/bash

# Script para criar pacote de distribuição do AutoClick System

echo "📦 Criando pacote de distribuição..."

# Nome do pacote
PACKAGE_NAME="autoclick-system-kali"
PACKAGE_DIR="/tmp/$PACKAGE_NAME"

# Limpar diretório anterior
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

# Copiar arquivos essenciais
cp -r backend "$PACKAGE_DIR/"
cp -r frontend "$PACKAGE_DIR/"

# Copiar scripts
cp install_kali.sh "$PACKAGE_DIR/"
cp setup.sh "$PACKAGE_DIR/"
cp start.sh "$PACKAGE_DIR/"
cp README.md "$PACKAGE_DIR/"

# Limpar arquivos desnecessários
rm -rf "$PACKAGE_DIR/backend/venv"
rm -rf "$PACKAGE_DIR/backend/__pycache__"
rm -rf "$PACKAGE_DIR/backend/*.pyc"
rm -rf "$PACKAGE_DIR/frontend/node_modules"
rm -rf "$PACKAGE_DIR/frontend/dist"
rm -rf "$PACKAGE_DIR/frontend/.vite"

# Criar arquivo de versão
echo "AutoClick System v1.0.0" > "$PACKAGE_DIR/VERSION"
echo "Build: $(date '+%Y-%m-%d %H:%M:%S')" >> "$PACKAGE_DIR/VERSION"

# Dar permissões aos scripts
chmod +x "$PACKAGE_DIR/install_kali.sh"
chmod +x "$PACKAGE_DIR/setup.sh"
chmod +x "$PACKAGE_DIR/start.sh"

# Criar arquivo compactado
cd /tmp
tar -czf "${PACKAGE_NAME}.tar.gz" "$PACKAGE_NAME"

echo "✅ Pacote criado: /tmp/${PACKAGE_NAME}.tar.gz"
echo ""
echo "Para distribuir:"
echo "1. Copie o arquivo ${PACKAGE_NAME}.tar.gz para seu Kali Linux"
echo "2. Execute: tar -xzf ${PACKAGE_NAME}.tar.gz"
echo "3. Execute: cd $PACKAGE_NAME"
echo "4. Execute: ./install_kali.sh"
echo "5. Execute: ./setup.sh"
echo "6. Execute: ./start.sh"