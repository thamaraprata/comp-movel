import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    // O vite-plugin-pwa registra automaticamente o service worker
    console.log("PWA configurado via vite-plugin-pwa");
    
    // Solicitar permissão para notificações
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("Permissão de notificação:", permission);
      });
    }

    // Ouvir mensagens de atualizações
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("Service Worker foi atualizado");
        // Exibir notificação ao usuário se permitido
        if (Notification.permission === "granted") {
          new Notification("Aplicação Atualizada", {
            body: "A aplicação foi atualizada. Recarregue para ver as mudanças."
          });
        }
      });
    }
  }, []);
}
