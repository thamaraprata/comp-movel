import { useEffect, useState } from "react";
import { generateWeatherTips } from "../services/api";
import type { AITip, SensorSummary } from "../types";
import { AlertCircle, Lightbulb, Loader2 } from "lucide-react";

interface WeatherTipsProps {
  sensors: SensorSummary[];
  location?: string;
}

export function WeatherTips({ sensors, location = "Sua localização" }: WeatherTipsProps) {
  const [tips, setTips] = useState<AITip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTips() {
      try {
        setLoading(true);
        setError(null);

        const tempSensor = sensors.find(s => s.sensorType === "temperature");
        const humiditySensor = sensors.find(s => s.sensorType === "humidity");

        if (!tempSensor || !humiditySensor) {
          setTips([]);
          return;
        }

        const context = {
          temperature: tempSensor.value,
          humidity: humiditySensor.value,
          location,
          conditions: "Monitorado por sensores inteligentes"
        };

        const generatedTips = await generateWeatherTips(context);
        setTips(generatedTips);
      } catch (err: any) {
        console.error("Erro ao gerar dicas:", err);

        // Verificar tipo de erro
        if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
          setError("Requisição expirou. Backend pode estar lento.");
        } else if (err.response?.status === 429) {
          setError("Limite de requisições atingido. Tentando novamente em 1 minuto...");
        } else {
          setError("Não foi possível gerar dicas no momento");
        }
      } finally {
        setLoading(false);
      }
    }

    // Carregar dicas apenas uma vez ao montar o componente
    loadTips();

    // Depois, fazer requisição a cada minuto (60 segundos)
    const interval = setInterval(loadTips, 60000);

    return () => clearInterval(interval);
  }, [location]);

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          Gerando dicas personalizadas...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-orange-800 dark:text-orange-200">{error}</div>
        </div>
      </div>
    );
  }

  if (!tips.length) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-500 bg-red-50 dark:bg-red-950";
      case "medium":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950";
      default:
        return "border-blue-500 bg-blue-50 dark:bg-blue-950";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-200";
      default:
        return "bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-200";
    }
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-semibold">Dicas Personalizadas</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tips.map((tip, index) => (
          <div
            key={index}
            className={`card border-l-4 p-4 ${getPriorityColor(tip.priority)}`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-start gap-2 flex-1">
                <span className="text-2xl">{tip.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {tip.title}
                  </h3>
              </div>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${getPriorityBadgeColor(
                  tip.priority
                )}`}
              >
                {tip.priority === "high" ? "Importante" : tip.priority === "medium" ? "Moderado" : "Baixo"}
              </span>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
              {tip.description}
            </p>

            {tip.actions.length > 0 && (
              <ul className="space-y-2">
                {tip.actions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-xs mt-1">✓</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
