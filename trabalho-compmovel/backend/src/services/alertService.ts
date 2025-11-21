import { randomUUID } from "node:crypto";

import { getDatabase, saveDB } from "../database/connection.js";
import type { Alert, SensorReadingPayload } from "../types/index.js";
import { getThresholdByType } from "./thresholdService.js";
import { broadcastAlert } from "../realtime/socket.js";
import { sendTelegramAlert } from "../integrations/telegram.js";

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
  db.alerts = db.alerts || [];
  db.alerts.push({
    id: alert.id,
    sensor_id: alert.sensorId,
    sensor_type: alert.sensorType,
    message: alert.message,
    severity: alert.severity,
    value: alert.value,
    threshold: alert.threshold,
    status: alert.status,
    created_at: alert.createdAt,
    resolved_at: null
  });

  // Manter apenas últimos 100 alertas
  if (db.alerts.length > 100) {
    db.alerts = db.alerts.slice(-100);
  }

  saveDB();
}

export function listAlerts(): Alert[] {
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
      resolvedAt: a.resolved_at
    }))
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50);

  return alerts;
}

export function acknowledgeAlertById(id: string): Alert | null {
  const db = getDatabase();
  const alertData = db.alerts?.find((a: any) => a.id === id);

  if (!alertData) {
    return null;
  }

  alertData.status = "acknowledged";
  alertData.resolved_at = new Date().toISOString();
  saveDB();

  return {
    id: alertData.id,
    sensorId: alertData.sensor_id,
    sensorType: alertData.sensor_type,
    message: alertData.message,
    severity: alertData.severity,
    value: alertData.value,
    threshold: alertData.threshold,
    status: alertData.status,
    createdAt: alertData.created_at,
    resolvedAt: alertData.resolved_at
  };
}

