# 🚀 Quick Start - Sistema de Monitoramento Climático

Guia rápido para subir a aplicação em menos de 5 minutos.

## Pré-requisitos

- Docker e Docker Compose instalados
- Chaves de API: OpenWeather, Google Gemini

## 1. Configurar Ambiente

```bash
# Copiar arquivo de exemplo
cp backend/env.example backend/.env
```

Edite `backend/.env` e adicione suas chaves:

```env
# OBRIGATÓRIO
OPENWEATHER_API_KEY=sua_chave_openweather
GEMINI_API_KEY=sua_chave_gemini

# OPCIONAL
TELEGRAM_BOT_TOKEN=seu_token_telegram

# Demais variáveis já vêm configuradas
```

**Onde obter as chaves:**
- OpenWeather: https://openweathermap.org/api (conta gratuita)
- Gemini: https://ai.google.dev (gratuito)
- Telegram: @BotFather no Telegram (opcional)

## 2. Subir Aplicação

```bash
# Subir todos os serviços
docker-compose up -d

# Entrar no container do backend
docker exec -it backend sh

# Executar migração
npm run migrate
exit

# Executar SQL diretamente no PostgreSQL
docker exec -i postgres-weather psql -U weather_user -d weather_db < backend/database/migrations/001_create_auth_tables.sql

docker exec backend npm run seed
```

## 3. Acessar

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3334

## 4. Usar

1. Acesse http://localhost:5173
2. Clique em "Registrar" e crie uma conta
3. Faça login
4. Explore o dashboard com dados climáticos em tempo real!

## 📱 Extras

### Usar no Telegram (Opcional)

Se configurou o `TELEGRAM_BOT_TOKEN`:
1. Procure seu bot no Telegram
2. Envie `/start`
3. Use `/clima`, `/dicas`, `/cidade`, etc.

### Ver Logs

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Parar

```bash
docker-compose down
```

## 🐛 Problemas?

- **Backend não inicia**: `docker logs backend`
- **Clima não atualiza**: Verifique `OPENWEATHER_API_KEY` no `.env`
- **Dicas não aparecem**: Verifique `GEMINI_API_KEY` no `.env`

Consulte o [README.md](README.md) para documentação completa.
