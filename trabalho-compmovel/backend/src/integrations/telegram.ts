import { Telegraf, Context } from "telegraf";
import axios from "axios";
import { logger } from "../config/logger.js";
import { generateWeatherTips } from "./gemini.js";
import { getCurrentWeatherRecord, getWeatherHistory } from "../services/weatherScheduler.js";
import { getWeatherData } from "./openweather.js";
import { CITIES } from "../config/cities.js";
import * as chatService from "../services/chatService.js";
import { pool } from "../database/postgres.js";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DEFAULT_CITY = process.env.OPENWEATHER_CITY || "São Paulo";
const DEFAULT_COUNTRY_CODE = process.env.OPENWEATHER_COUNTRY_CODE || "BR";

let bot: Telegraf | null = null;

export interface TelegramUser {
  id: number;
  firstName: string;
  username?: string;
  city: string;
  countryCode: string;
}

const telegramUsers = new Map<number, TelegramUser>();

// Helper para obter emoji baseado nas condições climáticas
function getWeatherEmoji(conditions: string): string {
  const lower = conditions.toLowerCase();
  if (lower.includes("chuva") || lower.includes("rain")) return "🌧️";
  if (lower.includes("nuvem") || lower.includes("cloud") || lower.includes("nublado")) return "☁️";
  if (lower.includes("sol") || lower.includes("sunny") || lower.includes("clear") || lower.includes("limpo")) return "☀️";
  if (lower.includes("nevoeiro") || lower.includes("fog") || lower.includes("neblina")) return "🌫️";
  if (lower.includes("neve") || lower.includes("snow")) return "❄️";
  if (lower.includes("tempestade") || lower.includes("storm")) return "⛈️";
  return "🌤️";
}

