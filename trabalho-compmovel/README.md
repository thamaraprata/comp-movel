# 🌍 Sistema de Monitoramento Climático com IA

Sistema inteligente de monitoramento climático desenvolvido para a disciplina **Computação Móvel e Ubíqua**. O sistema coleta dados de clima em tempo real via OpenWeather, gera dicas personalizadas com IA (Google Gemini), sincroniza dados entre dispositivos e oferece suporte offline via PWA.

## ✨ Features Principais

- **🌤️ Clima em Tempo Real**: Atualização automática a cada 5 minutos
- **🤖 IA Gemini**: Dicas contextualizadas baseadas em condições climáticas
- **📱 Responsivo**: Mobile, tablet e desktop com continuidade entre dispositivos
- **📊 Histórico**: Dados dos últimos 24h com estatísticas
- **💬 Telegram**: Bot inteligente para consultas de clima
- **🌓 Tema**: Suporte a tema claro/escuro
- **📲 PWA**: Instalação como app, funcionamento offline e sincronização
- **🔄 Sincronização**: Continuidade de experiência entre dispositivos

## 🏗️ Arquitetura

```
OpenWeather API
     ↓
[Backend Node.js + Express]
  ├── node-cron (scheduler 5 min)
  ├── SQLite (histórico 24h)
  ├── Google Gemini (dicas)
  ├── Telegram Bot (consultas)
  └── WebSocket (atualizações em tempo real)
     ↓
[Frontend React + Vite + Tailwind]
  ├── Service Worker (PWA)
  ├── LocalStorage (persistência)
  └── Responsive Design (mobile-first)
```

## 📦 Stack Tecnológico

### Backend
- **Node.js 20+** com TypeScript
- **Express.js** para API REST
- **node-cron** para scheduler de atualização (5 min)
- **Socket.IO** para WebSocket (atualizações em tempo real)
- **SQLite** para persistência (histórico 24h)
- **Google Generative AI** (Gemini) para dicas inteligentes
- **Telegraf** para Bot Telegram
- **Axios** para requisições HTTP
- **OpenWeather API** para dados climáticos

### Frontend
- **React 18** com TypeScript
- **Vite** para build rápido
- **Tailwind CSS** para estilos responsivos
- **Socket.IO Client** para WebSocket
- **Service Worker** para PWA e offline
- **Lucide React** para ícones
- **LocalStorage/IndexedDB** para sincronização offline

## 🚀 Início Rápido

### 1️⃣ Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Criar arquivo .env
cp env.example .env

# IMPORTANTE: Configurar as variáveis
# - OPENWEATHER_API_KEY (obrigatório)
# - GEMINI_API_KEY (para dicas inteligentes)
# - TELEGRAM_BOT_TOKEN (opcional, para Telegram)

# Iniciar servidor
npm run dev
```

### 2️⃣ Configurar Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev
```

Acesse: **http://localhost:5173**

### 3️⃣ (Opcional) Docker Compose

```bash
# Iniciar backend + frontend
docker-compose up -d

# Logs
docker-compose logs -f
```

## 📋 Documentação Completa

- **[IMPLEMENTATION_STEPS.md](./IMPLEMENTATION_STEPS.md)** - Guia passo a passo das 4 fases
- **[MOSQUITTO_SETUP.md](./MOSQUITTO_SETUP.md)** - Instalação e configuração do MQTT
- **[TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)** - Configurar Bot Telegram
- **[GUIA_RAPIDO.md](./GUIA_RAPIDO.md)** - Referência rápida
- **[docs/arquitetura.md](./docs/arquitetura.md)** - Arquitetura técnica
- **[backend/README.md](./backend/README.md)** - Detalhes do backend
- **[frontend/README.md](./frontend/README.md)** - Detalhes do frontend

## 📊 Status das Implementações

| Feature | Status | Descrição |
|---------|--------|-----------|
| 🌤️ Clima OpenWeather | ✅ Completo | Atualiza a cada 5 minutos |
| 🤖 Dicas Gemini | ✅ Completo | Processadas a cada atualização |
| 💬 Telegram Bot | ✅ Completo | Preparado para configuração |
| 📱 Responsividade | ✅ Completo | Mobile-first com grid responsivo |
| 🔄 Sincronização | ✅ Completo | LocalStorage + WebSocket |
| 📲 PWA | ✅ Completo | Service Worker + Manifest |
| 🚀 Scheduler 5min | ✅ Completo | node-cron implementado |

