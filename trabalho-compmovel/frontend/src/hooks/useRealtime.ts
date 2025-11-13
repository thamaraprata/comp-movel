import { useEffect } from "react";

import { useDashboardStore } from "../stores/dashboardStore";
import { connectRealtime, disconnectRealtime } from "../services/socket";

export function useRealtime() {
  const addRealtimeReading = useDashboardStore((state) => state.addRealtimeReading);
  const addAlert = useDashboardStore((state) => state.addAlert);

  useEffect(() => {
    const socket = connectRealtime((event) => {
      switch (event.type) {
        case "sensor:update":
          addRealtimeReading(event.payload.summary, event.payload.history);
          break;
        case "alert:new":
          addAlert(event.payload);
          break;
        case "heartbeat":
        default:
          break;
      }
    });

    socket.emit("dashboard:subscribe");

    return () => {
      socket.off("sensor:update");
      socket.off("alert:new");
      disconnectRealtime();
    };
  }, [addAlert, addRealtimeReading]);
}

