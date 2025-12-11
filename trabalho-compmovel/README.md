# 🌤️ Sistema de Monitoramento Climático com IA

Sistema inteligente de monitoramento climático desenvolvido para a disciplina **Computação Móvel e Ubíqua** ministrada pelo professor Fábio Moreira.

Integra dados climáticos em tempo real via OpenWeather, gera dicas personalizadas com IA (Google Gemini), oferece bot do Telegram para consultas e disponibiliza PWA com sincronização offline.

## ✨ Features Principais

- 🌤️ **Dados Climáticos em Tempo Real**: Atualização automática a cada 5 minutos via OpenWeather API
- 🤖 **Dicas Inteligentes com IA**: Google Gemini gera sugestões contextualizadas baseadas no clima
- 💬 **Bot do Telegram**: Consulte clima e receba dicas diretamente no Telegram
- 📱 **PWA Completo**: Instalável como app, funciona offline com sincronização
- 📊 **Dashboard Interativo**: Visualização de sensores, alertas e histórico em tempo real
- 🔄 **WebSocket em Tempo Real**: Atualizações instantâneas via Socket.IO
- 🌓 **Tema Claro/Escuro**: Interface adaptável às preferências do usuário
- 🔐 **Autenticação JWT**: Sistema seguro de login e registro

## 🏗️ Arquitetura do Sistema

### Visão Geral dos Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITETURA DO SISTEMA                   │
└─────────────────────────────────────────────────────────────┘

    ┌──────────────┐         ┌──────────────┐
    │ OpenWeather  │         │ Google Gemini│
    │     API      │         │      AI      │
    └──────┬───────┘         └──────┬───────┘
           │                        │
           │ 5min                   │ Dicas
           ▼                        ▼
    ┌──────────────────────────────────────┐
    │           BACKEND (Node.js)          │
    │  ┌─────────────────────────────┐     │
    │  │  Express API + Socket.IO    │     │
    │  │  node-cron Scheduler        │     │
    │  │  Telegram Bot               │     │
    │  │  JWT Auth                   │     │
    │  └─────────────────────────────┘     │
    └──────────┬────────────┬──────────────┘
               │            │
               ▼            ▼
         ┌──────────┐  ┌──────────┐
         │PostgreSQL│  │ Telegram │
         │ Database │  │  Users   │
         └──────────┘  └──────────┘
               │
               │ WebSocket
               ▼
    ┌──────────────────────────────────────┐
    │      FRONTEND (React + PWA)          │
    │  ┌─────────────────────────────┐     │
    │  │  Dashboard Interativo       │     │
    │  │  Service Worker (Offline)   │     │
    │  │  Socket.IO Client           │     │
    │  └─────────────────────────────┘     │
    └──────────────────────────────────────┘
```

### Fluxo de Dados (a cada 5 minutos)

```
1. Scheduler (node-cron)
   │
   └──> OpenWeather API: GET clima atual
        │
        └──> Backend: Recebe dados climáticos
             │
             ├──> PostgreSQL: Persiste histórico
             │
             ├──> Google Gemini: Solicita dicas contextualizadas
             │    │
             │    └──> Retorna 4 dicas personalizadas
             │
             ├──> Frontend: Envia via WebSocket
             │    │
             │    └──> Dashboard: Atualiza em tempo real
             │
             └──> Telegram Bot: Notifica usuários cadastrados
