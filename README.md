# AutoClick System - Sistema de Automação Web para Kali Linux

Um sistema completo de automação web com dashboard profissional, desenvolvido especificamente para Kali Linux.

## 🚀 Funcionalidades

- **Automação Web**: Carregamento automático de sites com Firefox headless
- **Dashboard Profissional**: Interface moderna com tema Red & Black 
- **Controle Total**: Iniciar/pausar/parar automação com configurações flexíveis
- **Logs em Tempo Real**: WebSocket para monitoramento ao vivo
- **Banco SQLite**: Persistência local SEM servidor de banco (muito mais simples!)
- **Exportação**: Logs e configurações exportáveis em TXT/CSV/JSON
- **Multi-site**: Suporte para até 10 sites simultâneos

## 📋 Pré-requisitos

- Kali Linux (recomendado) ou Debian/Ubuntu
- Python 3.8+
- Node.js 16+
- Firefox
- **✅ SEM MariaDB/MySQL - Usa SQLite!**

## 🔧 Instalação SIMPLES

### 1. Baixar o Projeto

```bash
# Clone ou baixe o projeto
git clone [URL_DO_SEU_REPOSITORIO] autoclick-system
cd autoclick-system
```

### 2. Instalação Automática (SEM complicações!)

```bash
# Dar permissão e executar o instalador SIMPLES
chmod +x install_simple.sh setup_sqlite.sh start.sh
./install_simple.sh
```

### 3. Configurar o Ambiente

```bash
# Configurar ambiente Python e Node.js (cria banco SQLite automaticamente)
./setup_sqlite.sh
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

### Banco de Dados SQLite
- **Arquivo**: `backend/autoclick.db`
- **Local**: No diretório do projeto
- **Sem servidor**: Funciona diretamente
- **Backup**: Basta copiar o arquivo `.db`

### Variáveis de Ambiente

Edite `backend/.env` para customizar:

```env
# Database SQLite (local)
DATABASE_URL=sqlite:///./autoclick.db

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

### Banco SQLite corrompido
```bash
# Recriar banco (perde dados!)
rm backend/autoclick.db
cd backend
source venv/bin/activate
python test_db.py
```

## 🚨 Comandos Úteis

```bash
# Parar todos os processos
pkill -f "python.*server.py"
pkill -f "yarn.*dev"

# Ver tamanho do banco
ls -lh backend/autoclick.db

# Backup do banco
cp backend/autoclick.db backup-$(date +%Y%m%d).db

# Testar API
curl http://localhost:8001/api/health

# Verificar tabelas SQLite
sqlite3 backend/autoclick.db ".tables"
```

## 📂 Estrutura do Projeto

```
autoclick-system/
├── backend/                 # API FastAPI
│   ├── server.py           # Servidor principal
│   ├── database.py         # Modelos SQLite
│   ├── automation_engine.py # Motor de automação
│   ├── autoclick.db        # Banco SQLite
│   ├── requirements.txt    # Dependências Python
│   └── .env               # Configurações
├── frontend/               # Interface React
│   ├── src/
│   │   ├── components/    # Componentes UI
│   │   ├── services/      # Integração API
│   │   └── pages/         # Páginas
│   ├── package.json       # Dependências Node.js
│   └── vite.config.ts     # Configuração Vite
├── install_simple.sh       # Instalador SIMPLES
├── setup_sqlite.sh        # Configuração SQLite
├── start.sh               # Script de inicialização
└── README.md              # Este arquivo
```

## 🔐 Segurança

- Sistema projetado para uso local/desenvolvimento
- Banco SQLite local (sem rede)
- Não exponha diretamente na internet
- Use firewall para restringir acessos externos

## 📞 Suporte

Para problemas ou dúvidas:

1. Execute: `./diagnose_sqlite.sh`
2. Verifique se todas as dependências estão instaladas
3. Reinicie com: `./start.sh`

## 🎯 Performance

- Máximo 10 sites simultâneos (recomendado)
- Intervalo mínimo de 1 segundo entre execuções
- Usa Firefox headless para economia de recursos
- SQLite é muito rápido para aplicações locais

## ✅ Vantagens da Versão SQLite

- **🚫 SEM MariaDB/MySQL**: Sem complicações de servidor
- **📁 Arquivo único**: Fácil backup e portabilidade
- **⚡ Rápido**: SQLite é otimizado para aplicações locais
- **🔧 Simples**: Sem configuração de usuários/senhas
- **💾 Leve**: Banco ocupa poucos MB

---

**Desenvolvido para Kali Linux - Sistema de Automação Web Profissional (SQLite Edition)** 🚀
