import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";

import type { SensorSummary } from "../types";
import { formatNumber, formatTimestamp } from "../utils/format";

const STATUS_COLOR: Record<SensorSummary["status"], string> = {
  normal: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  critical: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
};

export function SensorCard({ summary }: { summary: SensorSummary }) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {summary.label}
          </p>
          <p className="text-2xl font-semibold">
            {formatNumber(summary.value, summary.unit)}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[summary.status]}`}>
          {summary.status === "normal" ? "Normal" : summary.status === "warning" ? "Atenção" : "Crítico"}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          {summary.trend === "up" ? (
            <ArrowTrendingUpIcon className="h-4 w-4 text-amber-500" />
          ) : summary.trend === "down" ? (
            <ArrowTrendingDownIcon className="h-4 w-4 text-emerald-500" />
          ) : null}
          <span>{summary.change > 0 ? `+${summary.change}%` : `${summary.change}%`}</span>
        </div>
        <span className="text-xs">Atualizado {formatTimestamp(summary.updatedAt)}</span>
      </div>
    </div>
  );
}

