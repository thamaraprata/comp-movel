import axios from "axios";

export interface WeatherData {
  temperature: number;
  humidity: number;
  conditions: string;
  windSpeed: number;
  feelsLike: number;
}

export interface City {
  name: string;
  country: string;
  countryCode: string;
  state: string;
  description: string;
}

const API_BASE_URL = "http://localhost:3334/api/weather";

export async function getCities(): Promise<City[]> {
  const { data } = await axios.get(`${API_BASE_URL}/cities`);
  return data.data;
}

export async function getWeatherData(city?: string): Promise<WeatherData | null> {
  try {
    const params = city ? { city } : {};
    const { data } = await axios.get(API_BASE_URL, { params });
    return data.data || null;
  } catch (error) {
    console.error("Erro ao obter dados de clima:", error);
    return null;
  }
}

export async function getWeatherDescription(city?: string): Promise<string> {
  try {
    const params = city ? { city } : {};
    const { data } = await axios.get(`${API_BASE_URL}/description`, { params });
    return data.data?.description || "Dados não disponíveis";
  } catch (error) {
    console.error("Erro ao obter descrição de clima:", error);
    return "Erro ao carregar dados de clima";
  }
}

export async function getWeatherTips(city?: string) {
  try {
    const params = city ? { city } : {};
    const { data } = await axios.get(`${API_BASE_URL}/tips`, { params });
    return data.data || [];
  } catch (error) {
    console.error("Erro ao obter dicas de clima:", error);
    return [];
  }
}
