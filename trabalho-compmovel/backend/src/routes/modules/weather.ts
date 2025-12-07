import { Router } from "express";
import { getWeatherData, getWeatherDescription } from "../../integrations/openweather";
import { generateWeatherTips } from "../../integrations/gemini";
import { getWeatherHistory, getCurrentWeatherRecord, updateWeatherForCity } from "../../services/weatherScheduler";
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
    const finalCity = (city as string) || process.env.OPENWEATHER_CITY || "São Paulo";
    const finalCountryCode = (countryCode as string) || "BR";

    // Tentar buscar do histórico (últimas 24h), caso contrário buscar direto da API
    let record = getCurrentWeatherRecord(finalCity, finalCountryCode);

    if (!record) {
      // Se não tiver no histórico, buscar direto e retornar
      const weatherData = await getWeatherData(finalCity, finalCountryCode);
      if (!weatherData) {
        return res.status(503).json({
          status: "unavailable",
          message: "OpenWeather API não configurada ou indisponível"
        });
      }

      return res.json({
        status: "success",
        data: {
          city: finalCity,
          countryCode: finalCountryCode,
          data: weatherData,
          timestamp: Date.now(),
          tips: []
        }
      });
    }

    res.json({
      status: "success",
      data: record
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

// GET /api/weather/history - Obter histórico de clima (últimas 24h)
weatherRouter.get("/history", async (req, res) => {
  try {
    const { city, countryCode } = req.query;

    const finalCity = (city as string) || process.env.OPENWEATHER_CITY || "São Paulo";
    const finalCountryCode = (countryCode as string) || "BR";

    const history = getWeatherHistory(finalCity, finalCountryCode);

    res.json({
      status: "success",
      data: history,
      count: history.length
    });
  } catch (error) {
    logger.error(error, "Erro ao obter histórico de clima");
    res.status(500).json({
      status: "error",
      message: "Erro ao obter histórico de clima"
    });
  }
});

// GET /api/weather/stats - Obter estatísticas de clima (últimas 24h)
weatherRouter.get("/stats", async (req, res) => {
  try {
    const { city, countryCode } = req.query;

    const finalCity = (city as string) || process.env.OPENWEATHER_CITY || "São Paulo";
    const finalCountryCode = (countryCode as string) || "BR";

    const history = getWeatherHistory(finalCity, finalCountryCode);

    if (history.length === 0) {
      return res.status(404).json({
        status: "not_found",
        message: "Nenhum dado encontrado"
      });
    }

    // Calcular estatísticas
    const temperatures = history.map((r) => r.data.temperature);
    const humidities = history.map((r) => r.data.humidity);
    const windSpeeds = history.map((r) => r.data.windSpeed);

    const stats = {
      temperature: {
        min: Math.min(...temperatures),
        max: Math.max(...temperatures),
        avg: Math.round((temperatures.reduce((a, b) => a + b, 0) / temperatures.length) * 10) / 10
      },
      humidity: {
        min: Math.min(...humidities),
        max: Math.max(...humidities),
        avg: Math.round((humidities.reduce((a, b) => a + b, 0) / humidities.length) * 10) / 10
      },
      windSpeed: {
        min: Math.min(...windSpeeds),
        max: Math.max(...windSpeeds),
        avg: Math.round((windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length) * 10) / 10
      },
      recordCount: history.length,
      timespan: {
        start: history[0].timestamp,
        end: history[history.length - 1].timestamp
      }
    };

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

// POST /api/weather/refresh - Forçar atualização de dados climáticos
weatherRouter.post("/refresh", async (req, res) => {
  try {
    const { city, countryCode } = req.query;

    const finalCity = (city as string) || process.env.OPENWEATHER_CITY || "São Paulo";
    const finalCountryCode = (countryCode as string) || "BR";

    await updateWeatherForCity(finalCity, finalCountryCode);

    res.json({
      status: "success",
      message: "Dados de clima atualizados"
    });
  } catch (error) {
    logger.error(error, "Erro ao atualizar dados de clima");
    res.status(500).json({
      status: "error",
      message: "Erro ao atualizar dados de clima"
    });
  }
});
