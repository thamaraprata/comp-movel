import { useServiceWorker } from "../hooks/useServiceWorker";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useServiceWorker();

  return <>{children}</>;
}
