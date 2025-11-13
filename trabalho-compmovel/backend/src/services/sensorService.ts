import { randomUUID } from "node:crypto";

import { getDatabase } from "../database/connection";
import type { SensorReadingPayload } from "../types";
import { evaluateReadingForAlert } from "./alertService";
import { broadcastSensorUpdate } from "../realtime/socket";

export function listSensors() {
  return getDatabase()
    .prepare(`SELECT id, name, location, type, created_at as createdAt FROM sensors`)
    .all();
}

export function listSensorReadings(sensorId: string) {
  const db = getDatabase();
  const sensor = db
    .prepare(`SELECT id FROM sensors WHERE id = ?`)
    .get(sensorId);
  if (!sensor) {
    return null;
  }

  return db
    .prepare(
      `SELECT id, sensor_id as sensorId, type, value, unit, timestamp, metadata
       FROM readings
       WHERE sensor_id = ?
       ORDER BY datetime(timestamp) DESC
       LIMIT 100`
    )
    .all(sensorId);
}

export function persistReading(reading: SensorReadingPayload) {
  const db = getDatabase();
  db.prepare(
    `INSERT OR IGNORE INTO sensors (id, name, location, type)
     VALUES (@id, @name, @location, @type)`
  ).run({
    id: reading.sensorId,
    name: `Sensor ${reading.sensorId}`,
    location: reading.metadata?.location ?? "Desconhecido",
    type: reading.type
  });

  const stmt = db.prepare(
    `INSERT INTO readings (id, sensor_id, type, value, unit, timestamp, metadata)
     VALUES (@id, @sensorId, @type, @value, @unit, @timestamp, @metadata)`
  );

  stmt.run({
    id: randomUUID(),
    sensorId: reading.sensorId,
    type: reading.type,
    value: reading.value,
    unit: reading.unit,
    timestamp: reading.timestamp,
    metadata: JSON.stringify(reading.metadata ?? {})
  });

  evaluateReadingForAlert(reading);
  broadcastSensorUpdate(reading.sensorId);
}

