import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  MQTT_URL: z.string().default("mqtt://localhost:1883"),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),
  MQTT_SENSOR_TOPIC: z.string().default("sensors/+/data"),
  DATABASE_PATH: z.string().default("./data/monitoring.db"),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  GEMINI_API_KEY: z.string().optional()
});

const env = envSchema.parse(process.env);

export const ENV = {
  ...env,
  isProduction: env.NODE_ENV === "production",
  isDevelopment: env.NODE_ENV === "development",
  isTest: env.NODE_ENV === "test"
};

