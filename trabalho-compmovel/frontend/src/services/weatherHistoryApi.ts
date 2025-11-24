import axios from "axios";
import type { WeatherData } from "./weatherApi";

const API_BASE_URL = "http://localhost:3334/api/weather";

export interface WeatherDataPoint extends WeatherData {
  timestamp: string;
  city: string;
  countryCode: string;
}

export interface WeatherStats {
  avgTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  avgHumidity: number;
  lastUpdate: string | null;
}

/**
 * Buscar histórico de clima do InfluxDB
 * @param city Nome da cidade
 * @param range Intervalo de tempo (ex: -7d, -24h, -30d)
 */
export async function getWeatherHistoryFromInfluxDB(
  city: string,
  range: string = "-7d"
): Promise<WeatherDataPoint[]> {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/history`, {
      params: {
        city,
        countryCode: "BR",
        range
      }
    });
    return data.data || [];
  } catch (error) {
    console.error("Erro ao obter histórico de clima:", error);
    return [];
  }
}

/**
 * Buscar estatísticas de clima
 * @param city Nome da cidade
 * @param range Intervalo de tempo (ex: -24h, -7d)
 */
export async function getWeatherStatsFromInfluxDB(
  city: string,
  range: string = "-24h"
): Promise<WeatherStats | null> {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/stats`, {
      params: {
        city,
        countryCode: "BR",
        range
      }
    });
    return data.data || null;
  } catch (error) {
    console.error("Erro ao obter estatísticas de clima:", error);
    return null;
  }
}

/**
 * Formatar histórico para exibição em gráfico
 */
export function formatHistoryForChart(history: WeatherDataPoint[]) {
  return {
    labels: history.map(h => new Date(h.timestamp).toLocaleTimeString("pt-BR")),
    temperature: history.map(h => h.temperature),
    humidity: history.map(h => h.humidity),
    windSpeed: history.map(h => h.windSpeed),
    feelsLike: history.map(h => h.feelsLike)
  };
}

/**
 * Agrupar histórico por dia
 */
export function groupByDay(history: WeatherDataPoint[]) {
  const grouped: { [key: string]: WeatherDataPoint[] } = {};

  history.forEach(item => {
    const date = new Date(item.timestamp).toLocaleDateString("pt-BR");
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(item);
  });

  return grouped;
}

/**
 * Calcular média de temperatura por hora
 */
export function getHourlyAverages(history: WeatherDataPoint[]) {
  const hourly: { [key: string]: { temps: number[]; humidities: number[] } } = {};

  history.forEach(item => {
    const date = new Date(item.timestamp);
    const hour = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    if (!hourly[hour]) {
      hourly[hour] = { temps: [], humidities: [] };
    }

    hourly[hour].temps.push(item.temperature);
    hourly[hour].humidities.push(item.humidity);
  });

  return Object.entries(hourly).map(([hour, data]) => ({
    hour,
    avgTemperature: Math.round((data.temps.reduce((a, b) => a + b) / data.temps.length) * 10) / 10,
    avgHumidity: Math.round((data.humidities.reduce((a, b) => a + b) / data.humidities.length) * 10) / 10
  }));
}
