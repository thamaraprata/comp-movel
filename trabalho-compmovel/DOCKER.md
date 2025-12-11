# 🐳 Docker - Guia Completo

Este guia explica como executar toda a aplicação usando Docker.

## 📋 Pré-requisitos

- Docker Desktop instalado
- Docker Compose instalado

## 🚀 Início Rápido

### 1. Configurar variáveis de ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas chaves de API
# IMPORTANTE: Preencher GEMINI_API_KEY, TELEGRAM_BOT_TOKEN, OPENWEATHER_API_KEY
```

### 2. Iniciar todos os serviços

```bash
docker-compose up -d
```

### 3. Acessar a aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3334
- **PostgreSQL**: localhost:5432

### 4. Executar migrações do banco

```bash
# Entrar no container do backend
docker exec -it backend sh

# Executar migração
npm run migrate

# Ou executar SQL diretamente no PostgreSQL
docker exec -i postgres-weather psql -U weather_user -d weather_db < backend/database/migrations/001_create_auth_tables.sql
```

## 📦 Serviços Incluídos

### PostgreSQL
- **Porta**: 5432
- **Database**: weather_db
- **User**: weather_user
- **Password**: weather_pass_123
- **Volume persistente**: `postgres_data`

### Backend (Node.js + Express + TypeScript)
- **Porta**: 3334
- **Hot reload**: ✅ Ativado
- **Logs**: `docker logs backend -f`

### Frontend (React + Vite + TypeScript)
- **Porta**: 5173
- **Hot reload**: ✅ Ativado
- **Logs**: `docker logs frontend -f`

## 🛠️ Comandos Úteis

### Iniciar serviços
```bash
docker-compose up -d
```

### Parar serviços
```bash
docker-compose down
```

### Ver logs
```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker logs backend -f
docker logs frontend -f
docker logs postgres-weather -f
```

### Rebuild após mudanças no Dockerfile
```bash
docker-compose up -d --build
```

### Acessar shell dos containers
```bash
# Backend
docker exec -it backend sh

# Frontend
docker exec -it frontend sh

# PostgreSQL
docker exec -it postgres-weather psql -U weather_user -d weather_db
```

### Limpar tudo (⚠️ Remove dados!)
```bash
# Parar e remover containers, redes e volumes
docker-compose down -v

# Remover imagens também
docker-compose down -v --rmi all
```

## 🔧 Desenvolvimento

### Instalar novas dependências

```bash
# Backend
docker exec -it backend npm install nome-do-pacote

# Frontend
docker exec -it frontend npm install nome-do-pacote
```

### Executar comandos npm

```bash
# Backend
docker exec -it backend npm run <comando>

# Frontend
docker exec -it frontend npm run <comando>
```

## 🗄️ Banco de Dados

### Conectar ao PostgreSQL

```bash
# Via container
docker exec -it postgres-weather psql -U weather_user -d weather_db

# Via host (localhost:5432)
psql -h localhost -U weather_user -d weather_db
```

### Executar SQL

```bash
# Executar arquivo SQL
docker exec -i postgres-weather psql -U weather_user -d weather_db < arquivo.sql

# Executar comando inline
docker exec -it postgres-weather psql -U weather_user -d weather_db -c "SELECT * FROM users;"
```

### Backup e Restore

```bash
# Backup
docker exec postgres-weather pg_dump -U weather_user weather_db > backup.sql

# Restore
docker exec -i postgres-weather psql -U weather_user -d weather_db < backup.sql
```

## 🐛 Troubleshooting

### Porta já em uso

```bash
# Verificar o que está usando a porta
netstat -ano | findstr :5432
netstat -ano | findstr :3334
netstat -ano | findstr :5173

# Parar processo ou mudar porta no docker-compose.yml
```

### Container não inicia

```bash
# Ver logs
docker logs nome-do-container

# Verificar status
docker ps -a

# Remover e recriar
docker-compose down
docker-compose up -d
```

### Mudanças não aparecem

```bash
# Rebuild forçado
docker-compose up -d --build --force-recreate
```

### Limpar cache do Docker

```bash
docker system prune -a
```

## 🌐 Variáveis de Ambiente

### Obrigatórias
- `GEMINI_API_KEY` - Chave da API do Google Gemini
- `TELEGRAM_BOT_TOKEN` - Token do bot do Telegram
- `OPENWEATHER_API_KEY` - Chave da API OpenWeather

### Opcionais
- `JWT_SECRET` - Secret para JWT (padrão fornecido)
- `JWT_EXPIRES_IN` - Expiração do token (padrão: 15m)
- `REFRESH_TOKEN_EXPIRES_DAYS` - Dias de expiração refresh (padrão: 7)
- `OPENWEATHER_CITY` - Cidade padrão (padrão: São Paulo)
- `OPENWEATHER_COUNTRY_CODE` - Código do país (padrão: BR)

## 📚 Arquitetura

```
┌─────────────────────────────────────────┐
│         Frontend (React + Vite)         │
│              Port: 5173                 │
└───────────────┬─────────────────────────┘
                │ HTTP + WebSocket
┌───────────────┴─────────────────────────┐
│      Backend (Express + Socket.IO)      │
│              Port: 3334                 │
└───────────────┬─────────────────────────┘
                │ PostgreSQL Client
┌───────────────┴─────────────────────────┐
│         PostgreSQL Database             │
│              Port: 5432                 │
└─────────────────────────────────────────┘
```

## ✅ Checklist Completo

- [ ] Docker e Docker Compose instalados
- [ ] Arquivo `.env` criado e preenchido
- [ ] Executar `docker-compose up -d`
- [ ] Aguardar containers iniciarem (30-60s)
- [ ] Executar migrações do banco
- [ ] Acessar http://localhost:5173
- [ ] Criar conta de usuário
- [ ] Testar chat
- [ ] Vincular Telegram (opcional)

## 🎉 Pronto!

Sua aplicação está rodando completamente em Docker! 🚀
