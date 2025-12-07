# 🤖 Guia de Configuração do Bot do Telegram

## 📋 Pré-requisitos

- Conta no Telegram
- Backend rodando (Node.js)
- Chaves API configuradas (OpenWeather + Gemini)

## 1️⃣ Criar o Bot no Telegram

### Passo 1: Falar com o BotFather

1. Abra o Telegram
2. Procure por `@BotFather`
3. Envie `/start`
4. Envie `/newbot`

### Passo 2: Configurar o Bot

```
BotFather: Alright, a new bot. How are we going to call it?
           Please choose a name for your bot.

Você: Clima Bot

BotFather: Good. Now let's choose a username for your bot.
           It must end in `bot`. Like this, for example: TetrisBot or tetris_bot.

Você: clima_weather_bot

BotFather: Done! Congratulations on your new bot. You will find it at t.me/clima_weather_bot.
           You can now add a description...

           Use this token to access the HTTP API:
           1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789
```

### Passo 3: Copiar o Token

Copie o token que aparece (similar a `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789`)

## 2️⃣ Configurar o Backend

### Adicionar Token no .env

Edite o arquivo `backend/.env` e adicione:

```env
# TELEGRAM BOT
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789
```

### Reiniciar o Backend

```bash
cd backend
npm run dev
```

Você deve ver no console:

```
[INFO] Telegram bot started
```

## 3️⃣ Usar o Bot

### Iniciar Conversa

1. Abra o Telegram
2. Procure pelo username do seu bot (ex: `@clima_weather_bot`)
3. Clique em "Start" ou envie `/start`

### Comandos Disponíveis

#### 🌡️ Clima Atual
```
/clima
```
Retorna temperatura, umidade, vento e condições climáticas da sua cidade.

**Exemplo de resposta:**
```
🌤️ Clima em São Paulo

🌡️ Temperatura: 23°C
🌡️ Sensação: 22°C
💧 Umidade: 65%
💨 Vento: 12 km/h
☁️ Condições: céu limpo

🕐 Atualizado: 14:30:25
```

#### 💡 Dicas Personalizadas
```
/dicas
```
Gera 4 dicas personalizadas com IA Gemini, incluindo:
- Roupas recomendadas
- **Lugares específicos da cidade para visitar**
- Cuidados com saúde
- Dica extra contextualizada

**Exemplo de resposta para Goiânia:**
```
💡 Dicas Personalizadas para Goiânia
🌡️ 28°C • 💧 55%

👕 Vista roupas leves 🟡
Com 28°C em Goiânia, opte por roupas frescas e respiráveis.

✅ Ações:
  • Use shorts e camisetas
  • Prefira cores claras
  • Leve um boné

━━━━━━━━━━━━━

🏞️ Visite o Parque Flamboyant 🟢
Clima perfeito para caminhar no principal parque de Goiânia!

✅ Ações:
  • Faça uma caminhada pela manhã
  • Leve água
  • Tire fotos na lagoa

━━━━━━━━━━━━━

💧 Mantenha-se hidratado 🔴
Com baixa umidade, beba água regularmente.

✅ Ações:
  • Beba pelo menos 2L de água
  • Evite exposição ao sol 12h-16h
  • Use hidratante

━━━━━━━━━━━━━

🎡 Conheça o Mutirama 🟢
Parque de diversões ideal para o clima atual!

✅ Ações:
  • Leve a família
  • Vá no fim de tarde
  • Experimente as atrações ao ar livre

🤖 Gerado por IA Gemini
```

#### 📍 Trocar de Cidade
```
/cidade Goiânia
```

Ou ver sua cidade atual:
```
/cidade
```

#### 🏙️ Listar Cidades
```
/cidades
```

Lista todas as cidades disponíveis organizadas por região.

#### 📊 Histórico
```
/historico
```

Mostra as últimas 5 leituras de temperatura.

#### 📈 Estatísticas
```
/stats
```

Mostra temperatura mínima, máxima e média das últimas 24 horas.

#### ❓ Ajuda
```
/ajuda
```

Mostra todos os comandos disponíveis.

## 4️⃣ Personalização (Opcional)

### Adicionar Foto de Perfil

1. Fale com `@BotFather`
2. Envie `/mybots`
3. Selecione seu bot
4. Clique em "Edit Bot"
5. Clique em "Edit Profile Photo"
6. Envie uma imagem

### Adicionar Descrição

1. Fale com `@BotFather`
2. Envie `/mybots`
3. Selecione seu bot
4. Clique em "Edit Bot"
5. Clique em "Edit Description"
6. Envie:

