import type { SOCKET_EVENTS } from "../config/constants";

export type SensorType = "temperature" | "humidity" | "airQuality" | "luminosity" | "pressure";

export interface SensorReadingPayload {
  sensorId: string;
  type: SensorType;
  value: number;
  unit: string;
  timestamp: string;
  location?: string;
  metadata?: Record<string, unknown>;
}

export interface Threshold {
  sensorType: SensorType;
  minValue: number | null;
  maxValue: number | null;
  unit: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  sensorId: string;
  sensorType: SensorType;
  message: string;
  severity: "low" | "medium" | "high";
  value: number;
  threshold: number | null;
  status: "new" | "acknowledged" | "resolved";
  createdAt: string;
  resolvedAt?: string;
}

export interface HistoricalPoint {
  timestamp: string;
  value: number;
}

export interface HistoricalSeries {
  sensorId: string;
  sensorType: SensorType;
  unit: string;
  points: HistoricalPoint[];
}

export interface SensorSummary {
  sensorId: string;
  sensorType: SensorType;
  label: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  change: number;
  status: "normal" | "warning" | "critical";
  updatedAt: string;
}

export interface DashboardSnapshot {
  summaries: SensorSummary[];
  alerts: Alert[];
  thresholds: Threshold[];
  history: HistoricalSeries[];
}

export type SocketEventKey = keyof typeof SOCKET_EVENTS;