```

## 📦 Stack Tecnológico

### Backend
- **Node.js 20+** com TypeScript
- **Express.js** - API REST
- **PostgreSQL** - Banco de dados relacional
- **Socket.IO** - WebSocket para tempo real
- **node-cron** - Scheduler de atualização (5 min)
- **JWT** - Autenticação e autorização
- **Google Generative AI** (Gemini) - Dicas inteligentes
- **Telegraf** - Bot Telegram
- **OpenWeather API** - Dados climáticos

### Frontend
- **React 18** com TypeScript
- **Vite** - Build tool rápido
- **Tailwind CSS** - Estilos responsivos
- **Socket.IO Client** - WebSocket
- **Zustand** - Gerenciamento de estado
- **Service Worker** - PWA e offline
- **Recharts** - Gráficos interativos

## 📱 PWA (Progressive Web App)

O sistema é um **PWA completo e funcional**, permitindo instalação como aplicativo nativo e funcionamento offline.

### ✅ Funcionalidades Implementadas

- **Service Worker Ativo**: Registrado e funcionando via `vite-plugin-pwa`
- **Manifest Configurado**: Nome, ícones, shortcuts e screenshots
- **Cache Storage**: Arquivos estáticos e chamadas de API em cache
- **Instalável**: Pode ser instalado como app nativo no desktop e mobile
- **Suporte Offline**: Funciona sem internet usando dados em cache
- **Background Sync**: Sincronização automática quando voltar online
- **Push Notifications**: Suporte a notificações (requer permissão do usuário)

### 📥 Como Instalar o PWA

#### Desktop (Chrome/Edge/Brave)
1. Acesse http://localhost:5173
2. Procure o ícone **➕** (ou ⬇️) na barra de endereços
3. Clique em "Instalar aplicativo" ou "Install app"
4. O app será instalado como aplicativo nativo do Windows/Mac/Linux

#### Mobile (Android)
1. Abra o site no Chrome/Edge
2. Toque no menu (⋮) → "Adicionar à tela inicial"
3. Confirme a instalação
4. O app aparecerá na tela inicial com ícone personalizado

#### Mobile (iOS/Safari)
1. Abra o site no Safari
2. Toque no ícone de compartilhar (□↑)
3. Role e toque em "Adicionar à Tela de Início"
4. Confirme a instalação

### 🧪 Testes Realizados

Os seguintes testes foram executados e validados com sucesso:

| Teste | Status | Detalhes |
|-------|--------|----------|
| Service Worker Registrado | ✅ | Scope: `http://localhost:5173/` |
| Manifest Válido | ✅ | Nome, ícones, shortcuts configurados |
| Cache Funcionando | ✅ | Cache "weather-app-v1" ativo |
| Arquivos em Cache | ✅ | index.html, manifest.json, APIs |
| Instalável | ✅ | Detectado pelo navegador |
| Offline Support | ✅ | App funciona sem internet |
| Dashboard Carregando | ✅ | Dados climáticos e dicas IA |

### 🔧 Detalhes Técnicos

- **Plugin**: `vite-plugin-pwa` v0.20.5
- **Strategy**: Inject Manifest
- **Service Worker**: `src/serviceWorker.ts`
- **Cache Name**: `weather-app-v1`
- **Cached Resources**:
  - Páginas estáticas (index.html, manifest.json)
  - Chamadas de API (dashboard, weather, cities)
  - Assets (CSS, JS, imagens)

### 📊 Benefícios do PWA

- ⚡ **Performance**: Carregamento instantâneo após primeira visita
- 📴 **Offline-First**: Funciona sem internet
- 💾 **Economia de Dados**: Cache reduz consumo de dados
- 🏠 **Experiência Nativa**: Ícone na tela inicial, tela cheia
- 🔔 **Notificações**: Alertas mesmo com app fechado
- 📱 **Cross-Platform**: Um código para todas as plataformas

## 🚀 Quick Start

### Pré-requisitos
- Docker e Docker Compose instalados
- Chaves de API: OpenWeather, Google Gemini, Telegram Bot Token

### 1. Clonar e Configurar

```bash
git clone <seu-repositorio>
cd trabalho-compmovel

# Copiar e configurar variáveis de ambiente
cp backend/env.example backend/.env
# Edite backend/.env e adicione suas chaves

# Subir todos os serviços
docker-compose up -d

# Entrar no container do backend
docker exec -it backend sh

# Executar migração
npm run migrate

# Executar SQL diretamente no PostgreSQL
docker exec -i postgres-weather psql -U weather_user -d weather_db < backend/database/migrations/001_create_auth_tables.sql

docker exec backend npm run seed
```

### 2. Configurar Variáveis de Ambiente

