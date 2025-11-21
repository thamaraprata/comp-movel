import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // API
  port: parseInt(process.env.PORT || '3333', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',

  // MQTT
  mqtt: {
    url: process.env.MQTT_URL || 'mqtt://localhost:1883',
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    sensorTopic: process.env.MQTT_SENSOR_TOPIC || 'sensors/+/data',
    alertTopic: 'alerts/{sensorId}',
  },

  // Database
  database: {
    path: process.env.DATABASE_PATH || './data/monitoring.db',
  },

  // Telegram (futuro)
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },

  // Google Gemini
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
};
