import { createServer } from "node:http";

import { createApp } from "./app";
import { ENV } from "./config/env";
import { logger } from "./config/logger";
import { migrate } from "./database/migrate";
import { initSocketServer } from "./realtime/socket";
import { initMqttClient } from "./mqtt/client";

async function bootstrap() {
  await migrate();

  const app = createApp();
  const server = createServer(app);
  initSocketServer(server);
  initMqttClient();

  server.listen(ENV.PORT, () => {
    logger.info({ port: ENV.PORT }, "Servidor iniciado");
  });
}

bootstrap().catch((error) => {
  logger.error(error, "Erro ao iniciar aplicação");
  process.exit(1);
});

