import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../config/env.js";
import { logger } from "../config/logger.js";
import type { WeatherContext, AITip } from "../types/index.js";

let client: GoogleGenerativeAI | null = null;

export function initGemini() {
  if (!ENV.GEMINI_API_KEY) {
    logger.warn("GEMINI_API_KEY not configured. AI features will be disabled.");
    return;
  }

  client = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
  logger.info("Gemini AI initialized");
}

export async function generateWeatherTips(
  context: WeatherContext
): Promise<AITip[]> {
  if (!client) {
    logger.warn("Gemini client not initialized");
    return getDefaultTips(context.location);
  }

  try {
    logger.info(`Gerando dicas para ${context.location} - Temp: ${context.temperature}°C, Umidade: ${context.humidity}%`);

    const model = client.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `Você é um assistente meteorológico local especializado em fornecer dicas práticas e personalizadas.

Condições climáticas atuais:
- Temperatura: ${context.temperature}°C
- Umidade: ${context.humidity}%
- Localização: ${context.location}, Brasil
- Condições: ${context.conditions}

IMPORTANTE: Você DEVE gerar exatamente 4 dicas personalizadas para ${context.location}. As dicas devem incluir:

1. **Roupas e acessórios**: O que vestir baseado no clima atual
2. **Atividades locais**: Sugira lugares específicos e famosos de ${context.location} que combinam com o clima (parques, museus, restaurantes, pontos turísticos)
3. **Saúde e conforto**: Cuidados com saúde baseados na temperatura/umidade
4. **Dica extra**: Algo útil e contextualizado para o clima e a cidade

Para cada dica, sugira 2-3 ações práticas específicas.

Responda APENAS com JSON válido (sem markdown, sem blocos de código) neste formato EXATO:
{
  "tips": [
    {
      "title": "Título da Dica",
      "description": "Descrição detalhada em português",
      "icon": "emoji relevante",
      "priority": "low" ou "medium" ou "high",
      "actions": ["ação 1 específica", "ação 2 específica"]
    }
  ]
}

Seja prático, detalhado e use nomes reais de lugares em ${context.location}.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    logger.debug(`Resposta do Gemini (primeiros 200 chars): ${text.substring(0, 200)}`);

    // Remove markdown code blocks if present
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/m);
    if (!jsonMatch) {
      logger.warn("Failed to parse Gemini response, using default tips");
      logger.debug(`Texto recebido: ${cleanText.substring(0, 500)}`);
      return getDefaultTips(context.location);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const tips = parsed.tips || [];

    logger.info(`Gemini retornou ${tips.length} dicas para ${context.location}`);

    // Garantir que temos pelo menos 3 dicas
    if (tips.length < 3) {
      logger.warn(`Only ${tips.length} tips generated, adding defaults`);
      return [...tips, ...getDefaultTips(context.location)].slice(0, 4);
    }

    return tips;
  } catch (error: any) {
    // Check if it's a rate limit error
    if (error?.status === 429) {
      logger.warn("Gemini API rate limit reached. Returning default tips.");
    } else {
      logger.error(error, "Error generating weather tips from Gemini");
    }
    return getDefaultTips(context.location);
  }
}

function getDefaultTips(location: string): AITip[] {
  return [
    {
      title: "Vista-se apropriadamente",
      description: `Verifique a temperatura atual em ${location} e ajuste suas roupas`,
      icon: "👕",
      priority: "medium",
      actions: ["Use camadas de roupa", "Leve um casaco se necessário", "Verifique a previsão"]
    },
    {
      title: "Explore a cidade",
      description: `Aproveite o dia para conhecer os pontos turísticos de ${location}`,
      icon: "🗺️",
      priority: "low",
      actions: ["Visite parques locais", "Conheça a gastronomia", "Tire fotos"]
    },
    {
      title: "Mantenha-se hidratado",
      description: "Beba água regularmente durante o dia",
      icon: "💧",
      priority: "high",
      actions: ["Leve uma garrafa de água", "Evite bebidas muito geladas", "Beba a cada hora"]
    },
    {
      title: "Proteja-se do clima",
      description: "Tome precauções baseadas nas condições climáticas",
      icon: "☀️",
      priority: "medium",
      actions: ["Use protetor solar", "Leve guarda-chuva se necessário", "Evite exposição prolongada"]
    }
  ];
}

export async function generateAlertMessage(sensorId: string, value: number, threshold: number): Promise<string> {
  if (!client) {
    return `Sensor ${sensorId} exceeded limit: ${value} (limit: ${threshold})`;
  }

  try {
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `You are an assistant that generates concise and useful alert messages.

Generate a short and impactful message (max 100 characters) for this alert:
- Sensor ID: ${sensorId}
- Current value: ${value}
- Limit: ${threshold}
- Problem type: ${value > threshold ? "Value above limit" : "Value below limit"}

The message should be clear, alert the user and suggest action. Respond with only the message text, no additional formatting.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    // Check if it's a rate limit error
    if (error?.status === 429) {
      logger.warn("Gemini API rate limit reached for alert message.");
      return `Alerta: Sensor ${sensorId} com valor ${value} (limite: ${threshold})`;
    }
    logger.error(error, "Error generating alert message from Gemini");
    return `Alert: Sensor ${sensorId} with value ${value} (limit: ${threshold})`;
  }
}

// Função simplificada para gerar dicas de texto
export async function getGeminiTips(weatherData: { temperature: number; humidity: number; conditions: string; windSpeed: number; feelsLike: number }): Promise<string> {
  if (!client) {
    logger.warn("Gemini client not initialized");
    return "Dicas não disponíveis";
  }

  try {
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `Você é um assistente meteorológico especializado em fornecer dicas práticas baseadas nas condições climáticas.

Condições atuais:
- Temperatura: ${weatherData.temperature}°C
- Sensação térmica: ${weatherData.feelsLike}°C
- Umidade: ${weatherData.humidity}%
- Vento: ${weatherData.windSpeed} km/h
- Condições: ${weatherData.conditions}

Por favor, gere 2-3 dicas práticas e contextualizadas sobre:
1. O que vestir
2. Atividades recomendadas
3. Cuidados com a saúde

Responda com dicas curtas e objetivas, uma por linha.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return response;
  } catch (error: any) {
    if (error?.status === 429) {
      logger.warn("Gemini API rate limit reached. Returning default tips.");
      return "Mantenha-se hidratado\nVista roupas apropriadas para o clima\nUse protetor solar";
    }
    logger.error(error, "Error generating weather tips from Gemini");
    return "Dicas não disponíveis no momento";
  }
}
