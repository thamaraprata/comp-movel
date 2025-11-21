import { randomUUID } from "node:crypto";

import { getDatabase, saveDB } from "../database/connection.js";
import type { SensorReadingPayload } from "../types/index.js";
import { evaluateReadingForAlert } from "./alertService.js";
import { broadcastSensorUpdate } from "../realtime/socket.js";

export function listSensors() {
  const db = getDatabase();
  return db.sensors || [];
}

export function listSensorReadings(sensorId: string) {
  const db = getDatabase();
  const sensor = db.sensors?.find((s: any) => s.id === sensorId);
  if (!sensor) {
    return null;
  }

  const readings = (db.readings || [])
    .filter((r: any) => r.sensor_id === sensorId)
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 100);

  return readings;
}

export function persistReading(reading: SensorReadingPayload) {
  const db = getDatabase();

  // Criar ou atualizar sensor
  const existingSensor = db.sensors?.find((s: any) => s.id === reading.sensorId);
  if (!existingSensor) {
    db.sensors = db.sensors || [];
    db.sensors.push({
      id: reading.sensorId,
      name: `Sensor ${reading.sensorId}`,
      location: reading.metadata?.location ?? "Desconhecido",
      type: reading.type,
      created_at: new Date().toISOString()
    });
  }

  // Adicionar reading
  db.readings = db.readings || [];
  db.readings.push({
    id: randomUUID(),
    sensor_id: reading.sensorId,
    type: reading.type,
    value: reading.value,
    unit: reading.unit,
    timestamp: reading.timestamp,
    metadata: JSON.stringify(reading.metadata ?? {}),
    created_at: new Date().toISOString()
  });

  // Manter apenas últimos 1000 readings por performance
  if (db.readings.length > 1000) {
    db.readings = db.readings.slice(-1000);
  }

  saveDB();
  evaluateReadingForAlert(reading);
  broadcastSensorUpdate(reading.sensorId);
}

