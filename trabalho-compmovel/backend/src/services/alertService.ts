import { randomUUID } from "node:crypto";

import { getDatabase } from "../database/connection";
import type { Alert, SensorReadingPayload } from "../types";
import { getThresholdByType } from "./thresholdService";
import { broadcastAlert } from "../realtime/socket";
import { sendTelegramAlert } from "../integrations/telegram";

export function evaluateReadingForAlert(reading: SensorReadingPayload) {
  const threshold = getThresholdByType(reading.type);
  if (!threshold) {
    return null;
  }

  if (
    (threshold.maxValue !== null && reading.value > threshold.maxValue) ||
    (threshold.minValue !== null && reading.value < threshold.minValue)
  ) {
    const severity =
      threshold.maxValue !== null && reading.value > threshold.maxValue * 1.2 ? "high" : "medium";
    const message =
      reading.value > (threshold.maxValue ?? Infinity)
        ? `Valor acima do limite (${reading.value.toFixed(1)} ${reading.unit})`
        : `Valor abaixo do limite (${reading.value.toFixed(1)} ${reading.unit})`;
    const alert: Alert = {
      id: randomUUID(),
      sensorId: reading.sensorId,
      sensorType: reading.type,
      message,
      severity,
      value: reading.value,
      threshold: threshold.maxValue ?? threshold.minValue ?? null,
      status: "new",
      createdAt: reading.timestamp
    };

    persistAlert(alert);
    broadcastAlert(alert);
    void sendTelegramAlert(alert);

    return alert;
  }
  return null;
}

export function persistAlert(alert: Alert) {
  const db = getDatabase();
  const stmt = db.prepare(
    `
    INSERT INTO alerts (
      id, sensor_id, sensor_type, message, severity, value, threshold, status, created_at
    ) VALUES (
      @id, @sensorId, @sensorType, @message, @severity, @value, @threshold, @status, @createdAt
    )
  `
  );

  stmt.run(alert);
}

export function listAlerts(): Alert[] {
  return getDatabase()
    .prepare(
      `SELECT id, sensor_id as sensorId, sensor_type as sensorType, message, severity, value, threshold, status, created_at as createdAt, resolved_at as resolvedAt
       FROM alerts
       ORDER BY datetime(created_at) DESC
       LIMIT 50`
    )
    .all();
}

export function acknowledgeAlertById(id: string): Alert | null {
  const db = getDatabase();
  const alert = db
    .prepare(
      `SELECT id, sensor_id as sensorId, sensor_type as sensorType, message, severity, value, threshold, status, created_at as createdAt, resolved_at as resolvedAt
       FROM alerts WHERE id = ?`
    )
    .get(id) as Alert | undefined;

  if (!alert) {
    return null;
  }

  db.prepare(`UPDATE alerts SET status = 'acknowledged', resolved_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);

  return { ...alert, status: "acknowledged", resolvedAt: new Date().toISOString() };
}

