import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { ENV } from "./config/env";
import { routes } from "./routes";

export function createApp() {
  const app = express();

  app.use(cors({ origin: ENV.CORS_ORIGIN }));
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  if (ENV.isDevelopment) {
    app.use(morgan("dev"));
  }

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.use("/api", routes);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  });

  return app;
}

