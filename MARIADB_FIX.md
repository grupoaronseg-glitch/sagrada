# 🔧 CORREÇÃO DO ERRO MariaDB - Access Denied

## ❌ Problema
```
❌ Database connection error: (pymysql.err.OperationalError) (1698, "Access denied for user 'root'@'localhost'")
```

## ✅ Solução Rápida

### Opção 1: Script Automático (Mais Fácil)
```bash
# Baixe a versão corrigida: autoclick-system-kali-fixed.tar.gz
# Execute:
tar -xzf autoclick-system-kali-fixed.tar.gz
cd autoclick-system-kali-fixed

# Execute o script de correção:
./fix_mariadb.sh

# Depois execute:
./setup.sh
```

### Opção 2: Correção Manual
```bash
# 1. Parar MariaDB
sudo systemctl stop mariadb

# 2. Reiniciar MariaDB
sudo systemctl start mariadb

# 3. Corrigir autenticação do root
sudo mysql
```

**Dentro do MySQL, execute:**
```sql
-- Alterar método de autenticação do root
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('root123');

-- Criar usuário autoclick
DROP USER IF EXISTS 'autoclick'@'localhost';
CREATE USER 'autoclick'@'localhost' IDENTIFIED BY 'autoclick123';

-- Criar database
DROP DATABASE IF EXISTS autoclick_db;
CREATE DATABASE autoclick_db;

-- Dar permissões
GRANT ALL PRIVILEGES ON autoclick_db.* TO 'autoclick'@'localhost';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';
FLUSH PRIVILEGES;

-- Sair
exit;
```

### 4. Testar a Correção
```bash
# Testar conexão root
mysql -u root -proot123 -e "SELECT 'Root OK';"

# Testar conexão autoclick
mysql -u autoclick -pautoclick123 autoclick_db -e "SELECT 'Autoclick OK';"
```

### 5. Continuar com a Instalação
```bash
# Agora execute normalmente:
./setup.sh
./start.sh
```

## 🔍 Diagnóstico
Se ainda houver problemas, execute:
```bash
./diagnose.sh
```

Este script mostrará o status completo do sistema.

## 📋 Credenciais Atualizadas
```
Root MariaDB:
  Usuário: root
  Senha: root123

Aplicação:
  Usuário: autoclick
  Senha: autoclick123
  Database: autoclick_db
```

## 🚨 Outros Problemas Comuns

### "Command not found: mysql"
```bash
sudo apt install mariadb-client
```

### "MariaDB not running"
```bash
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

### "Permission denied"
```bash
chmod +x *.sh
```

### "Port already in use"
```bash
pkill -f "python.*server.py"
pkill -f "yarn.*dev"
```

---

**O problema é comum no MariaDB moderno - o usuário root usa autenticação por socket em vez de senha. O script fix_mariadb.sh resolve isso automaticamente!** 🚀