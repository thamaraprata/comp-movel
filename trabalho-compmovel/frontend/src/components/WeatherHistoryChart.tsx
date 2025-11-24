import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  getWeatherHistoryFromInfluxDB,
  getWeatherStatsFromInfluxDB,
  type WeatherDataPoint,
  type WeatherStats
} from "../services/weatherHistoryApi";

interface WeatherHistoryChartProps {
  city: string;
  range?: string;
}

export function WeatherHistoryChart({ city, range = "-7d" }: WeatherHistoryChartProps) {
  const [history, setHistory] = useState<WeatherDataPoint[]>([]);
  const [stats, setStats] = useState<WeatherStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [historyData, statsData] = await Promise.all([
          getWeatherHistoryFromInfluxDB(city, range),
          getWeatherStatsFromInfluxDB(city, range.startsWith("-") ? "-24h" : range)
        ]);

        setHistory(historyData);
        setStats(statsData);
      } catch (err) {
        console.error("Erro ao carregar histórico:", err);
        setError("Erro ao carregar histórico de clima");
      } finally {
        setLoading(false);
      }
    };

    if (city) {
      loadData();
    }
  }, [city, range]);

  if (loading) {
    return (
      <div className="card p-6 text-center text-sm text-slate-500">
        Carregando histórico...
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-950 text-sm text-red-800 dark:text-red-200">
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-slate-500">
        Nenhum dado de histórico disponível ainda. Os dados começarão a ser coletados em breve.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Máxima</div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {stats.maxTemperature}°C
            </div>
          </div>

          <div className="card p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Mínima</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {stats.minTemperature}°C
            </div>
          </div>

          <div className="card p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Média</div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {stats.avgTemperature}°C
            </div>
          </div>

          <div className="card p-4 bg-gradient-to-br from-teal-50 to-green-50 dark:from-teal-950 dark:to-green-950">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Umidade média</div>
            <div className="text-xl font-bold text-teal-600 dark:text-teal-400">
              {stats.avgHumidity}%
            </div>
          </div>
        </div>
      )}

      {/* Tabela de histórico */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300 font-semibold">
                  Horário
                </th>
                <th className="px-4 py-3 text-center text-slate-700 dark:text-slate-300 font-semibold">
                  Temperatura
                </th>
                <th className="px-4 py-3 text-center text-slate-700 dark:text-slate-300 font-semibold">
                  Sensação
                </th>
                <th className="px-4 py-3 text-center text-slate-700 dark:text-slate-300 font-semibold">
                  Umidade
                </th>
                <th className="px-4 py-3 text-center text-slate-700 dark:text-slate-300 font-semibold">
                  Vento
                </th>
                <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300 font-semibold">
                  Condições
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {history.slice(0, 24).map((item, idx) => {
                const date = new Date(item.timestamp);
                const tempTrend =
                  idx > 0 && history[idx - 1]
                    ? item.temperature - history[idx - 1].temperature
                    : 0;

                return (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {date.toLocaleTimeString("pt-BR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-slate-100">
                      {item.temperature}°C
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                      {item.feelsLike}°C
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                      {item.humidity}%
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                      {item.windSpeed.toFixed(1)} km/h
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 capitalize">
                      {item.conditions}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
        Mostrando os últimos 24 registros de {history.length} total coletados
      </div>
    </div>
  );
}
