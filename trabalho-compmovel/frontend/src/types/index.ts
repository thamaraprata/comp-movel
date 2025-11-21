export type SensorType =
  | "temperature"
  | "humidity"
  | "airQuality"
  | "luminosity"
  | "pressure";

export interface SensorThreshold {
  sensorType: SensorType;
  minValue: number | null;
  maxValue: number | null;
  unit: string;
}

export interface SensorReading {
  sensorId: string;
  sensorType: SensorType;
  value: number;
  unit: string;
  timestamp: string;
  location?: string;
  metadata?: Record<string, string | number | boolean>;
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

export interface Alert {
  id: string;
  sensorId: string;
  sensorType: SensorType;
  message: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
  acknowledged: boolean;
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

export interface AITip {
  title: string;
  description: string;
  icon: string;
  priority: "low" | "medium" | "high";
  actions: string[];
}

export interface DashboardSnapshot {
  summaries: SensorSummary[];
  alerts: Alert[];
  thresholds: SensorThreshold[];
  history: HistoricalSeries[];
}

