import pino from "pino";

import { ENV } from "./env";

export const logger = pino({
  name: "monitoramento-backend",
  level: ENV.isDevelopment ? "debug" : "info",
  transport: ENV.isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard"
        }
      }
    : undefined
});

