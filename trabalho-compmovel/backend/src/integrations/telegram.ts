import axios from "axios";

import { ENV } from "../config/env";
import { logger } from "../config/logger";
import type { Alert } from "../types";

export async function sendTelegramAlert(alert: Alert) {
  if (!ENV.TELEGRAM_BOT_TOKEN || !ENV.TELEGRAM_CHAT_ID) {
    logger.debug("Telegram não configurado, alerta não enviado");
    return;
  }

  const message = [
    "🚨 *Alerta de Sensor*",
    `Sensor: ${alert.sensorId} (${alert.sensorType})`,
    `Gravidade: ${alert.severity.toUpperCase()}`,
    `Valor: ${alert.value}`,
    `Limite: ${alert.threshold ?? "n/d"}`,
    `Hora: ${alert.createdAt}`
  ].join("\n");

  try {
    await axios.post(`https://api.telegram.org/bot${ENV.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: ENV.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown"
    });
    logger.info({ alertId: alert.id }, "Alerta enviado ao Telegram");
  } catch (error) {
    logger.error({ error }, "Falha ao enviar alerta ao Telegram");
  }
}

