import { useEffect } from "react";

import { useRealtime } from "../hooks/useRealtime";
import { useDashboardStore } from "../stores/dashboardStore";
import { acknowledgeAlert, fetchDashboardSnapshot, updateThreshold } from "../services/api";
import { AlertList } from "../components/AlertList";
import { DashboardLayout } from "../components/DashboardLayout";
import { RealtimeChart } from "../components/RealtimeChart";
import { ThresholdForm } from "../components/ThresholdForm";
import { CityWeatherSelector } from "../components/CityWeatherSelector";
import { WeatherCard } from "../components/WeatherCard";

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

  return (
    <DashboardLayout userName={userName} onLogout={onLogout}>
      {loading ? (
        <div className="card p-6 text-center text-sm text-slate-500">Carregando dados...</div>
      ) : null}

      {/* Seletor de Cidades com Clima Real */}
      <CityWeatherSelector />

      {/* Cartão de Clima Responsivo */}
      <section className="mt-6">
        <WeatherCard />
      </section>

      <section className="grid gap-6 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Histórico recente</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Último update: {new Date().toLocaleTimeString("pt-BR")}
            </span>
          </div>
          <RealtimeChart series={history.slice(0, 3)} />
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Limites de alerta</h2>
          <div className="card p-4">
            <ThresholdForm thresholds={thresholds} onSave={handleSaveThreshold} />
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Alertas recentes</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {alerts.length} alertas
          </span>
        </div>
        <AlertList alerts={alerts.slice(0, 10)} onAcknowledge={handleAcknowledge} />
      </section>
    </DashboardLayout>
  );
}