```
Receba informações climáticas e dicas personalizadas com IA!

🌡️ Clima em tempo real
💡 Dicas inteligentes
📊 Estatísticas
🏙️ Múltiplas cidades

Desenvolvido com Node.js + Gemini AI
```

### Adicionar Comandos no Menu

1. Fale com `@BotFather`
2. Envie `/mybots`
3. Selecione seu bot
4. Clique em "Edit Bot"
5. Clique em "Edit Commands"
6. Cole:

```
clima - Ver clima atual
dicas - Dicas personalizadas com IA
historico - Últimas 5 leituras
stats - Estatísticas (min/max/média)
cidade - Trocar ou ver cidade
cidades - Lista de cidades disponíveis
ajuda - Guia completo
```

## 5️⃣ Testando

### Fluxo Completo de Teste

1. **Iniciar bot:**
   ```
   /start
   ```

2. **Escolher cidade:**
   ```
   /cidades
   /cidade Goiânia
   ```

3. **Ver clima:**
   ```
   /clima
   ```

4. **Receber dicas:**
   ```
   /dicas
   ```
   *(Aguarde ~3-5 segundos para IA gerar)*

5. **Ver histórico:**
   ```
   /historico
   ```

6. **Ver estatísticas:**
   ```
   /stats
   ```

## 🐛 Troubleshooting

### Bot não responde

**Problema:** Mensagens não chegam

**Solução:**
1. Verifique se backend está rodando
2. Verifique logs do backend para erros
3. Confirme token no `.env`
4. Reinicie backend

### "TELEGRAM_BOT_TOKEN not configured"

**Problema:** Token não configurado

**Solução:**
1. Adicione `TELEGRAM_BOT_TOKEN=...` no `backend/.env`
2. Reinicie backend

### Dicas não são geradas

**Problema:** `/dicas` retorna erro

**Solução:**
1. Verifique `GEMINI_API_KEY` no `.env`
2. Verifique rate limit da API Gemini
3. Veja logs do backend

### Clima não encontrado

**Problema:** "Não foi possível obter dados"

**Solução:**
1. Verifique `OPENWEATHER_API_KEY` no `.env`
2. Confirme que cidade está escrita corretamente
3. Use `/cidades` para ver opções válidas

## 💡 Dicas de Uso

### Para Usuários

- Use `/cidade` primeiro para escolher sua localização
- As dicas incluem lugares **reais e específicos** da sua cidade
- Dados são atualizados a cada 5 minutos automaticamente
- Use `/dicas` quando trocar de cidade para ver sugestões locais

### Para Desenvolvedores

- Logs detalhados no backend (`logger.info`)
- Usuários são salvos em memória (Map)
- Para produção, considere persistir usuários em banco
- Rate limit do Gemini: ~15 requisições/minuto

## 📊 Funcionalidades

### ✅ Implementado

- [x] Clima atual com emojis
- [x] Dicas personalizadas com IA
- [x] Lugares específicos por cidade
- [x] Múltiplas cidades brasileiras
- [x] Histórico e estatísticas
- [x] Mensagens em Português
- [x] Formatação Markdown
- [x] Tratamento de erros

### 🚀 Possíveis Melhorias

- [ ] Notificações automáticas (alertas de clima)
- [ ] Gráficos de temperatura
- [ ] Previsão para próximos dias
- [ ] Comandos inline (@bot clima)
- [ ] Botões interativos (Keyboard)
- [ ] Salvar preferências em banco de dados

## 📝 Exemplo Completo

```
Você: /start

Bot: 🌤️ Olá, João! Bem-vindo ao Bot de Clima

     Receba informações climáticas e dicas personalizadas!

     📍 Sua cidade atual: São Paulo

     [lista de comandos...]

Você: /cidade Goiânia

Bot: ✅ Cidade alterada para: Goiânia (GO)

     Use /clima ou /dicas para ver informações!

Você: /dicas

Bot: 🤖 Gerando dicas personalizadas com IA...

     [após 3-5 segundos]

     💡 Dicas Personalizadas para Goiânia
     🌡️ 28°C • 💧 55%

     [4 dicas com lugares específicos de Goiânia...]

     🤖 Gerado por IA Gemini
```

## 🔗 Links Úteis

- [Documentação Telegraf](https://telegraf.js.org/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [BotFather](https://t.me/botfather)
- [OpenWeather API](https://openweathermap.org/api)
- [Google Gemini](https://ai.google.dev)

---

🎉 **Pronto!** Seu bot está configurado e funcionando!
