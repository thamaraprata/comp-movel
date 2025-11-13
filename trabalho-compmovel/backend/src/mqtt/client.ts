import mqtt from "mqtt";

import { ENV } from "../config/env";
import { logger } from "../config/logger";
import type { SensorReadingPayload } from "../types";
import { persistReading } from "../services/sensorService";

export function initMqttClient() {
  const client = mqtt.connect(ENV.MQTT_URL, {
    username: ENV.MQTT_USERNAME,
    password: ENV.MQTT_PASSWORD
  });

  client.on("connect", () => {
    logger.info("Conectado ao broker MQTT");
    client.subscribe(ENV.MQTT_SENSOR_TOPIC, (error) => {
      if (error) {
        logger.error(error, "Erro ao assinar tópico MQTT");
      } else {
        logger.info({ topic: ENV.MQTT_SENSOR_TOPIC }, "Assinatura MQTT realizada");
      }
    });
  });

  client.on("message", (_topic, payload) => {
    try {
      const parsed = JSON.parse(payload.toString()) as SensorReadingPayload;
      if (!parsed.sensorId || !parsed.type || typeof parsed.value !== "number") {
        throw new Error("Payload inválido");
      }
      persistReading({
        sensorId: parsed.sensorId,
        type: parsed.type,
        value: parsed.value,
        unit: parsed.unit ?? inferUnit(parsed.type),
        timestamp: parsed.timestamp ?? new Date().toISOString(),
        metadata: parsed.metadata
      });
    } catch (error) {
      logger.error({ error }, "Falha ao processar mensagem MQTT");
    }
  });

  client.on("error", (error) => {
    logger.error({ error }, "Erro no cliente MQTT");
  });

  return client;
}

function inferUnit(sensorType: SensorReadingPayload["type"]) {
  switch (sensorType) {
    case "temperature":
      return "°C";
    case "humidity":
      return "%";
    case "airQuality":
      return "AQI";
    case "luminosity":
      return "lux";
    case "pressure":
      return "hPa";
    default:
      return "";
  }
}

