import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../config/env.js";
import { logger } from "../config/logger.js";
import { WeatherContext, AITip } from "../types/index.js";

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
    return [];
  }

  try {
    const model = client.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
You are a meteorological assistant specialized in providing practical tips based on weather conditions.

Current conditions:
- Temperature: ${context.temperature}�C
- Humidity: ${context.humidity}%
- Location: ${context.location}
- Conditions: ${context.conditions}

Please generate 3-4 practical and contextualized tips about:
1. What to wear (clothing, accessories)
2. Recommended or activities to avoid
3. Health care
4. Tips to feel comfortable

Respond ONLY in JSON with this exact format:
{
  "tips": [
    {
      "title": "Tip Title",
      "description": "Detailed description",
      "icon": "relevant emoji",
      "priority": "low|medium|high",
      "actions": ["action 1", "action 2"]
    }
  ]
}

Be practical, concise and weather-based.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/m);
    if (!jsonMatch) {
      logger.warn("Failed to parse Gemini response");
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.tips || [];
  } catch (error) {
    logger.error(error, "Error generating weather tips from Gemini");
    return [];
  }
}

export async function generateAlertMessage(sensorId: string, value: number, threshold: number): Promise<string> {
  if (!client) {
    return `Sensor ${sensorId} exceeded limit: ${value} (limit: ${threshold})`;
  }

  try {
    const model = client.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
You are an assistant that generates concise and useful alert messages.

Generate a short and impactful message (max 100 characters) for this alert:
- Sensor ID: ${sensorId}
- Current value: ${value}
- Limit: ${threshold}
- Problem type: ${value > threshold ? "Value above limit" : "Value below limit"}

The message should be clear, alert the user and suggest action.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    logger.error(error, "Error generating alert message from Gemini");
    return `Alert: Sensor ${sensorId} with value ${value} (limit: ${threshold})`;
  }
}
