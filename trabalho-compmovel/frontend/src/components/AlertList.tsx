import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

import type { Alert } from "../types";
import { formatTimestamp } from "../utils/format";

const SEVERITY_COLOR: Record<Alert["severity"], string> = {
  low: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-900/20",
  medium: "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-900/20",
  high: "border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-900/20"
};

interface AlertListProps {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
}

export function AlertList({ alerts, onAcknowledge }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Nenhum alerta ativo.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`card border-l-4 ${SEVERITY_COLOR[alert.severity]} p-4`}
        >
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 shrink-0 text-amber-500" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Sensor {alert.sensorId} ({alert.sensorType})
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {alert.message}
                  </p>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatTimestamp(alert.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                    alert.acknowledged
                      ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      : "bg-rose-500 text-white"
                  }`}
                >
                  {alert.acknowledged ? "Reconhecido" : "Novo"}
                </span>
                {!alert.acknowledged && (
                  <button
                    type="button"
                    onClick={() => onAcknowledge(alert.id)}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-500"
                  >
                    Marcar como visto
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

