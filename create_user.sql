-- Script SQL para criar usuário autoclick
-- Execute com: mysql -u root -p < create_user.sql

-- Remover usuário se existir
DROP USER IF EXISTS 'autoclick'@'localhost';

-- Remover database se existir
DROP DATABASE IF EXISTS autoclick_db;

-- Criar database
CREATE DATABASE autoclick_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário autoclick
CREATE USER 'autoclick'@'localhost' IDENTIFIED BY 'autoclick123';

-- Dar permissões completas
GRANT ALL PRIVILEGES ON autoclick_db.* TO 'autoclick'@'localhost';
GRANT PROCESS ON *.* TO 'autoclick'@'localhost';

-- Aplicar mudanças
FLUSH PRIVILEGES;

-- Mostrar resultado
SELECT 'Usuário autoclick criado com sucesso!' as status;
SELECT User, Host FROM mysql.user WHERE User = 'autoclick';
SHOW DATABASES LIKE 'autoclick_db';