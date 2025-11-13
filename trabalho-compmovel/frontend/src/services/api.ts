import axios from "axios";

import type {
  Alert,
  DashboardSnapshot,
  SensorThreshold
} from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3333/api",
  timeout: 10_000
});

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const { data } = await api.get<DashboardSnapshot>("/dashboard");
  return data;
}

export async function updateThreshold(threshold: SensorThreshold) {
  const { data } = await api.put<SensorThreshold>(
    `/thresholds/${threshold.sensorType}`,
    threshold
  );
  return data;
}

export async function acknowledgeAlert(id: string) {
  const { data } = await api.post<Alert>(`/alerts/${id}/acknowledge`);
  return data;
}

export default api;

