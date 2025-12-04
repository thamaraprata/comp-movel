# 📝 Changelog - Refatoração para Computação Móvel & Ubíqua

## Versão Atual - Dezembro 2024

### ✂️ Removido
- **MQTT Broker (Mosquitto)**: Não mais necessário, substituído por OpenWeather API
- **InfluxDB**: Substituído por cache em memória + histórico local (últimas 24h)
- **Node-RED**: Orquestração removida, lógica implementada em scheduler
- **Arquivos de teste**:
  - `test-nodered-complete.js`
  - `test-nodered-orchestration.js`
  - `test-nodered-with-token.js`
  - `setup-influxdb*.js`
  - `setup-influxdb-auto.sh`
  - `nodered-weather-flow.json`

### ✨ Adicionado

#### Backend
- **`src/services/weatherScheduler.ts`**: Job scheduler que atualiza dados climáticos a cada 5 minutos
- **`src/integrations/telegram.ts`**: Bot Telegram completo com 6 comandos (`/clima`, `/dicas`, `/historico`, `/stats`, `/cidade`, `/ajuda`)
- **`src/integrations/gemini.ts`**: Função `getGeminiTips()` para gerar dicas em texto simples
- **Dependências adicionadas**:
  - `node-cron` (^3.0.3) - Job scheduler
  - `telegraf` (^4.16.0) - Bot Telegram

#### Frontend
- **`src/components/WeatherCard.tsx`**: Novo componente responsivo para exibir dados climáticos
  - Grid adaptativo (2 colunas em mobile, 4 em desktop)
  - Countdown para próxima atualização (5 min)
  - Exibição automática de dicas
  - Ícones inteligentes por condição climática

- **`src/hooks/useSocket.ts`**: Hook para gerenciar conexão WebSocket global

- **`src/hooks/useServiceWorker.ts`**: Hook para registrar Service Worker com suporte a PWA

- **`src/providers/pwa-provider.tsx`**: Provider para inicializar PWA

- **`src/serviceWorker.ts`**: Service Worker completo com:
  - Cache para funcionamento offline
  - Network-first para APIs
  - Background sync para sincronização
  - Push notifications para alertas

- **`public/manifest.json`**: Manifest PWA com:
  - Ícones em SVG
  - Atalhos rápidos
  - Screenshots
  - Configuração de tema

- **Atualizações**:
  - `index.html`: Meta tags para PWA, viewport responsivo
  - `main.tsx`: Integração do PWAProvider
  - `pages/Dashboard.tsx`: Adição do WeatherCard

### 🔄 Alterado

#### Backend
- **`package.json`**: Removidas dependências MQTT e InfluxDB, adicionadas `node-cron` e `telegraf`
- **`src/index.ts`**: Inicialização de `initWeatherScheduler()` e `initTelegramBot()`
- **`src/realtime/socket.ts`**: Exportação de `io` para uso em outros módulos
- **`src/routes/modules/weather.ts`**:
  - Endpoints refatorados para usar scheduler local
  - Removidas dependências de InfluxDB
  - Novo endpoint `POST /api/weather/refresh`
  - Stats calculadas em memória
- **`docker-compose.yml`**: Removidos serviços influxdb e nodered, mantidos backend e frontend

#### Frontend
- **`index.html`**: Meta tags de PWA adicionadas
- Importações de novos componentes e hooks

### 📊 Arquitetura Anterior vs. Atual

**Anterior:**
```
IoT Sensors (MQTT)
     ↓
Mosquitto Broker
     ↓
Node-RED (orquestração)
     ↓
Backend + InfluxDB
     ↓
Frontend
```

**Atual:**
```
OpenWeather API
     ↓
Backend (node-cron scheduler 5 min)
  ├── Memória (cache)
  ├── SQLite (histórico 24h)
  └── Gemini + Telegram
     ↓
Frontend (React + PWA)
  ├── Service Worker
  ├── LocalStorage
  └── WebSocket (tempo real)
```

### 🎯 Princípios de Computação Móvel & Ubíqua Implementados

#### 1. **Continuidade de Experiência**
- ✅ Sincronização de dados via WebSocket + LocalStorage
- ✅ Estado persistente entre sessões
- ✅ Possibilidade de usar no desktop e continuar no mobile

#### 2. **Responsividade**
- ✅ Grid layout adaptativo
- ✅ Mobile-first design
- ✅ Componentes dimensionados para qualquer tela
- ✅ Touchscreen-friendly (áreas > 44px)

#### 3. **Offline-First**
- ✅ Service Worker para cache
- ✅ PWA instalável
- ✅ Background sync
- ✅ Funciona sem internet

#### 4. **Escalabilidade**
- ✅ Múltiplos dispositivos simultâneos
- ✅ WebSocket para sincronização em tempo real
- ✅ Cache distribuído local

#### 5. **Acessibilidade Universal**
- ✅ Interface responsiva
- ✅ Suporte a tema claro/escuro
- ✅ Sem dependência de infraestrutura complexa

### 📈 Melhorias de Performance

- **Redução de dependências**: Removidos MQTT, InfluxDB, Node-RED
- **Scheduler otimizado**: 1 requisição a cada 5 min em vez de transmissão contínua
- **Cache em memória**: Histórico de 24h mantido em RAM (288 registros máx)
- **WebSocket eficiente**: Apenas eventos de atualização transmitidos

### 📱 Novos Recursos

1. **Dicas Inteligentes Automáticas**: Processadas a cada atualização climática
2. **Bot Telegram**: Consultar clima, dicas e histórico via chat
3. **PWA Completa**: Instalar como app, funcionar offline
4. **Sincronização Cross-Device**: Compartilhar dados entre dispositivos
5. **Contador de Atualização**: Usuário sabe quando próxima atualização ocorre

### 🔧 Configuração Necessária

1. **OpenWeather API** (obrigatório)
2. **Google Gemini API** (para dicas)
3. **Telegram Bot Token** (opcional)

### 📚 Documentação Atualizada

- ✅ README.md com nova arquitetura
- ✅ Stack tecnológico atualizado
- ✅ Guia de configuração
- ✅ Endpoints de API documentados
- ✅ Troubleshooting para PWA

### 🚀 Próximas Melhorias Opcionais

- [ ] Autenticação JWT
- [ ] Banco de dados para persistência de usuários
- [ ] Histórico persistente (banco de dados)
- [ ] Múltiplas cidades configuráveis por usuário
- [ ] Push notifications nativas
- [ ] Gráficos históricos
- [ ] Integração com mais fornecedores de clima

---

**Total de Mudanças:**
- Arquivos removidos: 9
- Arquivos criados: 7
- Arquivos modificados: 8
- Linhas de código adicionadas: ~2000
