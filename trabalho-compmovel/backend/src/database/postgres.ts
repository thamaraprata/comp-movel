import pkg from 'pg';
const { Pool } = pkg;
import { logger } from "../config/logger.js";

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'weather_db',
  user: process.env.POSTGRES_USER || 'weather_user',
  password: process.env.POSTGRES_PASSWORD || 'weather_pass_123',
  max: 20, // máximo de conexões
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Testar conexão
pool.on('connect', () => {
  logger.debug('PostgreSQL: Nova conexão criada');
});

pool.on('error', (err) => {
  logger.error(err, 'PostgreSQL: Erro inesperado');
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('PostgreSQL conectado com sucesso', {
      time: result.rows[0].now
    });
    return true;
  } catch (error) {
    logger.error(error, 'PostgreSQL: Falha ao conectar');
    return false;
  }
}

// Funções para weather_records
export interface WeatherRecord {
  id?: number;
  city: string;
  country_code: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  conditions: string;
  timestamp?: Date;
  created_at?: Date;
}

export interface WeatherTip {
  id?: number;
  weather_record_id: number;
  city: string;
  title: string;
  description: string;
  icon?: string;
  priority: 'low' | 'medium' | 'high';
  actions?: string[];
  created_at?: Date;
}

export async function insertWeatherRecord(record: WeatherRecord): Promise<number | null> {
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO weather_records (
        city, country_code, temperature, feels_like,
        humidity, wind_speed, conditions, timestamp
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

    const values = [
      record.city,
      record.country_code,
      record.temperature,
      record.feels_like,
      record.humidity,
      record.wind_speed,
      record.conditions,
      record.timestamp || new Date()
    ];

    const result = await client.query(query, values);
    logger.debug(`Registro climático salvo: ${record.city} - ${record.temperature}°C`);
    return result.rows[0].id;
  } catch (error) {
    logger.error(error, 'Erro ao inserir registro climático');
    return null;
  } finally {
    client.release();
  }
}

export async function insertWeatherTips(tips: WeatherTip[]): Promise<boolean> {
  if (tips.length === 0) return true;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const query = `
      INSERT INTO weather_tips (
        weather_record_id, city, title, description,
        icon, priority, actions
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    for (const tip of tips) {
      const values = [
        tip.weather_record_id,
        tip.city,
        tip.title,
        tip.description,
        tip.icon || '',
        tip.priority,
        JSON.stringify(tip.actions || [])
      ];
      await client.query(query, values);
    }

    await client.query('COMMIT');
    logger.debug(`${tips.length} dicas salvas para ${tips[0].city}`);
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(error, 'Erro ao inserir dicas');
    return false;
  } finally {
    client.release();
  }
}

export async function getWeatherHistory(
  city: string,
  hours: number = 24
): Promise<WeatherRecord[]> {
  const client = await pool.connect();
  try {
    const query = `
      SELECT *
      FROM weather_records
      WHERE city = $1
        AND timestamp >= NOW() - INTERVAL '${hours} hours'
      ORDER BY timestamp DESC
      LIMIT 100
    `;

    const result = await client.query(query, [city]);
    return result.rows;
  } catch (error) {
    logger.error(error, `Erro ao buscar histórico de ${city}`);
    return [];
  } finally {
    client.release();
  }
}

export async function getLatestWeatherRecord(city: string): Promise<WeatherRecord | null> {
  const client = await pool.connect();
  try {
    const query = `
      SELECT *
      FROM weather_records
      WHERE city = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const result = await client.query(query, [city]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error(error, `Erro ao buscar último registro de ${city}`);
    return null;
  } finally {
    client.release();
  }
}

export async function getWeatherStats(
  city: string,
  days: number = 1
): Promise<any> {
  const client = await pool.connect();
  try {
    const query = `
      SELECT
        MIN(temperature) as temp_min,
        MAX(temperature) as temp_max,
        ROUND(AVG(temperature)::numeric, 2) as temp_avg,
        MIN(humidity) as humidity_min,
        MAX(humidity) as humidity_max,
        ROUND(AVG(humidity)::numeric, 2) as humidity_avg,
        MAX(wind_speed) as wind_speed_max,
        COUNT(*) as record_count
      FROM weather_records
      WHERE city = $1
        AND timestamp >= NOW() - INTERVAL '${days} days'
    `;

    const result = await client.query(query, [city]);
    return result.rows[0];
  } catch (error) {
    logger.error(error, `Erro ao buscar estatísticas de ${city}`);
    return null;
  } finally {
    client.release();
  }
}

export async function deleteOldRecords(days: number = 30): Promise<number> {
  const client = await pool.connect();
  try {
    const query = `
      DELETE FROM weather_records
      WHERE timestamp < NOW() - INTERVAL '${days} days'
    `;

    const result = await client.query(query);
    const deletedCount = result.rowCount || 0;

    if (deletedCount > 0) {
      logger.info(`${deletedCount} registros antigos removidos (>${days} dias)`);
    }

    return deletedCount;
  } catch (error) {
    logger.error(error, 'Erro ao deletar registros antigos');
    return 0;
  } finally {
    client.release();
  }
}

export { pool };
