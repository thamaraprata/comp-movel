import axios from "axios";

import type {
  Alert,
  DashboardSnapshot,
  SensorThreshold,
  AITip
} from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3334/api",
  timeout: 30_000 // Aumentado de 10s para 30s
});

// Request interceptor: Adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Refresh automático
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const { refreshAccessToken } = await import("./authApi");
          const newAccessToken = await refreshAccessToken(refreshToken);
          localStorage.setItem("accessToken", newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Logout
          localStorage.clear();
          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error);
  }
);

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