export async function initTelegramBot(): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) {
    logger.warn("TELEGRAM_BOT_TOKEN not configured");
    return;
  }

  bot = new Telegraf(TELEGRAM_BOT_TOKEN);

  bot.command("start", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const firstName = ctx.from?.first_name || "amigo";

    if (userId) {
      telegramUsers.set(userId, {
        id: userId,
        firstName: ctx.from?.first_name || "User",
        username: ctx.from?.username,
        city: DEFAULT_CITY,
        countryCode: DEFAULT_COUNTRY_CODE
      });
    }

    const welcomeMsg = `🌤️ *Olá, ${firstName}!* Bem-vindo ao Bot de Clima\n\n` +
      `Receba informações climáticas e dicas personalizadas!\n\n` +
      `📍 *Sua cidade atual:* ${DEFAULT_CITY}\n\n` +
      `*Comandos disponíveis:*\n` +
      `🌡️ /clima - Clima atual\n` +
      `💡 /dicas - Dicas personalizadas com IA\n` +
      `📊 /historico - Últimas 24 horas\n` +
      `📈 /stats - Estatísticas do dia\n` +
      `📍 /cidade - Trocar cidade\n` +
      `🏙️ /cidades - Ver cidades disponíveis\n` +
      `❓ /ajuda - Ajuda completa\n\n` +
      `Use /cidade para escolher sua cidade!`;

    await ctx.reply(welcomeMsg, { parse_mode: "Markdown" });
  });

  bot.command("vincular", async (ctx: Context) => {
    const chatId = ctx.chat?.id;
    const args = ctx.message?.text?.split(" ");
    const code = args?.[1];

    if (!code) {
      await ctx.reply(
        "❌ *Uso incorreto!*\n\n" +
        "Para vincular sua conta, use:\n" +
        "`/vincular SEU_CODIGO`\n\n" +
        "Exemplo: `/vincular 123456`\n\n" +
        "Gere seu código no aplicativo web!",
        { parse_mode: "Markdown" }
      );
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      await ctx.reply("❌ Código inválido! O código deve ter 6 dígitos.");
      return;
    }

    try {
      await ctx.reply("🔄 Verificando código...");

      const response = await axios.post("http://localhost:3334/api/auth/verify-telegram-code", {
        code,
        telegramChatId: chatId
      });

      const { user } = response.data.data;

      await ctx.reply(
        `✅ *Conta vinculada com sucesso!*\n\n` +
        `👤 Nome: ${user.name}\n` +
        `📧 Email: ${user.email}\n\n` +
        `Agora você pode usar o chat aqui e na web! 🎉`,
        { parse_mode: "Markdown" }
      );
    } catch (error: any) {
      logger.error(error, "Erro ao vincular Telegram");
      await ctx.reply("❌ Código inválido ou expirado. Gere um novo código no aplicativo web.");
    }
  });

  bot.command("clima", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const user = userId ? telegramUsers.get(userId) : null;
    const city = user?.city || DEFAULT_CITY;
    const countryCode = user?.countryCode || DEFAULT_COUNTRY_CODE;

    try {
      await ctx.reply("🔄 Buscando dados do clima...");

      // Tentar obter do histórico primeiro
      let record = getCurrentWeatherRecord(city, countryCode);

      // Se não tiver no histórico, buscar direto da API
      if (!record) {
        const weatherData = await getWeatherData(city, countryCode);
        if (weatherData) {
          record = {
            city,
            countryCode,
            data: weatherData,
            timestamp: Date.now(),
            tips: []
          };
        }
      }

      if (!record) {
        await ctx.reply(`❌ Não foi possível obter dados para ${city}`);
        return;
      }

      const data = record.data;
      const tempEmoji = data.temperature > 25 ? "🌡️" : data.temperature < 15 ? "❄️" : "🌤️";
      const conditionEmoji = getWeatherEmoji(data.conditions);

      const msg = `${conditionEmoji} *Clima em ${city}*\n\n` +
        `${tempEmoji} *Temperatura:* ${data.temperature}°C\n` +
        `🌡️ *Sensação:* ${data.feelsLike}°C\n` +
        `💧 *Umidade:* ${data.humidity}%\n` +
        `💨 *Vento:* ${data.windSpeed} km/h\n` +
        `☁️ *Condições:* ${data.conditions}\n\n` +
        `🕐 Atualizado: ${new Date(record.timestamp).toLocaleTimeString("pt-BR")}`;

      await ctx.reply(msg, { parse_mode: "Markdown" });
    } catch (error) {
      logger.error(error, "Error in /clima command");
      await ctx.reply("❌ Erro ao buscar clima. Tente novamente.");
    }
  });

  bot.command("dicas", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const user = userId ? telegramUsers.get(userId) : null;
    const city = user?.city || DEFAULT_CITY;
    const countryCode = user?.countryCode || DEFAULT_COUNTRY_CODE;

    try {
      await ctx.reply("🤖 Gerando dicas personalizadas com IA...");

      // Buscar dados do clima
      let record = getCurrentWeatherRecord(city, countryCode);
      if (!record) {
        const weatherData = await getWeatherData(city, countryCode);
        if (weatherData) {
          record = {
            city,
            countryCode,
            data: weatherData,
            timestamp: Date.now(),
            tips: []
          };
        }
      }

      if (!record) {
        await ctx.reply(`❌ Não foi possível obter dados para ${city}`);
        return;
      }

      // Gerar dicas com IA
      const tips = await generateWeatherTips({
        temperature: record.data.temperature,
        humidity: record.data.humidity,
        location: city,
        conditions: record.data.conditions
      });

      if (!tips || tips.length === 0) {
        await ctx.reply("❌ Não foi possível gerar dicas no momento.");
        return;
      }

      let msg = `💡 *Dicas Personalizadas para ${city}*\n`;
      msg += `🌡️ ${record.data.temperature}°C • 💧 ${record.data.humidity}%\n\n`;

      tips.forEach((tip, index) => {
        const priorityEmoji = tip.priority === "high" ? "🔴" : tip.priority === "medium" ? "🟡" : "🟢";
        msg += `${tip.icon} *${tip.title}* ${priorityEmoji}\n`;
        msg += `${tip.description}\n\n`;

        if (tip.actions && tip.actions.length > 0) {
          msg += `✅ *Ações:*\n`;
          tip.actions.forEach(action => {
            msg += `  • ${action}\n`;
          });
          msg += `\n`;
        }

        // Separador entre dicas (exceto última)
        if (index < tips.length - 1) {
          msg += `━━━━━━━━━━━━━\n\n`;
        }
      });

      msg += `\n🤖 _Gerado por IA Gemini_`;

      await ctx.reply(msg, { parse_mode: "Markdown" });
    } catch (error) {
      logger.error(error, "Error in /dicas command");
      await ctx.reply("❌ Erro ao gerar dicas. Tente novamente.");
    }
  });

  bot.command("historico", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const user = userId ? telegramUsers.get(userId) : null;
    const city = user?.city || DEFAULT_CITY;
    const countryCode = user?.countryCode || DEFAULT_COUNTRY_CODE;

    try {
      const history = getWeatherHistory(city, countryCode);
      if (history.length === 0) {
        await ctx.reply(`No history for ${city}`);
        return;
      }
      let msg = `History for ${city} (${history.length} records)\n\n`;
      const recent = history.slice(-5);
      recent.forEach((r: any) => {
        const time = new Date(r.timestamp).toLocaleTimeString("pt-BR");
        msg += `${time}: ${r.data.temperature}C\n`;
      });
      await ctx.reply(msg);
    } catch (error) {
      await ctx.reply("Error getting history");
    }
  });

  bot.command("stats", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const user = userId ? telegramUsers.get(userId) : null;
    const city = user?.city || DEFAULT_CITY;
    const countryCode = user?.countryCode || DEFAULT_COUNTRY_CODE;

    try {
      const history = getWeatherHistory(city, countryCode);
      if (history.length === 0) {
        await ctx.reply(`No data for ${city}`);
        return;
      }
      const temps: number[] = history.map((r: any) => r.data.temperature);
      const min = Math.min(...temps);
      const max = Math.max(...temps);
      const avg = Math.round((temps.reduce((a: number, b: number) => a + b, 0) / temps.length) * 10) / 10;
      const msg = `Stats for ${city}\n\nMin: ${min}C\nMax: ${max}C\nAvg: ${avg}C`;
      await ctx.reply(msg);
    } catch (error) {
      await ctx.reply("Error getting stats");
    }
  });

  bot.command("ajuda", async (ctx: Context) => {
    const helpMsg = `📖 *Guia Completo do Bot*\n\n` +
      `*Comandos de Clima:*\n` +
      `🌡️ /clima - Ver clima atual da sua cidade\n` +
      `💡 /dicas - Dicas personalizadas com IA\n` +
      `📊 /historico - Últimas 5 leituras\n` +
      `📈 /stats - Estatísticas do dia (min/max/média)\n\n` +
      `*Configuração:*\n` +
      `📍 /cidade - Ver ou trocar cidade\n` +
      `🏙️ /cidades - Lista de cidades disponíveis\n\n` +
      `*Outros:*\n` +
      `❓ /ajuda - Este guia\n` +
      `/start - Reiniciar bot\n\n` +
      `*Dicas de Uso:*\n` +
      `• Use /cidade primeiro para escolher sua localização\n` +
      `• As dicas são geradas com IA e incluem lugares específicos da cidade\n` +
      `• Dados atualizados a cada 5 minutos\n\n` +
      `🤖 _Bot desenvolvido com Node.js + Gemini AI_`;

    await ctx.reply(helpMsg, { parse_mode: "Markdown" });
  });

  bot.command("cidades", async (ctx: Context) => {
    try {
      let msg = `🏙️ *Cidades Disponíveis*\n\n`;
      msg += `Use /cidade [nome] para trocar\n\n`;

      const regions = {
        "🌍 Nordeste": ['BA', 'CE', 'PE', 'AL', 'PI', 'MA', 'RN', 'PB', 'SE'],
        "🏢 Centro-Oeste": ['DF', 'GO', 'MT', 'MS'],
        "🌳 Norte": ['AM', 'PA', 'RR', 'AP', 'TO', 'RO', 'AC'],
        "🏙️ Sudeste": ['SP', 'RJ', 'MG', 'ES'],
        "⛰️ Sul": ['PR', 'RS', 'SC']
      };

      for (const [region, states] of Object.entries(regions)) {
        msg += `*${region}*\n`;
        const citiesInRegion = CITIES.filter(c => states.includes(c.state));
        citiesInRegion.forEach(city => {
          msg += `  • ${city.name} (${city.state})\n`;
        });
        msg += `\n`;
      }

      msg += `\n💡 _Exemplo:_ /cidade Goiânia`;

      await ctx.reply(msg, { parse_mode: "Markdown" });
    } catch (error) {
      logger.error(error, "Error in /cidades command");
      await ctx.reply("❌ Erro ao listar cidades.");
    }
  });

  bot.command("cidade", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const text = ctx.message?.text || "";
    const args = text.split(" ").slice(1).join(" ").trim();

    if (!args || args.length === 0) {
      const currentCity = userId ? telegramUsers.get(userId)?.city : DEFAULT_CITY;
      await ctx.reply(
        `📍 *Sua cidade atual:* ${currentCity}\n\n` +
        `Para trocar, use:\n` +
        `/cidade [nome da cidade]\n\n` +
        `Exemplo: /cidade Goiânia\n\n` +
        `Use /cidades para ver todas disponíveis`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Verificar se a cidade existe
    const cityExists = CITIES.find(c =>
      c.name.toLowerCase() === args.toLowerCase()
    );

    if (!cityExists) {
      await ctx.reply(
        `❌ Cidade "${args}" não encontrada.\n\n` +
        `Use /cidades para ver cidades disponíveis.`
      );
      return;
    }

    if (userId) {
      const user = telegramUsers.get(userId);
      if (user) {
        user.city = cityExists.name;
      } else {
        telegramUsers.set(userId, {
          id: userId,
          firstName: ctx.from?.first_name || "User",
          username: ctx.from?.username,
          city: cityExists.name,
          countryCode: DEFAULT_COUNTRY_CODE
        });
      }
    }

    await ctx.reply(
      `✅ *Cidade alterada para:* ${cityExists.name} (${cityExists.state})\n\n` +
      `Use /clima ou /dicas para ver informações!`,
      { parse_mode: "Markdown" }
    );
  });

  bot.on("text", async (ctx: Context) => {
    const chatId = ctx.chat?.id;
    const text = ctx.message?.text;

    if (!chatId || !text || text.startsWith("/")) {
      return; // Ignorar comandos
    }

    try {
      // Buscar usuário vinculado
      const userResult = await pool.query(
        "SELECT id FROM users WHERE telegram_chat_id = $1",
        [chatId]
      );

      if (userResult.rows.length === 0) {
        await ctx.reply(
          "❌ Conta não vinculada!\n\n" +
          "Use /vincular para vincular sua conta do aplicativo web."
        );
        return;
      }

      const userId = userResult.rows[0].id;

      // Enviar "digitando..."
      await ctx.sendChatAction("typing");

      // Processar mensagem através do chatService
      const result = await chatService.processMessage(userId, text, undefined, "telegram");

      // Enviar resposta
      await ctx.reply(result.aiResponse);
    } catch (error) {
      logger.error(error, "Erro ao processar mensagem do Telegram");
      await ctx.reply("❌ Desculpe, tive um erro ao processar sua mensagem.");
    }
  });

  bot.launch();
  logger.info("Telegram bot started");

  process.once("SIGINT", () => bot?.stop("SIGINT"));
  process.once("SIGTERM", () => bot?.stop("SIGTERM"));
}

