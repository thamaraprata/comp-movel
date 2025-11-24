# 🌍 Sistema de Monitoramento Ambiental com IA

Sistema completo de monitoramento ambiental desenvolvido para a disciplina **Computação Móvel e Ubíqua**. O sistema coleta dados de sensores IoT em tempo real, gera dicas personalizadas com IA (Google Gemini) e envia alertas via Telegram.

## ✨ Features Principais

- **🔄 Tempo Real**: WebSocket para atualizações instantâneas
- **🤖 IA Gemini**: Dicas contextualizadas baseadas em temperatura/umidade
- **📱 Responsivo**: Mobile, tablet e desktop
- **📊 Gráficos**: Visualização histórica de dados
- **🚨 Alertas**: Notificações quando sensores ultrapassam limites
- **💬 Telegram**: Integração com Bot Telegram (opcional)
- **🌓 Tema**: Suporte a tema claro/escuro

## 🏗️ Arquitetura

```
[Sensores IoT]
     ↓
[MQTT Broker - Mosquitto]
     ↓
[Backend Node.js + Express]
  ├── SQLite (histórico)
  ├── Google Gemini (IA)
  ├── Telegram Bot (alertas)
  └── WebSocket (tempo real)
     ↓
[Frontend React + Vite + Tailwind]
```

## 📦 Stack Tecnológico

### Backend
- **Node.js 20+** com TypeScript
- **Express.js** para API REST
- **MQTT** para ingestão de sensores
- **Socket.IO** para WebSocket
- **SQLite** para persistência
- **Google Generative AI** para IA
- **Axios** para requisições HTTP

### Frontend
- **React 18** com TypeScript
- **Vite** para build rápido
- **Tailwind CSS** para estilos
- **Socket.IO Client** para WebSocket
- **Recharts** para gráficos
- **Zod** para validação

## 🚀 Início Rápido

### 1️⃣ Instalar Mosquitto (MQTT Broker)

Consulte **[MOSQUITTO_SETUP.md](./MOSQUITTO_SETUP.md)** para instruções completas.

**Rápido:**
```powershell
# Windows (Chocolatey)
choco install mosquitto

# Linux
sudo apt install mosquitto

# macOS
brew install mosquitto
```

### 2️⃣ Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Criar arquivo .env
cp env.example .env

# (Opcional) Adicionar chave Gemini
# GEMINI_API_KEY=sua_chave_aqui

# Iniciar servidor
npm run dev
```

### 3️⃣ Iniciar Simulador (Terminal 2)

```bash
cd backend
npm run simulate:sensors
```

### 4️⃣ Configurar Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev
```

Acesse: **http://localhost:5173**

## 📋 Documentação Completa

- **[IMPLEMENTATION_STEPS.md](./IMPLEMENTATION_STEPS.md)** - Guia passo a passo das 4 fases
- **[MOSQUITTO_SETUP.md](./MOSQUITTO_SETUP.md)** - Instalação e configuração do MQTT
- **[TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)** - Configurar Bot Telegram
- **[GUIA_RAPIDO.md](./GUIA_RAPIDO.md)** - Referência rápida
- **[docs/arquitetura.md](./docs/arquitetura.md)** - Arquitetura técnica
- **[backend/README.md](./backend/README.md)** - Detalhes do backend
- **[frontend/README.md](./frontend/README.md)** - Detalhes do frontend

## 📊 Status das Fases

| Fase | Status | Descrição |
|------|--------|-----------|
| 1️⃣ Sensores MQTT | ⏳ Pronto | Mosquitto precisa ser instalado |
| 2️⃣ Google Gemini | ✅ Pronto | API Key necessária |
| 3️⃣ Telegram Bot | ⏳ Pronto | Token e Chat ID necessários |
| 4️⃣ Autenticação JWT | ⏳ Futuro | Próxima melhoria |

## 🔑 Variáveis de Ambiente Essenciais

### Backend (.env)

```env
# API
PORT=3334
CORS_ORIGIN=http://localhost:5173

# MQTT
MQTT_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_SENSOR_TOPIC=sensors/+/data

# Database
DATABASE_PATH=./data/monitoring.db

# IA (Obrigatório para dicas)
GEMINI_API_KEY=sua-chave-aqui

# Telegram (Opcional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## 🧪 Testando o Sistema

### Health Check
```bash
curl http://localhost:3334/health
```

### Gerar Dicas de IA
```bash
curl -X POST http://localhost:3334/api/tips/weather \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 25,
    "humidity": 60,
    "location": "Sala",
    "conditions": "Ensolarado"
  }'
```

### Publicar Dado MQTT
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "sensors/temp-01/data" \
  -m '{"sensorId":"temp-01","type":"temperature","value":25.5,"unit":"°C","timestamp":"2024-11-23T14:00:00Z","metadata":{"location":"Sala"}}'
```

## 📚 Próximos Passos

1. **Fase 1** - Instalar Mosquitto e validar sensores
2. **Fase 2** - Obter API Key Gemini e testar dicas
3. **Fase 3** - Criar Bot Telegram (opcional)
4. **Fase 4** - Implementar autenticação real (futuro)

Consulte **[IMPLEMENTATION_STEPS.md](./IMPLEMENTATION_STEPS.md)** para guia passo a passo!

## 🛠️ Troubleshooting

### MQTT Connection Refused
```bash
# Verificar se Mosquitto está rodando
netstat -an | grep 1883

# Se não estiver, iniciar Mosquitto
mosquitto
```

### Frontend não carrega dados
1. Verifique se backend está na porta 3334: `netstat -an | grep 3334`
2. Abra DevTools (F12) e veja console
3. Verifique `.env` do frontend

### Gemini não gera dicas
1. Verifique API Key em `.env`
2. Teste em https://aistudio.google.com

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte `TROUBLESHOOTING.md` (se existir)
2. Verifique logs do terminal
3. Abra issue no repositório

## 📄 Licença

Projeto acadêmico - UFG 2024/2025


