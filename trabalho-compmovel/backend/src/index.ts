import { createServer } from "node:http";

import { createApp } from "./app";
import { ENV } from "./config/env";
import { logger } from "./config/logger";
import { migrate } from "./database/migrate";
import { initSocketServer } from "./realtime/socket";
import { initGemini } from "./integrations/gemini.js";
import { initWeatherScheduler } from "./services/weatherScheduler";
import { initTelegramBot } from "./integrations/telegram.js";
import { testConnection } from "./database/postgres.js";

async function bootstrap() {
  await migrate();

  // Testar conexão PostgreSQL
  const pgConnected = await testConnection();
  if (!pgConnected) {
    logger.warn("PostgreSQL não está disponível - histórico será apenas em memória");
  }

  const app = createApp();
  const server = createServer(app);
  initSocketServer(server);
  initGemini();
  initWeatherScheduler();
  initTelegramBot();

  server.listen(ENV.PORT, () => {
    logger.info({ port: ENV.PORT }, "Servidor iniciado");
  });
}

bootstrap().catch((error) => {
  logger.error(error, "Erro ao iniciar aplicação");
  process.exit(1);
});

