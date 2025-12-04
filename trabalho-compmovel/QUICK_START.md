# 🚀 Guia Rápido - Sistema de Monitoramento Climático

## ⚡ Inicio em 5 minutos

### 1️⃣ Clonar e instalar dependências

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2️⃣ Configurar variáveis de ambiente

**backend/.env**
```env
PORT=3334
CORS_ORIGIN=http://localhost:5173
OPENWEATHER_API_KEY=sua_chave_do_openweather
GEMINI_API_KEY=sua_chave_do_gemini
OPENWEATHER_CITY=São Paulo
OPENWEATHER_COUNTRY_CODE=BR
```

### 3️⃣ Iniciar backend

```bash
cd backend
npm run dev
```

Backend estará em: http://localhost:3334

### 4️⃣ Iniciar frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend estará em: http://localhost:5173

### 5️⃣ Abrir no navegador

Acesse: **http://localhost:5173**

## 📱 Usar no Mobile

### Via PWA
1. Abra http://localhost:5173 no mobile
2. Clique em "Instalar" (opção do navegador)
3. Acesse como app nativo

### Via Telegram (Opcional)
1. Configure `TELEGRAM_BOT_TOKEN` em `.env`
2. Procure seu bot no Telegram
3. Use `/clima`, `/dicas`, `/stats`, etc.

## 🔑 Onde Obter as Chaves

### OpenWeather API
- Site: https://openweathermap.org/api
- Crie conta gratuita
- Copie a API Key

### Google Gemini
- Site: https://ai.google.dev
- Crie um projeto
- Gere uma chave API

### Telegram Bot (Opcional)
- Procure @BotFather no Telegram
- Comandos: `/newbot`
- Copie o token

## 🧪 Testar Endpoints

```bash
# Clima atual
curl http://localhost:3334/api/weather

# Histórico 24h
curl http://localhost:3334/api/weather/history

# Estatísticas
curl http://localhost:3334/api/weather/stats

# Forçar atualização
curl -X POST http://localhost:3334/api/weather/refresh

# Listar cidades disponíveis
curl http://localhost:3334/api/weather/cities
```

## 💡 Funcionalidades

### Atualizações Automáticas
- Clima atualiza a cada **5 minutos** automaticamente
- Dicas inteligentes geradas com Gemini
- Histórico de 24 horas mantido em memória

### Responsividade
- Funciona em mobile, tablet e desktop
- Grid adaptativo
- Touch-friendly

### Offline & PWA
- Funciona sem internet
- Cache automático
- Installável como app

### Sincronização
- Dados sincronizados em tempo real via WebSocket
- LocalStorage para persistência
- Mesmos dados entre dispositivos

## 📊 O que você verá

1. **Card Climático**: Temperatura, umidade, vento com countdown para próxima atualização
2. **Dicas Inteligentes**: Sugestões contextualizadas do Gemini
3. **Histórico**: Dados dos últimos 24h com gráficos
4. **Estatísticas**: Mín/Máx/Média de temperatura e umidade

## ⚙️ Customização Rápida

### Mudar Cidade
1. Edite `OPENWEATHER_CITY` em `backend/.env`
2. Reinicie o backend

### Mudar Intervalo de Atualização
1. Abra `backend/src/services/weatherScheduler.ts`
2. Mude `*/5 * * * *` (linha ~51) para sua preferência
   - `*/10 * * * *` = 10 minutos
   - `0 * * * *` = 1 hora

### Mudar Cores/Tema
1. Edite `frontend/src/components/WeatherCard.tsx`
2. Mude as cores Tailwind (ex: `bg-red-50` → `bg-blue-50`)

## 🐛 Problemas Comuns

### "API Key inválida"
- Verifique se copiou corretamente em `.env`
- Confirme que ativou a chave na console

### "Clima não atualiza"
- Verifique `OPENWEATHER_API_KEY` em `backend/.env`
- Veja logs do backend (`npm run dev`)

### "Dicas não aparecem"
- Confirme `GEMINI_API_KEY` em `backend/.env`
- Espere 5 minutos para primeira atualização

### "Frontend não conecta"
- Verifique `CORS_ORIGIN` em `backend/.env`
- Backend deve estar rodando na porta 3334

## 📚 Arquivos Principais

- `backend/src/services/weatherScheduler.ts` - Atualizações climáticas
- `backend/src/integrations/telegram.ts` - Bot Telegram
- `frontend/src/components/WeatherCard.tsx` - UI climática
- `frontend/src/serviceWorker.ts` - PWA e offline

## 🎓 Conceitos de Computação Móvel & Ubíqua

✅ **Continuidade**: Use no desktop, continue no mobile
✅ **Responsividade**: Funciona em qualquer tela
✅ **Offline**: PWA funciona sem internet
✅ **Sincronização**: Dados atualizados em tempo real
✅ **Escalabilidade**: Suporta múltiplos dispositivos

---

Dúvidas? Verifique README.md ou CHANGELOG.md
