# Configuração do Bot Telegram

Este guia explica como configurar o Bot Telegram para enviar e receber dicas de IA e alertas de sensores.

## 🤖 Criar um Bot no Telegram

### Passo 1: Contatar BotFather

1. Abra o Telegram (https://web.telegram.org ou app)
2. Procure por `@BotFather`
3. Inicie uma conversa
4. Envie o comando `/newbot`

### Passo 2: Configurar Bot

1. BotFather pedirá um nome (ex: "Sensor Monitor Bot")
2. BotFather pedirá um usuário único (ex: "@meu_sensor_bot")
3. Você receberá um **Token** - GUARDE ISTO!

Exemplo de token:
```
123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefg
```

## 🔌 Configuração no Backend

### 1. Adicionar Variáveis de Ambiente

Editar `.env`:

```env
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id
```

### 2. Obter CHAT_ID

#### Opção A: Via BotFather (Simples)

1. No Telegram, procure por `@userinfobot`
2. Envie uma mensagem qualquer
3. Você receberá seu ID (ex: `12345678`)

#### Opção B: Via API Telegram

```bash
curl https://api.telegram.org/bot{TOKEN}/getUpdates
```

Procure por `"id"` em `"chat"`.

### 3. Instalar Dependências

```bash
cd backend
pnpm install
```

## 📝 Testando o Bot

### 1. Enviar Mensagem Simples

```bash
curl -X POST http://localhost:3333/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "chat": { "id": 123456789 },
      "text": "dica",
      "from": { "first_name": "João" }
    }
  }'
```

### 2. Iniciar o Backend

```bash
cd backend
pnpm run dev
```

### 3. Iniciar Simulador de Sensores

```bash
cd backend
pnpm run simulate:sensors
```

## 🎯 Comandos do Bot

No Telegram, conversar com seu bot:

### Comandos Disponíveis

```
/start    - Iniciar bot
/dica     - Receber dicas personalizadas
/status   - Ver status dos sensores
```

Ou simplesmente escrever:
- "dica" ou "conselho" → Recebe dicas de IA
- "status" ou "sensores" → Vê dados dos sensores
- Qualquer outro texto → Menu de ajuda

## 🌐 Webhook Setup (Produção)

Para produção, configure webhook ao invés de polling:

### 1. Defina o Webhook

```bash
curl -X POST https://api.telegram.org/bot{TOKEN}/setWebhook \
  -d "url=https://seu-dominio.com/api/telegram/webhook"
```

### 2. Verificar Webhook

```bash
curl https://api.telegram.org/bot{TOKEN}/getWebhookInfo
```

## 📊 Exemplos de Mensagens

### Resposta com Dicas de IA

```
💡 Olá João! Aqui estão dicas personalizadas:

1. *Vista roupas leves*
🌡️ Com 25°C, o clima está agradável para roupas leves de algodão.

2. *Mantenha-se hidratado*
💧 A umidade está em 60%, beba água regularmente.
```

### Resposta com Status de Sensores

```
📊 *Status dos Sensores*

Sensor Temperatura - Sala de Estar
  Tipo: temperature
  Valor: 25.5°C
  Local: Sala de Estar

Sensor Umidade - Quarto
  Tipo: humidity
  Valor: 55%
  Local: Quarto
```

## ⚠️ Troubleshooting

### Bot não responde
1. Verificar se `TELEGRAM_BOT_TOKEN` está correto
2. Verificar se `TELEGRAM_CHAT_ID` está correto
3. Verificar logs: `pnpm run dev`

### Webhook retorna erro
1. Verificar CORS em backend
2. Testar com curl antes

### Permissões negadas
1. Verificar se bot foi iniciado `/start`
2. Verificar privacidade do bot (BotFather → Edit Bot)

## 🚀 Próximas Melhorias

- [ ] Webhook automático para alertas
- [ ] Comandos com buttons inline
- [ ] Gráficos nos alertas
- [ ] Integração com WhatsApp
- [ ] Notificações programadas

## 📚 Links Úteis

- Telegram Bot API: https://core.telegram.org/bots
- BotFather: https://t.me/botfather
- User Info Bot: https://t.me/userinfobot
- Webhook Tester: https://webhook.site

