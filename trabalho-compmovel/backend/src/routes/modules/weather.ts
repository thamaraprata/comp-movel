import { Router } from "express";
import { getWeatherData, getWeatherDescription } from "../../integrations/openweather";
import { generateWeatherTips } from "../../integrations/gemini";
import { getWeatherHistory, getWeatherStats } from "../../integrations/influxdb";
import { CITIES } from "../../config/cities";
import { logger } from "../../config/logger";

export const weatherRouter = Router();

// GET /api/weather/cities - Listar cidades disponíveis
weatherRouter.get("/cities", (_req, res) => {
  res.json({
    status: "success",
    data: CITIES
  });
});

// GET /api/weather - Obter dados de clima
// Parâmetros opcionais: city, countryCode
weatherRouter.get("/", async (req, res) => {
  try {
    const { city, countryCode } = req.query;
    const weatherData = await getWeatherData(
      city as string | undefined,
      countryCode as string | undefined
    );

    if (!weatherData) {
      return res.status(503).json({
        status: "unavailable",
        message: "OpenWeather API não configurada ou indisponível"
      });
    }

    res.json({
      status: "success",
      data: weatherData
    });
  } catch (error) {
    logger.error(error, "Erro ao obter dados de clima");
    res.status(500).json({
      status: "error",
      message: "Erro ao obter dados de clima"
    });
  }
});

// GET /api/weather/description - Obter descrição formatada do clima
weatherRouter.get("/description", async (req, res) => {
  try {
    const { city, countryCode } = req.query;
    const description = await getWeatherDescription(
      city as string | undefined,
      countryCode as string | undefined
    );
    res.json({
      status: "success",
      data: { description }
    });
  } catch (error) {
    logger.error(error, "Erro ao obter descrição de clima");
    res.status(500).json({
      status: "error",
      message: "Erro ao obter descrição de clima"
    });
  }
});

// GET /api/weather/tips - Obter dicas baseadas no clima real
weatherRouter.get("/tips", async (req, res) => {
  try {
    const { city, countryCode } = req.query;
    const weatherData = await getWeatherData(
      city as string | undefined,
      countryCode as string | undefined
    );

    if (!weatherData) {
      return res.status(503).json({
        status: "unavailable",
        message: "Dados de clima não disponíveis"
      });
    }

    const finalCity = (city as string) || process.env.OPENWEATHER_CITY || "Sua localização";

    const tips = await generateWeatherTips({
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      location: finalCity,
      conditions: weatherData.conditions
    });

    res.json({
      status: "success",
      data: tips
    });
  } catch (error) {
    logger.error(error, "Erro ao gerar dicas de clima");
    res.status(500).json({
      status: "error",
      message: "Erro ao gerar dicas de clima"
    });
  }
});

// GET /api/weather/history - Obter histórico de clima do InfluxDB
weatherRouter.get("/history", async (req, res) => {
  try {
    const { city, countryCode, range } = req.query;

    if (!city) {
      return res.status(400).json({
        status: "error",
        message: "Parâmetro 'city' é obrigatório"
      });
    }

    const finalCountryCode = (countryCode as string) || "BR";
    const finalRange = (range as string) || "-7d";

    const history = await getWeatherHistory(
      city as string,
      finalCountryCode,
      finalRange
    );

    res.json({
      status: "success",
      data: history
    });
  } catch (error) {
    logger.error(error, "Erro ao obter histórico de clima");
    res.status(500).json({
      status: "error",
      message: "Erro ao obter histórico de clima"
    });
  }
});

// GET /api/weather/stats - Obter estatísticas de clima
weatherRouter.get("/stats", async (req, res) => {
  try {
    const { city, countryCode, range } = req.query;

    if (!city) {
      return res.status(400).json({
        status: "error",
        message: "Parâmetro 'city' é obrigatório"
      });
    }

    const finalCountryCode = (countryCode as string) || "BR";
    const finalRange = (range as string) || "-24h";

    const stats = await getWeatherStats(
      city as string,
      finalCountryCode,
      finalRange
    );

    if (!stats) {
      return res.status(404).json({
        status: "not_found",
        message: "Nenhum dado encontrado para o período especificado"
      });
    }

    res.json({
      status: "success",
      data: stats
    });
  } catch (error) {
    logger.error(error, "Erro ao obter estatísticas de clima");
    res.status(500).json({
      status: "error",
      message: "Erro ao obter estatísticas de clima"
    });
  }
});
