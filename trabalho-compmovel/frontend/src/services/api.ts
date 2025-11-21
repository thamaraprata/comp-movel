import axios from "axios";

import type {
  Alert,
  DashboardSnapshot,
  SensorThreshold,
  AITip
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

export async function generateWeatherTips(context: {
  temperature: number;
  humidity: number;
  location: string;
  conditions?: string;
}): Promise<AITip[]> {
  const { data } = await api.post<{ status: string; data: AITip[] }>(
    "/tips/weather",
    context
  );
  return data.data ?? [];
}

export async function generateAlertMessage(
  sensorId: string,
  value: number,
  threshold: number
): Promise<string> {
  const { data } = await api.post<{ status: string; data: { message: string } }>(
    "/tips/alert-message",
    { sensorId, value, threshold }
  );
  return data.data?.message ?? "Alerta de sensor";
}

export default api;

