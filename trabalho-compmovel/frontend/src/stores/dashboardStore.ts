import { create } from "zustand";

import type {
  Alert,
  DashboardSnapshot,
  HistoricalSeries,
  SensorSummary,
  SensorThreshold
} from "../types";

interface DashboardState {
  summaries: SensorSummary[];
  alerts: Alert[];
  thresholds: SensorThreshold[];
  history: HistoricalSeries[];
  loading: boolean;
  lastUpdated?: string;
  setSnapshot: (snapshot: DashboardSnapshot) => void;
  addRealtimeReading: (summary: SensorSummary, historyPoint: HistoricalSeries) => void;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (id: string) => void;
  setLoading: (value: boolean) => void;
  updateThreshold: (threshold: SensorThreshold) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summaries: [],
  alerts: [],
  thresholds: [],
  history: [],
  loading: true,
  setSnapshot: (snapshot) =>
    set({
      summaries: snapshot.summaries,
      alerts: snapshot.alerts,
      thresholds: snapshot.thresholds,
      history: snapshot.history,
      loading: false,
      lastUpdated: new Date().toISOString()
    }),
  addRealtimeReading: (summary, historySeries) =>
    set((state) => {
      const summaries = state.summaries.filter((item) => item.sensorId !== summary.sensorId);
      summaries.push(summary);

      const history = state.history.filter((item) => item.sensorId !== historySeries.sensorId);
      history.push(historySeries);

      return {
        summaries: summaries.sort((a, b) => a.sensorId.localeCompare(b.sensorId)),
        history,
        lastUpdated: summary.updatedAt
      };
    }),
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 20)
    })),
  acknowledgeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === id ? { ...alert, acknowledged: true } : alert
      )
    })),
  setLoading: (value) => set({ loading: value }),
  updateThreshold: (threshold) =>
    set((state) => {
      const thresholds = state.thresholds.filter(
        (item) => item.sensorType !== threshold.sensorType
      );
      thresholds.push(threshold);
      return {
        thresholds: thresholds.sort((a, b) => a.sensorType.localeCompare(b.sensorType))
      };
    })
}));

