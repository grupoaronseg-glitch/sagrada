# AutoClick System - Sistema de Automação Web para Kali Linux

Um sistema completo de automação web com dashboard profissional, desenvolvido especificamente para Kali Linux.

## 🚀 Funcionalidades

- **Automação Web**: Carregamento automático de sites com Firefox headless
- **Dashboard Profissional**: Interface moderna com tema Red & Black 
- **Controle Total**: Iniciar/pausar/parar automação com configurações flexíveis
- **Logs em Tempo Real**: WebSocket para monitoramento ao vivo
- **Banco de Dados**: Persistência completa com MySQL/MariaDB
- **Exportação**: Logs e configurações exportáveis em TXT/CSV/JSON
- **Multi-site**: Suporte para até 10 sites simultâneos

## 📋 Pré-requisitos

- Kali Linux (recomendado) ou Debian/Ubuntu
- Python 3.8+
- Node.js 16+
- MariaDB/MySQL
- Firefox

## 🔧 Instalação Completa

### 1. Baixar o Projeto

```bash
# Clone ou baixe o projeto
git clone [URL_DO_SEU_REPOSITORIO] autoclick-system
cd autoclick-system
```

### 2. Executar Instalador Automático

```bash
# Dar permissão e executar o instalador
chmod +x install_kali.sh setup.sh start.sh
./install_kali.sh
```

### 3. Configurar o Ambiente

```bash
# Configurar ambiente Python e Node.js
./setup.sh
```

### 4. Iniciar o Sistema

```bash
# Iniciar backend e frontend
./start.sh
```

## 🌐 Acesso ao Sistema

Após inicialização, acesse:

- **Dashboard**: http://localhost:8080
- **API Backend**: http://localhost:8001
- **Documentação API**: http://localhost:8001/docs

## 📱 Como Usar

### 1. Gerenciar Sites
- Acesse a aba "Gerenciar Sites"
- Clique em "Adicionar Site"
- Configure nome, URL, duração e intervalo
- Ative/desative sites conforme necessário

### 2. Controlar Automação
- Vá para "Controle"
- Configure intervalo global
- Clique "Iniciar" para começar a automação
- Use "Pausar" ou "Parar" quando necessário

### 3. Monitorar Logs
- Acesse "Logs" para ver atividade em tempo real
- Use filtros por nível (info, success, warning, error)
- Exporte logs em diferentes formatos

### 4. Ver Estatísticas
- Aba "Estatísticas" mostra resumo completo
- Sites mais ativos, atividade recente
- Métricas de performance

## 🛠️ Configuração Avançada

### Banco de Dados
- Host: localhost
- Porta: 3306
- Database: autoclick_db
- Usuário: autoclick
- Senha: autoclick123

### Variáveis de Ambiente

Edite `backend/.env` para customizar:

```env
# Database
MYSQL_URL=mysql+pymysql://autoclick:autoclick123@localhost:3306/autoclick_db

# Sistema
MAX_SITES=10
DEFAULT_GLOBAL_INTERVAL=10
BROWSER_TYPE=firefox

# Selenium
SELENIUM_TIMEOUT=30
PAGE_LOAD_TIMEOUT=30
```

## 🔧 Troubleshooting

### Backend não inicia
```bash
# Verificar logs
cd backend
source venv/bin/activate
python server.py
```

### Frontend não carrega
```bash
# Verificar dependências
cd frontend
yarn install
yarn dev
```

### Selenium/Firefox não funciona
```bash
# Reinstalar geckodriver
sudo rm /usr/local/bin/geckodriver
wget -q https://github.com/mozilla/geckodriver/releases/latest/download/geckodriver-v0.34.0-linux64.tar.gz
tar -xzf geckodriver-v0.34.0-linux64.tar.gz
sudo mv geckodriver /usr/local/bin/
sudo chmod +x /usr/local/bin/geckodriver
```

### Banco de dados não conecta
```bash
# Reiniciar MariaDB
sudo systemctl restart mariadb
sudo systemctl status mariadb

# Recriar usuário
sudo mysql -e "DROP USER IF EXISTS 'autoclick'@'localhost';"
sudo mysql -e "CREATE USER 'autoclick'@'localhost' IDENTIFIED BY 'autoclick123';"
sudo mysql -e "GRANT ALL PRIVILEGES ON autoclick_db.* TO 'autoclick'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

## 🚨 Comandos Úteis

```bash
# Parar todos os processos
pkill -f "python.*server.py"
pkill -f "yarn.*dev"

# Ver logs em tempo real
tail -f backend/logs.log

# Testar API
curl http://localhost:8001/api/health

# Ver status do banco
sudo systemctl status mariadb
```

## 📂 Estrutura do Projeto

```
autoclick-system/
├── backend/                 # API FastAPI
│   ├── server.py           # Servidor principal
│   ├── database.py         # Modelos do banco
│   ├── automation_engine.py # Motor de automação
│   ├── requirements.txt    # Dependências Python
│   └── .env               # Configurações
├── frontend/               # Interface React
│   ├── src/
│   │   ├── components/    # Componentes UI
│   │   ├── services/      # Integração API
│   │   └── pages/         # Páginas
│   ├── package.json       # Dependências Node.js
│   └── vite.config.ts     # Configuração Vite
├── install_kali.sh         # Instalador automático
├── setup.sh               # Configuração ambiente
├── start.sh               # Script de inicialização
└── README.md              # Este arquivo
```

## 🔐 Segurança

- Sistema projetado para uso local/desenvolvimento
- Não exponha diretamente na internet
- Use firewall para restringir acessos externos
- Altere credenciais padrão em produção

## 📞 Suporte

Para problemas ou dúvidas:

1. Verifique os logs: `backend/logs.log`
2. Teste componentes individualmente
3. Verifique se todas as dependências estão instaladas
4. Reinicie os serviços: `sudo systemctl restart mariadb`

## 🎯 Performance

- Máximo 10 sites simultâneos (recomendado)
- Intervalo mínimo de 1 segundo entre execuções
- Usa Firefox headless para economia de recursos
- Logs automaticamente limpos após 1000 entradas

---

**Desenvolvido para Kali Linux - Sistema de Automação Web Profissional** 🚀
