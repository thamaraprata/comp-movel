import dayjs from "dayjs";

import { getDatabase } from "../database/connection";
import type {
  DashboardSnapshot,
  HistoricalSeries,
  SensorSummary
} from "../types";

export function getDashboardSnapshot(): DashboardSnapshot {
  const summaries = buildSummaries();
  const alerts = getDatabase()
    .prepare(
      `SELECT * FROM alerts ORDER BY datetime(created_at) DESC LIMIT 20`
    )
    .all();

  const thresholds = getDatabase()
    .prepare(`SELECT sensor_type AS sensorType, min_value AS minValue, max_value AS maxValue, unit, updated_at AS updatedAt FROM thresholds`)
    .all();

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

function buildSummaries(sensorId?: string): SensorSummary[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
      SELECT s.id as sensorId,
             s.name as label,
             s.type as sensorType,
             latest.value as value,
             latest.unit as unit,
             latest.timestamp as updatedAt
      FROM sensors s
      JOIN (
        SELECT r1.*
        FROM readings r1
        JOIN (
          SELECT sensor_id, MAX(timestamp) as max_timestamp
          FROM readings
          GROUP BY sensor_id
        ) latest ON latest.sensor_id = r1.sensor_id AND latest.max_timestamp = r1.timestamp
      ) latest ON latest.sensor_id = s.id
      ${sensorId ? "WHERE s.id = ?" : ""}
    `
    )
    .all(sensorId ? [sensorId] : undefined);

  return rows.map((row: any) => {
    const previous = db
      .prepare(
        `SELECT value
         FROM readings
         WHERE sensor_id = ?
         ORDER BY datetime(timestamp) DESC
         LIMIT 1 OFFSET 1`
      )
      .get(row.sensorId) as { value: number } | undefined;

    const change = previous ? Number((row.value - previous.value).toFixed(2)) : 0;
    const trend =
      change > 0.5 ? "up" : change < -0.5 ? "down" : "stable";

    const thresholds = db
      .prepare(
        `SELECT min_value AS minValue, max_value AS maxValue
         FROM thresholds WHERE sensor_type = ?`
      )
      .get(row.sensorType) as { minValue: number | null; maxValue: number | null } | undefined;

    const status = calculateStatus(row.value, thresholds?.minValue, thresholds?.maxValue);

    return {
      sensorId: row.sensorId,
      sensorType: row.sensorType,
      label: row.label,
      value: row.value,
      unit: row.unit,
      trend,
      change,
      status,
      updatedAt: row.updatedAt
    };
  });
}

function buildHistorySeries(sensorId?: string): HistoricalSeries[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
      SELECT sensor_id as sensorId,
             type as sensorType,
             unit,
             value,
             timestamp
      FROM readings
      ${sensorId ? "WHERE sensor_id = ?" : ""}
      ORDER BY datetime(timestamp) DESC
    `
    )
    .all(sensorId ? [sensorId] : undefined) as Array<{
      sensorId: string;
      sensorType: string;
      unit: string;
      value: number;
      timestamp: string;
    }>;

  const grouped = new Map<string, HistoricalSeries>();
  rows.forEach((row) => {
    const key = row.sensorId;
    if (!grouped.has(key)) {
      grouped.set(key, {
        sensorId: row.sensorId,
        sensorType: row.sensorType as HistoricalSeries["sensorType"],
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

