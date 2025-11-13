# Sistema de Monitoramento Ambiental (Comp Móvel e Ubíqua)

Este repositório contém o projeto completo de um sistema de monitoramento ambiental desenvolvido para a disciplina de Computação Móvel e Ubíqua. O sistema é composto por três camadas principais — **Dashboard Web**, **API & Processamento**, e **Comunicação via MQTT** — para coletar, armazenar e visualizar dados de sensores ambientais em tempo real.

## Visão Geral

- `frontend/`: aplicação React + TypeScript (Vite) com Tailwind CSS e Chart.js para visualização e configuração.
- `backend/`: servidor Node.js (Express) com SQLite, WebSocket, cliente MQTT e lógica de alertas.
- `docs/`: documentação de arquitetura, fluxo de dados, guias de deploy e integrações futuras.

### Fluxo de Dados

1. Sensores publicam leituras em tópicos MQTT específicos (`sensors/+/data`).
2. O **broker MQTT** encaminha as mensagens para o cliente MQTT do backend (`backend/src/mqtt`).
3. O backend processa os dados, persiste no SQLite (dados históricos), avalia alertas e notifica:
   - via WebSocket (dashboard em tempo real);
   - via webhook/Telegram (futuro).
4. A API REST fornece dados históricos e configurações.
5. O frontend consome a API e o WebSocket para exibir dashboards, gráficos e alertas.

## Como iniciar

Consulte:

- `frontend/README.md` – setup do dashboard Vite/React.
- `backend/README.md` – setup do servidor Node.js/Express com MQTT e WebSocket.
- `docs/arquitetura.md` – visão detalhada da arquitetura, tópicos MQTT, modelos de dados e plano de deploy (Vercel/Railway).

> **Estado atual:** estrutura inicial criada. Próximos passos incluem configurar as bases dos projetos frontend e backend, integrar MQTT/WebSocket e documentar o fluxo de deploy.


