import axios from "axios";

import { ENV } from "../config/env";
import { logger } from "../config/logger";
import type { Alert, AITip } from "../types";

const TELEGRAM_API_URL = "https://api.telegram.org";

export async function sendTelegramAlert(alert: Alert) {
  if (!ENV.TELEGRAM_BOT_TOKEN || !ENV.TELEGRAM_CHAT_ID) {
    logger.debug("Telegram não configurado, alerta não enviado");
    return;
  }

  const message = [
    "🚨 *Alerta de Sensor*",
    `Sensor: ${alert.sensor_id}`,
    `Valor: ${alert.value}`,
    `Limite: ${alert.threshold}`,
    `Hora: ${alert.created_at}`
  ].join("\n");

  try {
    await axios.post(`${TELEGRAM_API_URL}/bot${ENV.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: ENV.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown"
    });
    logger.info({ alertId: alert.id }, "Alerta enviado ao Telegram");
  } catch (error) {
    logger.error({ error }, "Falha ao enviar alerta ao Telegram");
  }
}

export async function sendTelegramTips(tips: AITip[], location: string = "Sua localização") {
  if (!ENV.TELEGRAM_BOT_TOKEN || !ENV.TELEGRAM_CHAT_ID) {
    logger.debug("Telegram não configurado, dicas não enviadas");
    return;
  }

  if (!tips.length) {
    return;
  }

  try {
    let message = `💡 *Dicas Personalizadas para ${location}*\n\n`;

    tips.forEach((tip, index) => {
      message += `*${index + 1}. ${tip.title}*\n`;
      message += `${tip.icon} ${tip.description}\n\n`;

      if (tip.actions.length > 0) {
        message += "*Ações recomendadas:*\n";
        tip.actions.forEach(action => {
          message += `• ${action}\n`;
        });
        message += "\n";
      }
    });

    await axios.post(`${TELEGRAM_API_URL}/bot${ENV.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: ENV.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown"
    });

    logger.info({ tipsCount: tips.length }, "Dicas enviadas ao Telegram");
  } catch (error) {
    logger.error({ error }, "Falha ao enviar dicas ao Telegram");
  }
}

export async function sendTelegramMessage(text: string) {
  if (!ENV.TELEGRAM_BOT_TOKEN || !ENV.TELEGRAM_CHAT_ID) {
    logger.debug("Telegram não configurado, mensagem não enviada");
    return;
  }

  try {
    await axios.post(`${TELEGRAM_API_URL}/bot${ENV.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: ENV.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "Markdown"
    });
    logger.info("Mensagem enviada ao Telegram");
  } catch (error) {
    logger.error({ error }, "Falha ao enviar mensagem ao Telegram");
  }
}

