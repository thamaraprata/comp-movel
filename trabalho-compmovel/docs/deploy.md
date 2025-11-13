# Deploy e Operação

## Visão Geral

- **Frontend (Vercel)**: build estático Vite.
- **Backend (Railway)**: Node.js + Express + SQLite (volume persistente).
- **Broker MQTT**: instância Mosquitto/EMQX (Railway, CloudMQTT ou HiveMQ).

## Passos – Frontend (Vercel)

1. Importar repositório Git.
2. Definir comandos:
   - Build: `pnpm install && pnpm run build`
   - Output: `dist/`
3. Variáveis (`Project Settings` → `Environment Variables`):
   - `VITE_API_URL=https://<backend>.railway.app/api`
   - `VITE_WS_URL=wss://<backend>.railway.app`
4. Habilitar preview/production.

## Passos – Backend (Railway)

1. Criar novo projeto → `Deploy from Repo`.
2. Configurar `NIXPACKS` (auto) ou `Dockerfile` (opcional).
3. Variáveis de ambiente:
   - `PORT=3333`
   - `CORS_ORIGIN=https://<frontend>.vercel.app`
   - `MQTT_URL=mqtt://<broker-host>:1883`
   - `MQTT_USERNAME` / `MQTT_PASSWORD` (se aplicável)
   - `MQTT_SENSOR_TOPIC=sensors/+/data`
   - `DATABASE_PATH=/data/monitoring.db`
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (quando disponível)
4. Montar volume persistente:
   - `railway volume create monitoring-data --size 1`
   - Montar em `/data`
5. Comandos Railway (package.json):
   - Build: `pnpm install && pnpm run build`
   - Start: `pnpm run start`
   - Post-deploy: `pnpm run migrate && pnpm run seed`

## Broker MQTT

- **Railway**: criar serviço Mosquitto (`mqtt://...railway.app:1883`).
- Alternativa: EMQX Cloud (Free tier).
- Definir tópicos no backend/frontend:
  - Publish: `sensors/{sensorId}/data` (JSON)
  - Opcional: `alerts/{sensorId}`

## Observabilidade

- Ativar logs no Railway (pino).
- Configurar alertas (Railway Metrics) para uso de CPU/RAM.
- Futuro: integrar Prometheus/Grafana.

## Rotina de Deploy

1. Merge na branch `main`.
2. Vercel e Railway fazem deploy automaticamente.
3. Validar endpoint `/health`.
4. Enviar mensagem MQTT de teste (ver `backend/scripts/publish-sample.ts`).
5. Verificar dashboard em produção.

## Integrações Futuras

- **Telegram Bot**: habilitar variáveis, publicar alertas via Bot API.
- **Notificações WebPush**: adicionar Service Worker no frontend.
- **CI/CD**: GitHub Actions para testes/lint antes do deploy.

