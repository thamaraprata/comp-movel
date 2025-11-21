# Guia Rápido - Sistema de Monitoramento Ambiental com IA

## 🚀 Arquitetura Geral

O sistema é composto por:
- **Backend**: Node.js + Express para API REST, MQTT, WebSocket e IA
- **Frontend**: React + Vite para interface responsiva (mobile/tablet/desktop)
- **Broker MQTT**: Recebe dados de sensores IoT
- **IA (Gemini)**: Gera dicas contextualizadas baseadas em temperatura/umidade
- **Telegram** (futuro): Bot para alertas e dicas

```
[Sensores IoT] --MQTT--> [Broker MQTT] --MQTT--> [Backend]
                                                      |
                                    +---------+-------+-------+
                                    |         |               |
                              [SQLite]  [Gemini API]  [Telegram Bot]
                                    |         |               |
                                    +----[WebSocket/REST]----+
                                            |
                                      [Frontend React]
```

## 📋 Pré-requisitos

- **Node.js >= 20**
- **Broker MQTT** (Mosquitto local ou serviço hospedado como EMQX)
- **Google Gemini API Key** (https://aistudio.google.com/)
- **npm ou pnpm**

## ⚙️ Setup Rápido

### 1. Backend

```bash
cd backend

# Copiar variáveis de ambiente
cp env.example .env

# Editar .env com sua chave Gemini
# GEMINI_API_KEY=sua_chave_aqui
# MQTT_URL=mqtt://localhost:1883

# Instalar dependências
pnpm install

# Executar migrations
pnpm run migrate

# Iniciar servidor
pnpm run dev
```

Em outro terminal, simule sensores:

```bash
cd backend
pnpm run simulate:sensors
```

### 2. Frontend

```bash
cd frontend

# Instalar dependências
pnpm install

# Iniciar desenvolvimento
pnpm run dev
```

Acesse: http://localhost:5173

## 🔑 Variáveis de Ambiente Essenciais

### Backend (.env)

```env
# API
PORT=3333
CORS_ORIGIN=http://localhost:5173

# MQTT
MQTT_URL=mqtt://localhost:1883
MQTT_SENSOR_TOPIC=sensors/+/data

# Database
DATABASE_PATH=./data/monitoring.db

# IA - OBRIGATÓRIO para dicas
GEMINI_API_KEY=sua-chave-aqui

# Telegram (opcional para futuro)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## 🧪 Testando o Sistema

### 1. Verificar Health Check

```bash
curl http://localhost:3333/health
```

### 2. Gerar Dicas de IA

```bash
curl -X POST http://localhost:3333/api/tips/weather \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 25,
    "humidity": 60,
    "location": "Sua Casa",
    "conditions": "Ensolarado"
  }'
```

### 3. Acessar Dashboard

- URL: http://localhost:5173
- Faça login com qualquer email (mock)
- Veja dados em tempo real dos sensores simulados
- Dicas de IA aparecem baseadas em temperatura/umidade

## 📱 Recursos Principais

### Backend
- ✅ API REST (`/api/dashboard`, `/api/sensors`, `/api/alerts`, `/api/tips`)
- ✅ MQTT para ingestão de dados
- ✅ WebSocket em tempo real (Socket.IO)
- ✅ IA Gemini para dicas contextualizadas
- ✅ Simulador de sensores para desenvolvimento
- ⏳ Bot Telegram (em desenvolvimento)

### Frontend
- ✅ Dashboard responsivo (mobile, tablet, desktop)
- ✅ Cards de sensores com status
- ✅ Gráficos em tempo real
- ✅ Alertas com configuração de limites
- ✅ Dicas de IA personalizadas
- ✅ Tema claro/escuro

## 🔌 Formato de Mensagens MQTT

```json
{
  "sensorId": "temp-01",
  "type": "temperature",
  "value": 24.5,
  "unit": "°C",
  "timestamp": "2024-11-21T14:30:00Z",
  "metadata": {
    "location": "Sala de Estar"
  }
}
```

Tópico: `sensors/{sensorId}/data`

## 🚀 Deploy

### Opção 1: Railway

**Backend:**
- Runtime: Node.js 20
- Build: `npm run build`
- Start: `npm start`
- Variáveis: `DATABASE_URL`, `MQTT_URL`, `GEMINI_API_KEY`

**Frontend:**
- Runtime: Node.js 20
- Build: `npm run build`
- Start: `npm run preview`

### Opção 2: Docker

```dockerfile
# Backend
FROM node:20
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["npm", "start"]
```

## 📊 Próximos Passos

1. **Bot Telegram**: Enviar dicas e alertas via Telegram
2. **Persistência**: Migração para banco de dados em produção
3. **Autenticação**: Sistema real de login (JWT)
4. **Histórico**: Gráficos com maior período histórico
5. **Mobile App**: React Native ou Flutter
6. **Node-RED**: Integração com Node-RED para fluxos customizados

## 🆘 Troubleshooting

### Erro de conexão MQTT
- Verificar se broker está rodando: `netstat -an | grep 1883`
- Instalar Mosquitto: `brew install mosquitto` (macOS) ou `sudo apt-get install mosquitto` (Linux)

### Erro de API do Gemini
- Verificar chave em https://aistudio.google.com
- Certificar que a conta tem quota disponível

### Dados não aparecem no Frontend
- Verificar CORS: `CORS_ORIGIN=http://localhost:5173` em .env
- Abrir Dev Tools (F12) e ver console
- Verificar que backend está rodando na porta 3333

## 📚 Documentação Adicional

- Architecture: `/docs/arquitetura.md`
- Backend README: `/backend/README.md`
- Frontend README: `/frontend/README.md`