Edite `backend/.env`:

```env
# API
PORT=3334
CORS_ORIGIN=http://localhost:5173

# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=weather_db
POSTGRES_USER=weather_user
POSTGRES_PASSWORD=weather_pass_123

# JWT
JWT_SECRET=seu_secret_super_seguro_aqui
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7

# OpenWeather API (OBRIGATÓRIO)
OPENWEATHER_API_KEY=sua_chave_aqui
OPENWEATHER_CITY=São Paulo
OPENWEATHER_COUNTRY_CODE=BR

# Google Gemini (OBRIGATÓRIO para dicas)
GEMINI_API_KEY=sua_chave_aqui

# Telegram Bot (OPCIONAL)
TELEGRAM_BOT_TOKEN=seu_token_aqui
```

### 3. Acessar a Aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3334
- **Health Check**: http://localhost:3334/health

### 4. Criar Conta e Fazer Login

Acesse http://localhost:5173, crie uma conta e faça login para acessar o dashboard.

## 🐳 Comandos Docker Úteis

```bash
# Iniciar serviços
docker-compose up -d

# Parar serviços
docker-compose down

# Ver logs
docker-compose logs -f
docker logs backend -f
docker logs frontend -f

# Rebuild após mudanças
docker-compose up -d --build

# Acessar shell dos containers
docker exec -it backend sh
docker exec -it frontend sh
docker exec -it postgres-weather psql -U weather_user -d weather_db

# Limpar tudo (⚠️ Remove dados)
docker-compose down -v
```

## 🤖 Configurar Bot do Telegram

### 1. Criar Bot

1. Abra o Telegram e procure por `@BotFather`
2. Envie `/newbot`
3. Escolha um nome: `Clima Bot`
4. Escolha um username: `clima_weather_bot`
5. Copie o token fornecido

### 2. Configurar Token

Adicione o token em `backend/.env`:

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

Reinicie o backend:

```bash
docker-compose restart backend
```

### 3. Comandos Disponíveis

- `/clima` - Ver clima atual da cidade
- `/dicas` - Receber 4 dicas personalizadas com IA
- `/cidade [nome]` - Trocar cidade
- `/cidades` - Listar cidades disponíveis
- `/historico` - Ver últimas 5 leituras
- `/stats` - Estatísticas (min/max/média)
- `/ajuda` - Ver todos os comandos

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Fazer logout

### Clima
- `GET /api/weather` - Clima atual
- `GET /api/weather/history` - Histórico 24h
- `GET /api/weather/stats` - Estatísticas
- `POST /api/weather/refresh` - Forçar atualização
- `GET /api/weather/cities` - Listar cidades

### Sensores
- `GET /api/sensors` - Listar todos os sensores
- `POST /api/sensors` - Criar novo sensor
- `GET /api/sensors/:id` - Obter sensor específico
- `PUT /api/sensors/:id` - Atualizar sensor
- `DELETE /api/sensors/:id` - Deletar sensor

### Alertas
- `GET /api/alerts` - Listar alertas
- `POST /api/alerts` - Criar alerta
- `PUT /api/alerts/:id` - Atualizar alerta

### Chat IA
- `POST /api/chat` - Enviar mensagem para IA
- `GET /api/chat/history` - Histórico de conversas

### Dashboard
- `GET /api/dashboard` - Dados gerais do dashboard

## 🔑 Obtendo Chaves de API

### OpenWeather API (Obrigatório)
1. Acesse https://home.openweathermap.org/api_keys
2. Crie uma conta gratuita
3. Gere uma API Key
4. Adicione em `backend/.env`: `OPENWEATHER_API_KEY=sua_chave`

### Google Gemini (Obrigatório para dicas)
1. Acesse https://aistudio.google.com/app/api-keys
2. Crie um projeto
3. Gere uma API Key
4. Adicione em `backend/.env`: `GEMINI_API_KEY=sua_chave`

### Telegram Bot Token (Opcional)
1. Procure @BotFather no Telegram
2. Envie `/newbot`
3. Copie o token fornecido
4. Adicione em `backend/.env`: `TELEGRAM_BOT_TOKEN=seu_token`

