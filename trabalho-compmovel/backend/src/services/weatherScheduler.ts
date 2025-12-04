import cron from "node-cron";
import { logger } from "../config/logger";
import { getWeatherData, WeatherData } from "../integrations/openweather";
import { getGeminiTips } from "../integrations/gemini";
import { io } from "../realtime/socket";

const DEFAULT_CITY = process.env.OPENWEATHER_CITY || "São Paulo";
const DEFAULT_COUNTRY_CODE = process.env.OPENWEATHER_COUNTRY_CODE || "BR";

// Armazenar histórico de dados climáticos (últimas 24h)
export interface WeatherRecord {
  city: string;
  countryCode: string;
  data: WeatherData;
  timestamp: number;
  tips?: string[];
}

const weatherHistory = new Map<string, WeatherRecord[]>();

function getHistoryKey(city: string, countryCode: string): string {
  return `${city},${countryCode}`.toLowerCase();
}

export function getWeatherHistory(city?: string, countryCode?: string): WeatherRecord[] {
  const finalCity = city || DEFAULT_CITY;
  const finalCountryCode = countryCode || DEFAULT_COUNTRY_CODE;
  const key = getHistoryKey(finalCity, finalCountryCode);
  return weatherHistory.get(key) || [];
}

export function getCurrentWeatherRecord(city?: string, countryCode?: string): WeatherRecord | null {
  const history = getWeatherHistory(city, countryCode);
  return history.length > 0 ? history[history.length - 1] : null;
}

async function updateWeatherData(city: string = DEFAULT_CITY, countryCode: string = DEFAULT_COUNTRY_CODE) {
  try {
    logger.info(`Atualizando dados de clima para ${city}, ${countryCode}`);

    const weatherData = await getWeatherData(city, countryCode);
    if (!weatherData) {
      logger.warn(`Nenhum dado de clima retornado para ${city}`);
      return;
    }

    // Gerar dicas com Gemini
    let tips: string[] = [];
    try {
      const tipsText = await getGeminiTips(weatherData);
      // Dividir dicas em array
      tips = tipsText
        .split("\n")
        .filter((tip) => tip.trim().length > 0)
        .slice(0, 3); // Pegar apenas as 3 primeiras dicas
    } catch (error) {
      logger.error(error, "Erro ao gerar dicas com Gemini");
    }

    const record: WeatherRecord = {
      city,
      countryCode,
      data: weatherData,
      timestamp: Date.now(),
      tips
    };

    // Adicionar ao histórico
    const key = getHistoryKey(city, countryCode);
    const history = weatherHistory.get(key) || [];

    history.push(record);

    // Manter apenas últimas 24h (288 registros a cada 5 minutos)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const filtered = history.filter((r) => r.timestamp > oneDayAgo);

    weatherHistory.set(key, filtered);

    // Emitir evento via Socket.IO para atualizar frontend em tempo real
    io.emit("weather:updated", record);

    logger.info("Dados de clima atualizados e emitidos", {
      city,
      temperature: weatherData.temperature,
      tipsCount: tips.length
    });
  } catch (error) {
    logger.error(error, `Erro ao atualizar dados de clima para ${city}`);
  }
}

let scheduledJobs: cron.ScheduledTask[] = [];

export function initWeatherScheduler() {
  // Executar uma vez ao iniciar
  updateWeatherData();

  // Agendar para rodar a cada 5 minutos
  const job = cron.schedule("*/5 * * * *", () => {
    updateWeatherData();
  });

  scheduledJobs.push(job);

  logger.info("Weather scheduler iniciado - atualizações a cada 5 minutos");
}

export function stopWeatherScheduler() {
  scheduledJobs.forEach((job) => job.stop());
  scheduledJobs = [];
  logger.info("Weather scheduler parado");
}

export function updateWeatherForCity(city: string, countryCode: string = "BR") {
  return updateWeatherData(city, countryCode);
}