export function getTelegramBot(): Telegraf | null {
  return bot;
}

export function getTelegramUser(userId: number): TelegramUser | undefined {
  return telegramUsers.get(userId);
}

export function getAllTelegramUsers(): TelegramUser[] {
  return Array.from(telegramUsers.values());
}

export async function sendTelegramAlert(alert: any): Promise<void> {
  if (!bot || telegramUsers.size === 0) {
    return;
  }

  const message = `🚨 ALERT\n\nSensor: ${alert.sensorType}\nSeverity: ${alert.severity}\nMessage: ${alert.message}\nValue: ${alert.value}\nThreshold: ${alert.threshold}`;

  for (const user of telegramUsers.values()) {
    try {
      await bot.telegram.sendMessage(user.id, message);
    } catch (error) {
      logger.error(`Failed to send alert to user ${user.id}`, error);
    }
  }
}

export async function sendTelegramMessage(message: string, chatId?: number): Promise<void> {
  if (!bot) {
    logger.warn("Telegram bot not initialized");
    return;
  }

  if (chatId) {
    try {
      await bot.telegram.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
      logger.error(`Failed to send message to chat ${chatId}`, error);
    }
  } else {
    for (const user of telegramUsers.values()) {
      try {
        await bot.telegram.sendMessage(user.id, message, { parse_mode: "Markdown" });
      } catch (error) {
        logger.error(`Failed to send message to user ${user.id}`, error);
      }
    }
  }
}
