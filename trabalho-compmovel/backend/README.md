# Backend – API e Processamento

Servidor Node.js + Express responsável por gerenciar dados climáticos, persistir no PostgreSQL, emitir alertas e disponibilizar dados via API REST e WebSocket.

## Requisitos

- Node.js >= 20
- PostgreSQL (banco de dados relacional)
- Docker (opcional, para ambiente completo)

## Setup

```bash
cp env.example .env
npm install
npm run migrate   # cria tabelas
npm run dev       # inicia API + WebSocket
```

## Variáveis de ambiente

| Variável              | Descrição                                   | Default                  |
| --------------------- | ------------------------------------------- | ------------------------ |
| `PORT`                | Porta HTTP da API                           | `3333`                   |
| `CORS_ORIGIN`         | Origem permitida para o frontend            | `http://localhost:5173`  |
| `DATABASE_PATH`       | Caminho do arquivo SQLite                   | `./data/monitoring.db`   |
| `TELEGRAM_BOT_TOKEN`  | Token do bot do Telegram                    | -                        |
| `TELEGRAM_CHAT_ID`    | Chat ID para notificações                   | -                        |
| `GEMINI_API_KEY`      | API key do Google Gemini para dicas IA      | -                        |
| `OPENWEATHER_API_KEY` | API key do OpenWeather                      | -                        |

## Scripts

- `npm run dev` – modo desenvolvimento (hot reload com `tsx watch`)
- `npm run build` – build para produção (`dist/`)
- `npm run start` – rodar build em produção
- `npm run migrate` – executa migrations SQL
- `npm run seed` – insere dados de sensores de exemplo
- `npm run test` – testes unitários (Vitest)

## Estrutura

- `src/config` – carregamento de variáveis, constantes, logger
- `src/database` – conexão PostgreSQL, migrations e seed
- `src/services` – regras de negócio (alertas, thresholds, sensores, clima)
- `src/routes` – rotas Express (dashboard, sensores, alertas, clima, chat)
- `src/realtime` – Socket.IO (eventos em tempo real)
- `src/integrations` – integrações externas (Telegram, Google Gemini, OpenWeather)
- `src/types` – interfaces TypeScript compartilhadas

## Deploy

- Railway/Render (Node 20, build + start)
- PostgreSQL gerenciado (Railway/Supabase)
- Configurar variáveis de ambiente
- Executar migrations no deploy

