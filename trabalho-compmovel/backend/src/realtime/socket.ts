import type { Server as HttpServer } from "node:http";

import { Server } from "socket.io";

import { SOCKET_EVENTS } from "../config/constants";
import { ENV } from "../config/env";
import { logger } from "../config/logger";
import { getSensorSnapshot } from "../services/dashboardService";
import { listAlerts } from "../services/alertService";

let io: Server | null = null;

export function initSocketServer(server: HttpServer) {
  io = new Server(server, {
    path: "/ws",
    cors: {
      origin: ENV.CORS_ORIGIN
    }
  });

  io.on("connection", (socket) => {
    logger.debug({ id: socket.id }, "Cliente WebSocket conectado");

    socket.on(SOCKET_EVENTS.DASHBOARD_SUBSCRIBE, () => {
      const alerts = listAlerts().slice(0, 5);
      socket.emit("alert:init", alerts);
    });

    socket.on("disconnect", () => {
      logger.debug({ id: socket.id }, "Cliente WebSocket desconectado");
    });
  });

  return io;
}

export function broadcastSensorUpdate(sensorId: string) {
  if (!io) return;
  const snapshot = getSensorSnapshot(sensorId);
  if (!snapshot.summary || !snapshot.history) {
    return;
  }
  io.emit(SOCKET_EVENTS.SENSOR_UPDATE, snapshot.summary, snapshot.history);
}

export function broadcastAlert(alert: unknown) {
  if (!io) return;
  io.emit(SOCKET_EVENTS.ALERT_NEW, alert);
}

