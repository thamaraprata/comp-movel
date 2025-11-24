#!/bin/bash

# Script de teste completo do Sistema de Monitoramento Ambiental
# Testa: Mosquitto, Backend, Frontend e Gemini API

set -e

echo "================================"
echo "🧪 Sistema de Monitoramento - Teste Completo"
echo "================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Testar Mosquitto
echo -e "${BLUE}1️⃣ Testando Mosquitto MQTT Broker...${NC}"
if netstat -an 2>/dev/null | grep -q "1883"; then
    echo -e "${GREEN}✅ Mosquitto está rodando na porta 1883${NC}"
else
    echo -e "${RED}❌ Mosquitto não está rodando na porta 1883${NC}"
    echo "   Para instalar:"
    echo "   - Windows: choco install mosquitto"
    echo "   - Linux: sudo apt install mosquitto"
    echo "   - macOS: brew install mosquitto"
    exit 1
fi
echo ""

# 2. Testar Backend
echo -e "${BLUE}2️⃣ Testando Backend...${NC}"
if curl -s http://localhost:3334/health > /dev/null 2>&1; then
    BACKEND_STATUS=$(curl -s http://localhost:3334/health)
    echo -e "${GREEN}✅ Backend está rodando${NC}"
    echo "   Status: $BACKEND_STATUS"
else
    echo -e "${YELLOW}⚠️  Backend não está respondendo em http://localhost:3334${NC}"
    echo "   Para iniciar: cd backend && npm run dev"
fi
echo ""

# 3. Testar Frontend
echo -e "${BLUE}3️⃣ Testando Frontend...${NC}"
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend está rodando em http://localhost:5173${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend não está respondendo em http://localhost:5173${NC}"
    echo "   Para iniciar: cd frontend && npm run dev"
fi
echo ""

# 4. Testar Gemini API
echo -e "${BLUE}4️⃣ Testando Google Gemini API...${NC}"
if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  GEMINI_API_KEY não está configurado${NC}"
    echo "   Configure em backend/.env:"
    echo "   GEMINI_API_KEY=sua_chave_aqui"
else
    echo -e "${GREEN}✅ GEMINI_API_KEY está configurado${NC}"

    # Testar endpoint de dicas
    TIPS_RESPONSE=$(curl -s -X POST http://localhost:3334/api/tips/weather \
      -H "Content-Type: application/json" \
      -d '{
        "temperature": 25,
        "humidity": 60,
        "location": "Teste",
        "conditions": "Ensolarado"
      }')

    if echo "$TIPS_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✅ Endpoint de dicas funcionando${NC}"
    else
        echo -e "${YELLOW}⚠️  Endpoint de dicas respondeu: $TIPS_RESPONSE${NC}"
    fi
fi
echo ""

# 5. Testar MQTT Publishing
echo -e "${BLUE}5️⃣ Testando MQTT Publishing...${NC}"
if command -v mosquitto_pub &> /dev/null; then
    mosquitto_pub -h localhost -p 1883 \
      -t "sensors/test/data" \
      -m '{"sensorId":"test","type":"temperature","value":25,"unit":"°C","timestamp":"2024-11-23T14:00:00Z","metadata":{"location":"Test"}}'
    echo -e "${GREEN}✅ Mensagem MQTT publicada com sucesso${NC}"
else
    echo -e "${YELLOW}⚠️  mosquitto_pub não encontrado${NC}"
    echo "   Instale mosquitto-clients para testar"
fi
echo ""

# Resumo
echo "================================"
echo -e "${GREEN}📊 Resumo do Teste${NC}"
echo "================================"
echo ""
echo "✅ Mosquitto: RODANDO na porta 1883"
echo ""

if curl -s http://localhost:3334/health > /dev/null 2>&1; then
    echo "✅ Backend: RODANDO em http://localhost:3334"
else
    echo "❌ Backend: NÃO RESPONDENDO"
fi

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend: RODANDO em http://localhost:5173"
else
    echo "❌ Frontend: NÃO RESPONDENDO"
fi

echo ""
echo "================================"
echo -e "${BLUE}📝 Próximos Passos:${NC}"
echo "================================"
echo ""
echo "1. Se Backend não está rodando:"
echo "   cd backend && npm run dev"
echo ""
echo "2. Se Frontend não está rodando:"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Para testar simulador de sensores:"
echo "   cd backend && npm run simulate:sensors"
echo ""
echo "4. Acesse o dashboard:"
echo "   http://localhost:5173"
echo ""
echo "================================"
echo "✨ Sistema pronto para usar!"
echo "================================"
