import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../config/logger.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const client = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

interface ChatContext {
  summary?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  weatherData?: {
    temperature: number;
    humidity: number;
    conditions: string;
    windSpeed: number;
    city: string;
  };
  userMessage: string;
}

export async function generateChatResponse(context: ChatContext): Promise<string> {
  if (!client) {
    return "Serviço de chat temporariamente indisponível.";
  }

  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = buildPrompt(context);

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    logger.error(error, "Erro ao gerar resposta do chat");
    return "Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?";
  }
}

function buildPrompt(context: ChatContext): string {
  let prompt = `Você é um assistente climático conversacional e prestativo. Responda de forma natural e contextualizada.

`;

  if (context.summary) {
    prompt += `RESUMO DA CONVERSA ANTERIOR:
${context.summary}

`;
  }

  if (context.weatherData) {
    prompt += `DADOS CLIMÁTICOS ATUAIS EM ${context.weatherData.city}:
- Temperatura: ${context.weatherData.temperature}°C
- Umidade: ${context.weatherData.humidity}%
- Condições: ${context.weatherData.conditions}
- Vento: ${context.weatherData.windSpeed} km/h

`;
  }

  if (context.messages.length > 0) {
    prompt += `HISTÓRICO RECENTE DA CONVERSA:
${context.messages.map((m) => `${m.role === "user" ? "Usuário" : "Você"}: ${m.content}`).join("\n")}

`;
  }

  prompt += `Usuário: ${context.userMessage}

Responda de forma útil, natural e contextualizada:`;

  return prompt;
}

export async function generateConversationSummary(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  if (!client) {
    return "Resumo indisponível";
  }

  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Resuma esta conversa em um parágrafo conciso (máximo 200 palavras):

${messages.map((m) => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`).join("\n")}

Foque em: tópicos discutidos, informações climáticas, dúvidas do usuário, e recomendações dadas.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    logger.error(error, "Erro ao gerar resumo");
    return "Resumo indisponível";
  }
}
