import axios from "axios";
import { logger } from "../config/logger";

export interface WeatherData {
  temperature: number;
  humidity: number;
  conditions: string;
  windSpeed: number;
  feelsLike: number;
}

interface CachedWeather {
  data: WeatherData | null;
  timestamp: number;
}

const weatherCache = new Map<string, CachedWeather>();
const REQUEST_INTERVAL = 60000; // 1 minuto

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const DEFAULT_CITY = process.env.OPENWEATHER_CITY || "São Paulo";
const DEFAULT_COUNTRY_CODE = process.env.OPENWEATHER_COUNTRY_CODE || "BR";

function getCacheKey(city: string, countryCode: string): string {
  return `${city},${countryCode}`.toLowerCase();
}

export async function getWeatherData(city?: string, countryCode?: string): Promise<WeatherData | null> {
  const finalCity = city || DEFAULT_CITY;
  const finalCountryCode = countryCode || DEFAULT_COUNTRY_CODE;

  // Se não tem chave configurada, retornar null
  if (!OPENWEATHER_API_KEY) {
    return null;
  }

  const cacheKey = getCacheKey(finalCity, finalCountryCode);
  const now = Date.now();
  const cached = weatherCache.get(cacheKey);

  // Se a última requisição foi há menos de 1 minuto, retornar dados em cache
  if (cached && now - cached.timestamp < REQUEST_INTERVAL) {
    logger.debug(`Usando dados de clima em cache para ${finalCity}`);
    return cached.data;
  }

  try {
    logger.info(`Buscando dados de clima para ${finalCity}, ${finalCountryCode}`);

    const response = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: {
        q: `${finalCity},${finalCountryCode}`,
        appid: OPENWEATHER_API_KEY,
        units: "metric", // Celsius
        lang: "pt_br"
      },
      timeout: 5000
    });

    const data = response.data;

    const weatherData: WeatherData = {
      temperature: Math.round(data.main.temp * 10) / 10,
      humidity: data.main.humidity,
      conditions: data.weather[0].description,
      windSpeed: Math.round(data.wind.speed * 10) / 10,
      feelsLike: Math.round(data.main.feels_like * 10) / 10
    };

    weatherCache.set(cacheKey, { data: weatherData, timestamp: now });

    logger.info("Dados de clima atualizados com sucesso", {
      city: finalCity,
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      conditions: weatherData.conditions
    });

    return weatherData;
  } catch (error: any) {
    logger.error(error, "Erro ao buscar dados de clima do OpenWeather");

    // Se temos dados em cache, retornar mesmo com erro
    if (cached?.data) {
      logger.warn(`Usando dados de clima em cache para ${finalCity} devido a erro na API`);
      return cached.data;
    }

    return null;
  }
}

export async function getWeatherDescription(city?: string, countryCode?: string): Promise<string> {
  const weather = await getWeatherData(city, countryCode);
  if (!weather) return "Dados de clima não disponíveis";

  return `
Temperatura: ${weather.temperature}°C
Sensação térmica: ${weather.feelsLike}°C
Umidade: ${weather.humidity}%
Vento: ${weather.windSpeed} km/h
Condições: ${weather.conditions}
  `.trim();
}
