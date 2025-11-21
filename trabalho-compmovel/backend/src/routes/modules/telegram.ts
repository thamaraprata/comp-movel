import { Router } from "express";
import { z } from "zod";
import { logger } from "../../config/logger.js";
import { generateWeatherTips } from "../../integrations/gemini.js";
import { sendTelegramMessage } from "../../integrations/telegram.js";
import { listSensors, listSensorReadings } from "../../services/sensorService.js";

export const telegramRouter = Router();

const telegramMessageSchema = z.object({
  message: z.object({
    chat: z.object({
      id: z.number()
    }),
    text: z.string(),
    from: z.object({
      first_name: z.string()
    })
  })
});

telegramRouter.post("/webhook", async (req, res) => {
  try {
    const payload = telegramMessageSchema.parse(req.body);
    const { chat, text, from } = payload.message;
    const chatId = chat.id;
    const userName = from.first_name;

    logger.info({ chatId, text }, "Mensagem recebida do Telegram");

    const lowerText = text.toLowerCase();

    if (lowerText.includes("dica") || lowerText.includes("conselho")) {
      const sensors = listSensors();
      const tempSensor = sensors.find(s => s.type === "temperature");

      if (tempSensor) {
        const readings = listSensorReadings(tempSensor.id);
        if (readings && readings.length > 0) {
          const latestReading = readings[0];
          const context = {
            temperature: latestReading.value,
            humidity: 50,
            location: "Sua Casa",
            conditions: "Monitorado por sensores"
          };

          const tips = await generateWeatherTips(context);
          let message = `Olá ${userName}! 💡 Aqui estão dicas personalizadas:

`;

          tips.slice(0, 2).forEach((tip, index) => {
            message += `${index + 1}. *${tip.title}*
`;
            message += `${tip.icon} ${tip.description}

`;
          });

          await sendTelegramMessage(message);
        }
      }
    } else if (lowerText.includes("status") || lowerText.includes("sensores")) {
      const sensors = listSensors();
      let message = `📊 *Status dos Sensores*

`;

      sensors.forEach(sensor => {
        const readings = listSensorReadings(sensor.id);
        if (readings && readings.length > 0) {
          const latest = readings[0];
          message += `${sensor.name}
`;
          message += `  Tipo: ${latest.type}
`;
          message += `  Valor: ${latest.value}${latest.unit}
`;
          message += `  Local: ${sensor.location}

`;
        }
      });

      await sendTelegramMessage(message);
    } else {
      const response = `Olá ${userName}! 👋

Comandos disponíveis:
• "dica" - Receba dicas personalizadas
• "status" - Veja o status dos sensores`;
      await sendTelegramMessage(response);
    }

    res.json({ ok: true });
  } catch (error) {
    logger.error(error, "Erro ao processar webhook do Telegram");
    res.json({ ok: false });
  }
});
