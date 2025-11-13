# Integrações Futuras

## Bot do Telegram

1. Criar bot via `@BotFather`, anotar `BOT_TOKEN`.
2. Obter `CHAT_ID`:
   - Adicionar bot ao grupo/canal.
   - Usar `curl https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`.
3. Configurar variáveis no backend (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).
4. Habilitar envio: função `sendTelegramAlert` em `backend/src/integrations/telegram.ts`.
5. Personalizar mensagem (Markdown) com dados extras (`metadata.location`, etc.).

## Webhooks Externos

- Adicionar nova função em `backend/src/integrations` (ex.: Slack, Teams).
- Reutilizar `evaluateReadingForAlert` para disparar múltiplos canais.

## Analytics e Machine Learning

- Exportar dados para plataforma (BigQuery, PowerBI).
- Implementar previsão de tendência (regressão linear).

## Notificações Mobile

- Criar app React Native/Expo.
- Consumir WebSocket para alertas push.

