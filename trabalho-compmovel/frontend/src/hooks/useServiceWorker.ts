import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    // Registrar Service Worker apenas em produção ou localhost
    if ("serviceWorker" in navigator) {
      const isDevelopment = import.meta.env.DEV;
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

      if (!isDevelopment || isLocalhost) {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("Service Worker registrado com sucesso:", registration);

            // Verificar por atualizações a cada hora
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000);
          })
          .catch((error) => {
            console.error("Erro ao registrar Service Worker:", error);
          });

        // Ouvir mensagens de atualizações
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          console.log("Service Worker foi atualizado");
          // Exibir notificação ao usuário
          if (Notification.permission === "granted") {
            new Notification("Aplicação Atualizada", {
              body: "A aplicação foi atualizada. Recarregue para ver as mudanças.",
              icon: "/icon.png"
            });
          }
        });
      }
    }

    // Solicitar permissão para notificações
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);
}
