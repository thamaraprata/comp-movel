import { randomUUID } from "node:crypto";

import { getDatabase, saveDB } from "./connection.js";
import { migrate } from "./migrate.js";
import { logger } from "../config/logger.js";

const DEFAULT_SENSORS = [
  { id: "temp-01", name: "Sensor de Temperatura - Lab 1", type: "temperature", unit: "°C", location: "Campus Principal" },
  { id: "hum-01", name: "Sensor de Umidade - Lab 1", type: "humidity", unit: "%", location: "Campus Principal" },
  { id: "air-01", name: "Qualidade do Ar - Sala 2", type: "airQuality", unit: "AQI", location: "Campus Principal" },
  { id: "lum-01", name: "Luminosidade - Auditório", type: "luminosity", unit: "lux", location: "Campus Principal" }
];

export async function seed() {
  await migrate();
  const db = getDatabase();

  // Adicionar sensores (se não existirem)
  DEFAULT_SENSORS.forEach((sensor) => {
    const exists = db.sensors.find((s: any) => s.id === sensor.id);
    if (!exists) {
      db.sensors.push(sensor);
    }
  });

  // Adicionar thresholds
  const now = new Date().toISOString();
  logger.info(`Adicionando thresholds... Total atual: ${db.thresholds.length}`);

  DEFAULT_SENSORS.forEach((sensor) => {
    const exists = db.thresholds.find((t: any) => t.sensor_type === sensor.type);
    if (!exists) {
      const threshold = {
        sensor_type: sensor.type,
        min_value: sensor.type === "temperature" ? 18 : sensor.type === "humidity" ? 30 : null,
        max_value: sensor.type === "temperature" ? 28 : sensor.type === "humidity" ? 70 : null,
        unit: sensor.unit,
        updated_at: now
      };
      db.thresholds.push(threshold);
      logger.info(`Threshold adicionado para ${sensor.type}:`, threshold);
    } else {
      logger.info(`Threshold já existe para ${sensor.type}`);
    }
  });

  logger.info(`Total de thresholds após seed: ${db.thresholds.length}`);

  // Adicionar leituras de exemplo (últimas 30 leituras)
  DEFAULT_SENSORS.forEach((sensor, index) => {
    for (let i = 0; i < 30; i++) {
      const timestamp = new Date(Date.now() - i * 60_000 - index * 10_000).toISOString();
      db.readings.push({
        id: randomUUID(),
        sensor_id: sensor.id,
        type: sensor.type,
        value: generateValue(sensor.type, i),
        unit: sensor.unit,
        timestamp,
        metadata: { sample: true }
      });
    }
  });

  saveDB();
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