## 📱 Recursos de Computação Móvel & Ubíqua

### Continuidade de Experiência
- **Sincronização Cross-Device**: Dados compartilhados em tempo real via WebSocket
- **Estado Persistente**: Preferências salvas localmente (LocalStorage)
- **Contexto Preservado**: Continue de onde parou entre dispositivos

### Responsividade
- **Mobile-First Design**: Interface otimizada para telas pequenas
- **Grid Adaptativo**: Layout se ajusta automaticamente
- **Touch-Friendly**: Áreas de toque adequadas (>44px)

### Offline-First
- **PWA Completo**: Instalável como app nativo
- **Service Worker**: Cache inteligente para funcionamento offline
- **Background Sync**: Sincronização quando reconectar
- **Notificações Push**: Alertas mesmo com app fechado

### Escalabilidade
- **Múltiplos Dispositivos**: Suporta vários clientes simultâneos
- **WebSocket Eficiente**: Updates em tempo real sem polling
- **Cache Distribuído**: Cada cliente mantém cache local

## 🐛 Troubleshooting

### Backend não inicia
```bash
# Verificar logs
docker logs backend

# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Tentar rebuild
docker-compose down
docker-compose up -d --build
```

### Frontend não conecta ao backend
- Verifique se `VITE_API_URL` está correto
- Confirme que backend está na porta 3334
- Veja console do navegador (F12) para erros

### Clima não atualiza
- Verifique `OPENWEATHER_API_KEY` em `backend/.env`
- Confirme que cidade está configurada
- Veja logs do backend: `docker logs backend -f`

### Dicas não aparecem
- Confirme `GEMINI_API_KEY` em `backend/.env`
- Verifique rate limits da API Gemini
- Aguarde 5 minutos para primeira atualização

### Telegram bot não responde
- Verifique `TELEGRAM_BOT_TOKEN` em `backend/.env`
- Procure o bot no Telegram e envie `/start`
- Veja logs: `docker logs backend | grep Telegram`

### PWA não funciona
- Acesse via `localhost` (não IP)
- Use HTTPS em produção
- Verifique Service Worker em DevTools → Application

### Porta já em uso
```bash
# Verificar processos
netstat -ano | findstr :5432
netstat -ano | findstr :3334
netstat -ano | findstr :5173

# Parar serviços e mudar portas em docker-compose.yml
docker-compose down
```

## 📚 Estrutura do Projeto

```
trabalho-compmovel/
├── backend/                    # API Node.js + Express
│   ├── src/
│   │   ├── config/            # Configurações e constantes
│   │   ├── database/          # PostgreSQL e migrations
│   │   ├── integrations/      # Gemini, Telegram, OpenWeather
│   │   ├── middleware/        # Auth, validação
│   │   ├── routes/            # Endpoints REST
│   │   ├── services/          # Lógica de negócio
│   │   ├── realtime/          # Socket.IO
│   │   └── types/             # TypeScript types
│   └── database/
│       ├── init.sql           # Schema inicial
│       └── migrations/        # Migrations SQL
├── frontend/                   # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── pages/             # Dashboard, Login, Register
│   │   ├── hooks/             # useSocket, useRealtime
│   │   ├── services/          # API clients
│   │   ├── stores/            # Zustand stores
│   │   └── providers/         # Theme, PWA providers
│   └── public/
│       └── manifest.json      # PWA manifest
└── docker-compose.yml          # Orquestração containers
```

## 🧪 Testando o Sistema

```bash
# Health check
curl http://localhost:3334/health

# Clima atual
curl http://localhost:3334/api/weather

# Criar usuário
curl -X POST http://localhost:3334/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"123456","name":"Teste"}'

# Login
curl -X POST http://localhost:3334/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"123456"}'

# Listar sensores (com token)
curl http://localhost:3334/api/sensors \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 👥

Desenvolvido como trabalho final da disciplina de Computação Móvel e Ubíqua por Mário César.