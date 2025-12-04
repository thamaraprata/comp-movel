import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

let globalSocket: Socket | undefined;

export function useSocket(): Socket | undefined {
  const [socket, setSocket] = useState<Socket | undefined>(undefined);

  useEffect(() => {
    if (!globalSocket) {
      globalSocket = io(import.meta.env.VITE_WS_URL ?? "http://localhost:3334", {
        path: "/ws",
        transports: ["websocket"]
      });
    }

    setSocket(globalSocket);

    return () => {
      // Não desconectar ao desmontar componente, pois pode ser usado em outros lugares
    };
  }, []);

  return socket;
}
