import dayjs from "dayjs";

import { getDatabase } from "../database/connection.js";
import type {
  DashboardSnapshot,
  HistoricalSeries,
  SensorSummary
} from "../types/index.js";

export function getDashboardSnapshot(): DashboardSnapshot {
  const summaries = buildSummaries();

  const db = getDatabase();
  const alerts = (db.alerts || [])
    .map((a: any) => ({
      id: a.id,
      sensorId: a.sensor_id,
      sensorType: a.sensor_type,
      message: a.message,
      severity: a.severity,
      value: a.value,
      threshold: a.threshold,
      status: a.status,
      createdAt: a.created_at,
      resolvedAt: a.resolved_at,
      acknowledged: a.status === "acknowledged"
    }))
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  const thresholds = (db.thresholds || []).map((t: any) => ({
    sensorType: t.sensor_type,
    minValue: t.min_value,
    maxValue: t.max_value,
    unit: t.unit,
    updatedAt: t.updated_at
  }));

  const history = buildHistorySeries();

  return {
    summaries,
    alerts,
    thresholds,
    history
  };
}

export function getSensorSnapshot(sensorId: string) {
  const summaries = buildSummaries(sensorId);
  const history = buildHistorySeries(sensorId);
  return {
    summary: summaries[0],
    history: history[0]
  };
}

function buildSummaries(sensorIdFilter?: string): SensorSummary[] {
  const db = getDatabase();
  const sensors = db.sensors || [];
  const readings = db.readings || [];

  return sensors
    .filter((s: any) => !sensorIdFilter || s.id === sensorIdFilter)
    .map((sensor: any) => {
      const sensorReadings = readings
        .filter((r: any) => r.sensor_id === sensor.id)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (sensorReadings.length === 0) {
        return null;
      }

      const latest = sensorReadings[0];
      const previous = sensorReadings[1];
      const change = previous ? Number((latest.value - previous.value).toFixed(2)) : 0;
      const trend = change > 0.5 ? "up" : change < -0.5 ? "down" : "stable";

      const threshold = db.thresholds?.find((t: any) => t.sensor_type === sensor.type);
      const status = calculateStatus(latest.value, threshold?.min_value, threshold?.max_value);

      return {
        sensorId: sensor.id,
        sensorType: sensor.type,
        label: sensor.name,
        value: latest.value,
        unit: latest.unit,
        trend,
        change,
        status,
        updatedAt: latest.timestamp
      };
    })
    .filter((s: any) => s !== null);
}

function buildHistorySeries(sensorIdFilter?: string): HistoricalSeries[] {
  const db = getDatabase();
  const readings = (db.readings || [])
    .filter((r: any) => !sensorIdFilter || r.sensor_id === sensorIdFilter)
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const grouped = new Map<string, HistoricalSeries>();

  readings.forEach((row: any) => {
    const sensor = db.sensors?.find((s: any) => s.id === row.sensor_id);
    if (!sensor) return;

    const key = row.sensor_id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        sensorId: row.sensor_id,
        sensorType: sensor.type as any,
        unit: row.unit,
        points: []
      });
    }
    grouped.get(key)!.points.push({
      timestamp: row.timestamp,
      value: row.value
    });
  });

  return Array.from(grouped.values()).map((series) => ({
    ...series,
    points: series.points
      .sort((a, b) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf())
      .slice(-30)
  }));
}

function calculateStatus(value: number, minValue?: number | null, maxValue?: number | null) {
  if (typeof minValue === "number" && value < minValue) {
    return "warning";
  }
  if (typeof maxValue === "number" && value > maxValue) {
    return value > (maxValue + (maxValue - (minValue ?? maxValue)) * 0.2) ? "critical" : "warning";
  }
  return "normal";
}

