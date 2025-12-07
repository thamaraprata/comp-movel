import { Telegraf, Context } from "telegraf";
import { logger } from "../config/logger";
import { getGeminiTips } from "./gemini";
import { getCurrentWeatherRecord, getWeatherHistory } from "../services/weatherScheduler";

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

export async function initTelegramBot(): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) {
    logger.warn("TELEGRAM_BOT_TOKEN not configured");
    return;
  }

  bot = new Telegraf(TELEGRAM_BOT_TOKEN);

  bot.command("start", async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (userId) {
      telegramUsers.set(userId, {
        id: userId,
        firstName: ctx.from?.first_name || "User",
        username: ctx.from?.username,
        city: DEFAULT_CITY,
        countryCode: DEFAULT_COUNTRY_CODE
      });
    }
    await ctx.reply("Welcome to Weather Bot!\n\nCommands: /clima /dicas /historico /stats /cidade /ajuda");
  });

  bot.command("clima", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const user = userId ? telegramUsers.get(userId) : null;
    const city = user?.city || DEFAULT_CITY;
    const countryCode = user?.countryCode || DEFAULT_COUNTRY_CODE;

    try {
      const record = getCurrentWeatherRecord(city, countryCode);
      if (!record) {
        await ctx.reply(`No data for ${city}`);
        return;
      }
      const data = record.data;
      const msg = `Weather in ${city}\n\nTemp: ${data.temperature}C\nFeel: ${data.feelsLike}C\nWind: ${data.windSpeed} km/h\nHumidity: ${data.humidity}%\nConditions: ${data.conditions}`;
      await ctx.reply(msg);
    } catch (error) {
      await ctx.reply("Error getting weather");
    }
  });

  bot.command("dicas", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const user = userId ? telegramUsers.get(userId) : null;
    const city = user?.city || DEFAULT_CITY;
    const countryCode = user?.countryCode || DEFAULT_COUNTRY_CODE;

    try {
      const record = getCurrentWeatherRecord(city, countryCode);
      if (!record || !record.tips || record.tips.length === 0) {
        await ctx.reply("No tips available");
        return;
      }
      let msg = `Tips for ${city}:\n\n`;
      record.tips.forEach((tip: string) => {
        msg += `- ${tip}\n`;
      });
      await ctx.reply(msg);
    } catch (error) {
      await ctx.reply("Error getting tips");
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
    await ctx.reply("Help:\n\n/clima - Current weather\n/dicas - Weather tips\n/historico - Last 24h\n/stats - Statistics\n/cidade - Change city\n/ajuda - This help");
  });

  bot.command("cidade", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const text = ctx.message?.text || "";
    const args = text.split(" ").slice(1).join(" ");

    if (!args || args.trim().length === 0) {
      await ctx.reply("Usage: /cidade Rio de Janeiro");
      return;
    }

    if (userId) {
      const user = telegramUsers.get(userId);
      if (user) {
        user.city = args;
      } else {
        telegramUsers.set(userId, {
          id: userId,
          firstName: ctx.from?.first_name || "User",
          username: ctx.from?.username,
          city: args,
          countryCode: DEFAULT_COUNTRY_CODE
        });
      }
    }
    await ctx.reply(`City set to: ${args}`);
  });

  bot.on("message", async (ctx: Context) => {
    await ctx.reply("Use /ajuda for commands");
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
