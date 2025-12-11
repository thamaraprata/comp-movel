import { useEffect, useState } from "react";

import { useRealtime } from "../hooks/useRealtime";
import { useDashboardStore } from "../stores/dashboardStore";
import { useChatStore } from "../stores/chatStore";
import { acknowledgeAlert, fetchDashboardSnapshot, updateThreshold } from "../services/api";
import { AlertList } from "../components/AlertList";
import { DashboardLayout } from "../components/DashboardLayout";
import { RealtimeChart } from "../components/RealtimeChart";
import { ThresholdForm } from "../components/ThresholdForm";
import { WeatherCard } from "../components/WeatherCard";
import { ChatInterface } from "../components/ChatInterface";
import { TelegramLink } from "../components/TelegramLink";
import { generateWeatherTips } from "../services/api";
import type { AITip } from "../types";
import { Lightbulb } from "lucide-react";

interface DashboardProps {
  userName: string;
  onLogout: () => void;
}

export function Dashboard({ userName, onLogout }: DashboardProps) {
  const {
    alerts,
    thresholds,
    history,
    loading,
    setSnapshot,
    acknowledgeAlert: acknowledgeStoreAlert,
    setLoading
  } = useDashboardStore((state) => ({
      alerts: state.alerts,
      thresholds: state.thresholds,
      history: state.history,
      loading: state.loading,
      setSnapshot: state.setSnapshot,
      acknowledgeAlert: state.acknowledgeAlert,
      setLoading: state.setLoading
    }));

  const [tips, setTips] = useState<AITip[]>([]);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState<string>("São Paulo");
  const [loadingTips, setLoadingTips] = useState(false);

  const { setSelectedCity: setChatCity } = useChatStore();

  useRealtime();

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoading(true);
        const snapshot = await fetchDashboardSnapshot();
        setSnapshot(snapshot);
      } catch (error) {
        console.error("Erro ao carregar snapshot inicial", error);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [setSnapshot, setLoading]);

  // Função para carregar dicas
  const loadWeatherTips = async (city: string) => {
    try {
      setLoadingTips(true);
      console.log(`[Dashboard] Carregando dicas para ${city}`);

      // Buscar dados do clima do endpoint
      const params = new URLSearchParams({ city });
      const response = await fetch(`/api/weather?${params}`);
      if (!response.ok) {
        console.error(`[Dashboard] Erro ao buscar clima: ${response.status}`);
        return;
      }

      const result = await response.json();
      const weather = result.data;

      if (!weather?.data) {
        console.error("[Dashboard] Dados de clima inválidos:", weather);
        return;
      }

      setWeatherData(weather);

      console.log(`[Dashboard] Gerando dicas para ${weather.city} - ${weather.data.temperature}°C`);

      // Gerar dicas baseadas no clima
      const weatherTips = await generateWeatherTips({
        temperature: weather.data.temperature,
        humidity: weather.data.humidity,
        location: weather.city,
        conditions: weather.data.conditions
      });

      console.log(`[Dashboard] ${weatherTips.length} dicas recebidas:`, weatherTips.map(t => t.title));
      setTips(weatherTips);
    } catch (error) {
      console.error("[Dashboard] Erro ao carregar dicas:", error);
    } finally {
      setLoadingTips(false);
    }
  };

  // Callback quando a cidade muda no WeatherCard
  const handleCityChange = (city: string) => {
    console.log(`[Dashboard] Cidade mudou para: ${city}`);
    setSelectedCity(city);
    setChatCity(city);
  };

  // Carregar dicas quando a cidade mudar
  useEffect(() => {
    loadWeatherTips(selectedCity);

    // Atualizar a cada 5 minutos
    const interval = setInterval(() => loadWeatherTips(selectedCity), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedCity]);

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert(id);
      acknowledgeStoreAlert(id);
    } catch (error) {
      console.error("Erro ao reconhecer alerta", error);
    }
  };

  const handleSaveThreshold = async (threshold: (typeof thresholds)[number]) => {
    const updated = await updateThreshold(threshold);
    useDashboardStore.getState().updateThreshold(updated);
  };

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
    <DashboardLayout userName={userName} onLogout={onLogout}>
      {loading ? (
        <div className="card p-6 text-center text-sm text-slate-500">Carregando dados...</div>
      ) : null}

      {/* Card de Clima Bonito */}
      <section>
        <WeatherCard onCityChange={handleCityChange} />
      </section>

      {/* Dicas Personalizadas em Cards */}
      {loadingTips ? (
        <section className="mt-6">
          <div className="card p-6 text-center">
            <div className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500"></div>
              Gerando dicas personalizadas para {selectedCity}...
            </div>
          </div>
        </section>
      ) : tips.length > 0 ? (
        <section className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Dicas para {selectedCity}</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
      ) : null}

      {/* Grid Responsivo - Histórico e Limites */}
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2 space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg font-semibold">Histórico recente</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Último update: {new Date().toLocaleTimeString("pt-BR")}
            </span>
          </div>
          <div className="w-full overflow-hidden">
            <RealtimeChart series={history.slice(0, 3)} />
          </div>
        </div>
        <div className="space-y-4 min-w-0">
          <h2 className="text-lg font-semibold">Limites de alerta</h2>
          <div className="card p-4">
            <ThresholdForm thresholds={thresholds} onSave={handleSaveThreshold} />
          </div>
        </div>
      </section>

      {/* Alertas Recentes */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Alertas recentes</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {alerts.length} alertas
          </span>
        </div>
        <AlertList alerts={alerts.slice(0, 10)} onAcknowledge={handleAcknowledge} />
      </section>

      {/* Chat e Vinculação Telegram */}
      <section className="mt-6 grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 h-[600px]">
          <ChatInterface />
        </div>
        <div className="h-fit">
          <TelegramLink />
        </div>
      </section>
    </DashboardLayout>
  );
}

