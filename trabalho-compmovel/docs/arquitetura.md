# Arquitetura do Sistema de Monitoramento Ambiental

## Visão Geral dos Componentes

```mermaid
graph TD
    S(Sensores IoT)<-->B[Broker MQTT]
    B-->MQTTClient[Cliente MQTT (backend)]
    MQTTClient-->Service[Serviço de Processamento]
    Service-->DB[(SQLite)]
    Service-->WS[WebSocket]
    Service-. Futuro .->Telegram[Bot Telegram]
    WS-->Dashboard[Frontend React]
    Dashboard-->API[API REST]
    API-->DB
```

### Broker MQTT

- Tópico padrão dos sensores: `sensors/{sensorId}/data`
- Mensagens JSON com campos `sensorId`, `type`, `value`, `timestamp`, `metadata`
- Tópico para alertas internos: `alerts/{sensorId}`
- Broker de desenvolvimento: Mosquitto local (`mqtt://localhost:1883`)

### Backend (Node.js + Express)

- `src/index.ts`: bootstrap da aplicação Express, WebSocket e MQTT.
- `src/mqtt/`: assinaturas MQTT e normalização de payloads.
- `src/services/alertService.ts`: avaliação de regras, emissão de alertas.
- `src/database/`: conexão SQLite via `better-sqlite3` (desenvolvimento) com migrations.
- `src/api/`: rotas REST (`/sensors`, `/alerts`, `/metrics`, `/config`).
- `src/realtime/`: gateway WebSocket (Socket.IO).
- `src/config/`: variáveis de ambiente, limites padrão, chaves de integração.

### Frontend (React + Vite + Tailwind)

- `src/pages/Login.tsx`: tela simples de autenticação.
- `src/pages/Dashboard.tsx`: layout geral com cards, gráficos e alertas.
- `src/components/`: componentes reutilizáveis (cards, gráficos, toggles de tema).
- `src/hooks/useRealtime.ts`: consumo de WebSocket para updates ao vivo.
- `src/services/api.ts`: cliente REST (Axios).
- Tema claro/escuro via `tailwindcss` + `@headlessui/react`.

## Fluxos Principais

### 1. Injeção de Dados

1. Sensor publica em `sensors/{sensorId}/data`.
2. Backend recebe pelo cliente MQTT.
3. Payload validado, enriquecido e armazenado no SQLite.
4. AlertService verifica limites e dispara alertas quando necessário.
5. Eventos em tempo real enviados via WebSocket.

### 2. Dashboard ao vivo

1. Usuário autentica (mock simples na versão inicial).
2. App carrega dados históricos via API REST (`/metrics/history`).
3. App abre WebSocket (`/ws`) e assina eventos de sensores.
4. Gráficos e cards atualizados conforme leituras chegam.

### 3. Configuração de alertas

1. Usuário altera limites no painel.
2. Frontend salva no backend via `/config/thresholds`.
3. Backend atualiza valores em tabela `thresholds`.
4. AlertService usa novos limites nas próximas leituras.

## Banco de Dados (SQLite)

Tabelas iniciais:

- `sensors` (`id`, `name`, `location`, `type`, `created_at`)
- `readings` (`id`, `sensor_id`, `type`, `value`, `unit`, `timestamp`, `metadata`)
- `alerts` (`id`, `sensor_id`, `rule`, `value`, `threshold`, `status`, `created_at`, `resolved_at`)
- `thresholds` (`sensor_type`, `min_value`, `max_value`, `updated_at`)

Migrations gerenciadas via `knex` (ou `drizzle-kit`) com scripts NPM.

## Deploy

- **Frontend (Vercel)**: build Vite (`npm run build`), variáveis `VITE_API_URL`, `VITE_WS_URL`.
- **Backend (Railway)**: Node.js 20+, `npm run migrate`, vars `DATABASE_URL`, `MQTT_URL`, `TELEGRAM_BOT_TOKEN`.
- **Broker**: utilizar serviço gerenciado (EMQX Cloud ou HiveMQ) ou instância Railway (container Mosquitto).

## Próximos Passos

- [ ] Configurar scaffolds de frontend (`frontend/`).
- [ ] Configurar scaffolds de backend (`backend/`).
- [ ] Implementar pipeline de alertas e canal Telegram opcional.
- [ ] Adicionar testes e monitoramento (Playwright + Vitest / Jest).



