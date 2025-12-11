import * as conversationService from "./conversationService.js";
import * as geminiChat from "../integrations/geminiChat.js";
import { getWeatherData } from "../integrations/openweather.js";
import { logger } from "../config/logger.js";
import { broadcastChatMessage } from "../realtime/socket.js";

export async function processMessage(
  userId: number,
  userMessage: string,
  city?: string,
  platform: "web" | "telegram" = "web"
): Promise<{ conversationId: number; aiResponse: string }> {
  try {
    // 1. Buscar ou criar conversa
    const conversationId = await conversationService.getOrCreateConversation(userId, city);

    // 2. Salvar mensagem do usuário
    await conversationService.saveMessage(
      conversationId,
      userId,
      "user",
      userMessage,
      platform
    );

    // Emitir evento Socket.IO
    broadcastChatMessage(userId, {
      role: "user",
      content: userMessage,
      conversationId,
      timestamp: new Date().toISOString()
    });

    // 3. Buscar contexto
    const messages = await conversationService.getConversationMessages(conversationId, 30);
    const summary = await conversationService.getConversationSummary(conversationId);

    // 4. Buscar dados climáticos (se cidade fornecida)
    let weatherData;
    if (city) {
      const weather = await getWeatherData(city);
      if (weather) {
        weatherData = { ...weather, city };
      }
    }

    // 5. Gerar resposta da IA
    const aiResponse = await geminiChat.generateChatResponse({
      summary: summary || undefined,
      messages,
      weatherData,
      userMessage
    });

    // 6. Salvar resposta da IA
    await conversationService.saveMessage(
      conversationId,
      userId,
      "assistant",
      aiResponse,
      platform,
      weatherData
    );

    // Emitir evento Socket.IO
    broadcastChatMessage(userId, {
      role: "assistant",
      content: aiResponse,
      conversationId,
      timestamp: new Date().toISOString()
    });

    // 7. Verificar se precisa gerar resumo (em background)
    if (await conversationService.shouldGenerateSummary(conversationId)) {
      generateSummaryInBackground(conversationId);
    }

    return { conversationId, aiResponse };
  } catch (error) {
    logger.error(error, "Erro ao processar mensagem");
    throw error;
  }
}

async function generateSummaryInBackground(conversationId: number): Promise<void> {
  try {
    const allMessages = await conversationService.getConversationMessages(conversationId, 1000);
    const summary = await geminiChat.generateConversationSummary(allMessages);

    await conversationService.updateConversationSummary(conversationId, summary);

    logger.info({ conversationId }, "Resumo gerado com sucesso");
  } catch (error) {
    logger.error(error, "Erro ao gerar resumo em background");
  }
}
