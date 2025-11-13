# Frontend – Dashboard de Monitoramento

Aplicação React + TypeScript criada com Vite para exibir em tempo real dados de sensores ambientais, alertas e configurações.

## Pré-requisitos

- Node.js >= 20
- pnpm, npm ou yarn

```bash
pnpm install
pnpm run dev
```

Variáveis de ambiente (`.env`):

```
VITE_API_URL=http://localhost:3333/api
VITE_WS_URL=http://localhost:3333/ws
```

## Scripts

- `pnpm run dev` – modo desenvolvimento
- `pnpm run build` – build de produção
- `pnpm run preview` – pré-visualização do build
- `pnpm run lint` – lint de código
- `pnpm run test` – testes unitários (Vitest)

## Estrutura

- `src/pages` – páginas `Login` e `Dashboard`
- `src/components` – cards, gráficos, layout e formulários
- `src/stores` – estado global (Zustand)
- `src/hooks` – hooks customizados (`useRealtime`, `useTheme`)
- `src/services` – clientes da API REST e WebSocket
- `src/types` – tipagens compartilhadas

## Futuro

- Testes E2E (Playwright)
- Internacionalização
- Integração de mapas (Leaflet/Mapbox) para localização dos sensores

