import { randomUUID } from "node:crypto";

import { getDatabase } from "./connection";
import { migrate } from "./migrate";
import { logger } from "../config/logger";

const DEFAULT_SENSORS = [
  { id: "temp-01", name: "Sensor de Temperatura - Lab 1", type: "temperature", unit: "°C" },
  { id: "hum-01", name: "Sensor de Umidade - Lab 1", type: "humidity", unit: "%" },
  { id: "air-01", name: "Qualidade do Ar - Sala 2", type: "airQuality", unit: "AQI" },
  { id: "lum-01", name: "Luminosidade - Auditório", type: "luminosity", unit: "lux" }
];

export async function seed() {
  await migrate();
  const db = getDatabase();

  const insertSensor = db.prepare(
    `INSERT OR IGNORE INTO sensors (id, name, location, type) VALUES (@id, @name, @location, @type)`
  );
  DEFAULT_SENSORS.forEach((sensor) =>
    insertSensor.run({ ...sensor, location: "Campus Principal" })
  );

  const thresholdStmt = db.prepare(
    `INSERT OR IGNORE INTO thresholds (sensor_type, min_value, max_value, unit, updated_at)
     VALUES (@sensorType, @minValue, @maxValue, @unit, @updatedAt)`
  );

  const now = new Date().toISOString();
  DEFAULT_SENSORS.forEach((sensor) => {
    thresholdStmt.run({
      sensorType: sensor.type,
      minValue: sensor.type === "temperature" ? 18 : null,
      maxValue: sensor.type === "temperature" ? 28 : null,
      unit: sensor.unit,
      updatedAt: now
    });
  });

  const readingStmt = db.prepare(
    `INSERT INTO readings (id, sensor_id, type, value, unit, timestamp, metadata)
     VALUES (@id, @sensorId, @type, @value, @unit, @timestamp, @metadata)`
  );

  DEFAULT_SENSORS.forEach((sensor, index) => {
    for (let i = 0; i < 10; i++) {
      const timestamp = new Date(Date.now() - i * 60_000 - index * 10_000).toISOString();
      readingStmt.run({
        id: randomUUID(),
        sensorId: sensor.id,
        type: sensor.type,
        value: generateValue(sensor.type, i),
        unit: sensor.unit,
        timestamp,
        metadata: JSON.stringify({ sample: true })
      });
    }
  });

  logger.info("Seed executado com sucesso");
}

function generateValue(type: string, index: number) {
  switch (type) {
    case "temperature":
      return 22 + Math.sin(index / 2) * 3;
    case "humidity":
      return 45 + Math.cos(index / 3) * 10;
    case "airQuality":
      return 35 + Math.random() * 10;
    case "luminosity":
      return 300 + (Math.random() - 0.5) * 100;
    default:
      return 0;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error(error, "Erro ao executar seed");
      process.exit(1);
    });
}

