// Service Worker para PWA
// Oferece funcionalidade offline e sincronização de dados

const CACHE_NAME = "weather-app-v1";
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json"
];

// Instalar Service Worker
self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  (self as ServiceWorkerGlobalScope).skipWaiting();
});

// Ativar Service Worker
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  (self as ServiceWorkerGlobalScope).clients.claim();
});

// Estratégia: Network First, Cache Fallback
self.addEventListener("fetch", (event: FetchEvent) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Para APIs, usar network first com cache fallback
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if fetch fails
          return caches.match(event.request);
        })
    );
  } else {
    // Para outros arquivos, usar cache first com network fallback
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// Background Sync para sincronizar dados quando volta online
self.addEventListener("sync", (event: any) => {
  if (event.tag === "sync-weather") {
    event.waitUntil(syncWeatherData());
  }
});

async function syncWeatherData() {
  try {
    // Sincronizar dados climáticos
    const response = await fetch("/api/weather");
    if (response.ok) {
      const data = await response.json();
      // Armazenar no IndexedDB ou localStorage
      localStorage.setItem("last-weather-sync", JSON.stringify(data));
    }
  } catch (error) {
    console.error("Erro ao sincronizar dados de clima:", error);
  }
}

// Push Notifications para alertas
self.addEventListener("push", (event: PushEvent) => {
  let notificationData = {
    title: "Alerta de Clima",
    body: "Verifique as condições climáticas",
    icon: "/icon.png"
  };

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    (self as ServiceWorkerGlobalScope).registration.showNotification(
      notificationData.title,
      {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: "/badge.png",
        tag: "weather-alert"
      }
    )
  );
});

// Manipular cliques em notificações
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    (self as ServiceWorkerGlobalScope).clients.matchAll({ type: "window" }).then((clientList) => {
      // Procurar janela aberta
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === "/" && "focus" in client) {
          return (client as WindowClient).focus();
        }
      }
      // Se não houver janela aberta, abrir uma nova
      if ((self as ServiceWorkerGlobalScope).clients.openWindow) {
        return (self as ServiceWorkerGlobalScope).clients.openWindow("/");
      }
    })
  );
});
