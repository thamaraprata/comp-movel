import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

import type { HistoricalSeries } from "../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RealtimeChartProps {
  series: HistoricalSeries[];
}

export function RealtimeChart({ series }: RealtimeChartProps) {
  const hasData = series.some((item) => item.points.length > 0);

  if (!hasData) {
    return (
      <div className="card flex h-64 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Nenhum dado histórico disponível.
      </div>
    );
  }

  const referenceSeries = series.find((item) => item.points.length > 0) ?? series[0];

  const data = {
    labels: referenceSeries.points.map((point) =>
      new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(point.timestamp))
    ),
    datasets: series.map((item, index) => ({
      label: `${item.sensorType} (${item.unit})`,
      data: item.points.map((point) => point.value),
      fill: true,
      borderColor: COLORS[index % COLORS.length],
      backgroundColor: COLORS[index % COLORS.length] + "33",
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 0
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        labels: {
          boxWidth: 12,
          padding: 8,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 10
          }
        }
      },
      y: {
        ticks: {
          callback: (value: number | string) => `${value}`,
          font: {
            size: 10
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <div className="card p-3 sm:p-4 w-full overflow-hidden">
      <div className="h-64 sm:h-72 md:h-80 w-full">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

const COLORS = [
  "#2563eb",
  "#f97316",
  "#14b8a6",
  "#8b5cf6",
  "#ef4444",
  "#0ea5e9"
];

