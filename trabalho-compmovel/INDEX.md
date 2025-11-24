# 🌤️ Sistema de Monitoramento de Clima - Índice

## ⚡ Quick Start

```bash
# 1️⃣ Iniciar containers
docker-compose up -d

# 2️⃣ Importar Node-RED Flow
# Acesse: http://localhost:1880
# Menu (3 barras) > Manage Palletes > Install (node-red-contrib-influxdb)
# Menu (3 barras) > Import > select a file to import
# Selecione: nodered-weather-flow.json
# Configure as chaves da API do InfluxDB e OpenWeather
# Clique: Deploy

# 3️⃣ Acessar aplicação
# Frontend: http://localhost:5173
# Backend: http://localhost:3334
# Node-RED: http://localhost:1880
# InfluxDB: http://localhost:8086
```

---

## 📁 Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| `docker-compose.yml` | Orquestração de containers (InfluxDB, Node-RED, Backend, Frontend) |
| `nodered-weather-flow.json` | **Flow pronto para importar no Node-RED** |
| `backend/Dockerfile` | Build do backend |
| `backend/.env` | Variáveis de ambiente |
| `README.md` | Descrição do projeto |

---

## 🔄 Fluxo de Dados

```
OpenWeather API (free tier)
    ↓ (cada 60 segundos)
Node-RED (coleta 27 capitais brasileiras)
    ↓
InfluxDB (armazena série temporal)
    ↓
Backend (Express.js)
    ├─ GET /api/weather?city=São Paulo
    ├─ GET /api/weather/history?city=São Paulo&range=-7d
    └─ GET /api/weather/stats?city=São Paulo&range=-24h
        ↓
Frontend (React)
    └─ Gráficos + Estatísticas
```

---

## 📊 Cidades Monitoradas (27 Capitais)

Nordeste: Salvador, Fortaleza, Recife, Maceió, Teresina, São Luís, Natal, João Pessoa, Aracaju
Centro-Oeste: Brasília, Goiânia, Cuiabá, Campo Grande
Norte: Manaus, Belém, Boa Vista, Macapá, Palmas, Porto Velho, Rio Branco
Sudeste: São Paulo, Rio de Janeiro, Belo Horizonte, Vitória
Sul: Curitiba, Porto Alegre, Florianópolis

---

## 🛠️ Endpoints API

```bash
# Clima atual
GET /api/weather?city=São Paulo

# Lista de todas as cidades
GET /api/weather/cities

# Histórico (últimos 7 dias)
GET /api/weather/history?city=São Paulo&range=-7d

# Estatísticas (últimas 24h)
GET /api/weather/stats?city=São Paulo&range=-24h

# Dicas de clima
GET /api/weather/tips?city=São Paulo

# Descrição do clima
GET /api/weather/description?city=São Paulo
```

---

## 🚀 Próximas Etapas

1. **Importar flow no Node-RED**
   - Abra http://localhost:1880
   - Menu > Import > Selecione nodered-weather-flow.json
   - Clique Deploy

2. **Aguardar 60-90 segundos**
   - Node-RED executa coleta a cada minuto
   - Dados são salvos no InfluxDB

3. **Verificar dados**
   - Abra http://localhost:5173 (Frontend)
   - Selecione uma cidade
   - Veja histórico e estatísticas

---

## 🔍 Troubleshooting

**Problema:** Node-RED não mostra dados no Debug
**Solução:** Configure o InfluxDB node manualmente
- Clique 2x no node "Salvar no InfluxDB"
- Clique no ícone de lápis ao lado de "influxdb"
- Preencha: URL, Token, Organization, Bucket
- Salve e Deploy

**Problema:** Container não sobe
**Solução:** Verifique logs
```bash
docker-compose logs <service>
# Ex: docker-compose logs influxdb
```

---

**Status:** ✅ Pronto para usar
**Última atualização:** 2025-11-23
