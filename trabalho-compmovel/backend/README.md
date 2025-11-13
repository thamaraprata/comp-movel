# Backend – API, MQTT e Processamento

Servidor Node.js + Express responsável por receber leituras de sensores via MQTT, persistir no SQLite, emitir alertas e disponibilizar dados via API REST e WebSocket.

## Requisitos

- Node.js >= 20
- Banco SQLite (arquivo local)
- Broker MQTT (Mosquitto, HiveMQ, EMQX, etc.)

## Setup

```bash
cp env.example .env
pnpm install
pnpm run migrate   # cria tabelas
pnpm run dev       # inicia API + MQTT + WebSocket
```

## Variáveis de ambiente

| Variável              | Descrição                                   | Default                  |
| --------------------- | ------------------------------------------- | ------------------------ |
| `PORT`                | Porta HTTP da API                           | `3333`                   |
| `CORS_ORIGIN`         | Origem permitida para o frontend            | `http://localhost:5173`  |
| `MQTT_URL`            | URL do broker MQTT                          | `mqtt://localhost:1883`  |
| `MQTT_SENSOR_TOPIC`   | Tópico wildcard das leituras                | `sensors/+/data`         |
| `DATABASE_PATH`       | Caminho do arquivo SQLite                   | `./data/monitoring.db`   |
| `TELEGRAM_BOT_TOKEN`  | Token do bot (integração futura)            | -                        |
| `TELEGRAM_CHAT_ID`    | Chat ID para notificações (integração futura) | -                      |

## Scripts

- `pnpm run dev` – modo desenvolvimento (hot reload com `tsx watch`)
- `pnpm run build` – build para produção (`dist/`)
- `pnpm run start` – rodar build em produção
- `pnpm run migrate` – executa migrations SQL
- `pnpm run seed` – insere dados de sensores de exemplo
- `pnpm run test` – testes unitários (Vitest)

## Estrutura

- `src/config` – carregamento de variáveis, constantes, logger
- `src/database` – conexão SQLite, migrations e seed
- `src/mqtt` – cliente MQTT, parser de mensagens
- `src/services` – regras de negócio (alertas, thresholds)
- `src/routes` – rotas Express (dashboard, sensores, alertas)
- `src/realtime` – Socket.IO (eventos em tempo real)
- `src/integrations` – integrações externas (Telegram)

## Deploy

- Railway (Node 20, build + start)
- Montar volume/persistência para `data/`
- Configurar variáveis e URL do broker MQTT hospedado (EMQX Cloud, etc.)

