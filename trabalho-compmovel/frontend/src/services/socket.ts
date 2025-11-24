import { io, type Socket } from "socket.io-client";

import type { Alert, SensorSummary, HistoricalSeries } from "../types";

type RealtimeEvent =
  | { type: "sensor:update"; payload: { summary: SensorSummary; history: HistoricalSeries } }
  | { type: "alert:new"; payload: Alert }
  | { type: "heartbeat"; payload: { timestamp: string } };

export type RealtimeHandler = (event: RealtimeEvent) => void;

let socket: Socket | undefined;

export function connectRealtime(handler: RealtimeHandler): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_WS_URL ?? "http://localhost:3334", {
      path: "/ws",
      transports: ["websocket"]
    });
  }

  socket.on("connect", () => {
    handler({ type: "heartbeat", payload: { timestamp: new Date().toISOString() } });
  });

  socket.on("sensor:update", (summary: SensorSummary, history: HistoricalSeries) => {
    handler({ type: "sensor:update", payload: { summary, history } });
  });

  socket.on("alert:new", (alert: Alert) => {
    handler({ type: "alert:new", payload: alert });
  });

  return socket;
}

export function disconnectRealtime() {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
}