## 🔑 Variáveis de Ambiente Essenciais

### Backend (.env)

```env
# API
PORT=3334
CORS_ORIGIN=http://localhost:5173

# OpenWeather API (OBRIGATÓRIO)
OPENWEATHER_API_KEY=sua_chave_aqui
OPENWEATHER_CITY=São Paulo
OPENWEATHER_COUNTRY_CODE=BR

# Database
DATABASE_PATH=./data/monitoring.db

# Google Gemini IA (Obrigatório para dicas)
GEMINI_API_KEY=sua-chave-aqui

# Telegram Bot (Opcional)
TELEGRAM_BOT_TOKEN=seu_token_aqui
```

## 🧪 Testando o Sistema

### Health Check
```bash
curl http://localhost:3334/health
```

### Obter Dados de Clima Atualizados
```bash
curl http://localhost:3334/api/weather
```

### Obter Histórico (últimas 24h)
```bash
curl http://localhost:3334/api/weather/history
```

### Obter Estatísticas
```bash
curl http://localhost:3334/api/weather/stats
```

### Forçar Atualização de Clima
```bash
curl -X POST http://localhost:3334/api/weather/refresh
```

### Usar Telegram Bot
```bash
# 1. Configure TELEGRAM_BOT_TOKEN no .env
# 2. Procure o bot no Telegram
# 3. Use os comandos:
#    /clima - Ver clima atual
#    /dicas - Receber dicas
#    /historico - Ver histórico
#    /stats - Estatísticas
#    /cidade Rio de Janeiro - Mudar cidade
```

## 🎯 Configuração Necessária

### 1. OpenWeather API (OBRIGATÓRIO)
1. Acesse https://openweathermap.org/api
2. Crie uma conta gratuita
3. Gere uma API Key
4. Adicione em `backend/.env`: `OPENWEATHER_API_KEY=sua_chave`

### 2. Google Gemini (Para dicas inteligentes)
1. Acesse https://ai.google.dev
2. Crie um projeto
3. Gere uma API Key
4. Adicione em `backend/.env`: `GEMINI_API_KEY=sua_chave`

### 3. Telegram Bot (Opcional)
1. Procure @BotFather no Telegram
2. Crie um novo bot (`/newbot`)
3. Copie o token
4. Adicione em `backend/.env`: `TELEGRAM_BOT_TOKEN=seu_token`

## 📱 Recursos de Computação Móvel & Ubíqua

### Continuidade de Experiência
- **Sincronização entre dispositivos**: LocalStorage + WebSocket permite usar no desktop e continuar no mobile
- **Estado persistente**: Última cidade e preferências salvas localmente
- **Offline-first**: PWA permite funcionar sem internet com cache

### Princípios Implementados
- ✅ **Acessibilidade cross-device**: Interface responsiva funciona em qualquer tela
- ✅ **Sincronização de dados**: Dados climáticos compartilhados em tempo real
- ✅ **Continuidade de contexto**: Informações persistem entre sessões
- ✅ **Escalabilidade**: Suporta múltiplos dispositivos simultâneos
- ✅ **Resiliência**: Funciona offline, sincroniza quando conectado

## 🛠️ Troubleshooting

### Clima não atualiza
1. Verifique `OPENWEATHER_API_KEY` em `.env`
2. Confirme que a cidade está configurada
3. Verifique logs do backend

### Dicas não aparecem
1. Confirme `GEMINI_API_KEY` em `.env`
2. Verifique se limite de requisições não foi atingido
3. Tente gerar dicas manualmente via API

### Telegram bot não responde
1. Verifique `TELEGRAM_BOT_TOKEN` em `.env`
2. Procure o bot no Telegram e envie `/start`
3. Verifique logs do backend

### Frontend não carrega dados
1. Verifique se backend está na porta 3334: `netstat -an | grep 3334`
2. Abra DevTools (F12) e veja console
3. Verifique `CORS_ORIGIN` em `.env`

### PWA não funciona
1. Acesse via `localhost` (não em IP)
2. Use HTTPS em produção
3. Verifique se Service Worker está registrado (DevTools → Application)

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte `TROUBLESHOOTING.md` (se existir)
2. Verifique logs do terminal
3. Abra issue no repositório

## 📄 Licença

Projeto acadêmico - UFG 2024/2025


