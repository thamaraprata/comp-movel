import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { logger } from '../config/logger';

const INFLUXDB_URL = process.env.INFLUXDB_URL || 'http://localhost:8086';
const INFLUXDB_TOKEN = process.env.INFLUXDB_TOKEN || '';
const INFLUXDB_ORG = process.env.INFLUXDB_ORG || 'myorg';
const INFLUXDB_BUCKET = process.env.INFLUXDB_BUCKET || 'weather';

let influxDB: InfluxDB | null = null;

export function initInfluxDB(): InfluxDB {
  if (influxDB) {
    return influxDB;
  }

  if (!INFLUXDB_TOKEN) {
    logger.warn('InfluxDB token not configured. InfluxDB features will be disabled.');
    return null as any;
  }

  try {
    influxDB = new InfluxDB({
      url: INFLUXDB_URL,
      token: INFLUXDB_TOKEN,
      org: INFLUXDB_ORG,
    });

    logger.info({ url: INFLUXDB_URL }, 'InfluxDB client initialized');
    return influxDB;
  } catch (error) {
    logger.error(error, 'Failed to initialize InfluxDB');
    throw error;
  }
}

export function getInfluxDB(): InfluxDB {
  if (!influxDB) {
    return initInfluxDB();
  }
  return influxDB;
}

export interface WeatherDataPoint {
  city: string;
  countryCode: string;
  temperature: number;
  humidity: number;
  conditions: string;
  windSpeed: number;
  feelsLike: number;
  timestamp?: Date;
}

/**
 * Salvar dados de clima no InfluxDB
 */
export async function saveWeatherData(data: WeatherDataPoint): Promise<void> {
  try {
    const db = getInfluxDB();
    if (!db) {
      logger.warn('InfluxDB not configured, skipping write');
      return;
    }

    const writeApi = db.getWriteApi(INFLUXDB_ORG, INFLUXDB_BUCKET, 'ns');

    const point = new Point('weather')
      .tag('city', data.city)
      .tag('countryCode', data.countryCode)
      .floatField('temperature', data.temperature)
      .intField('humidity', data.humidity)
      .stringField('conditions', data.conditions)
      .floatField('windSpeed', data.windSpeed)
      .floatField('feelsLike', data.feelsLike)
      .timestamp(data.timestamp || new Date());

    writeApi.writePoint(point);
    await writeApi.close();

    logger.debug(
      { city: data.city, temperature: data.temperature },
      'Weather data saved to InfluxDB'
    );
  } catch (error) {
    logger.error(error, 'Failed to save weather data to InfluxDB');
  }
}

/**
 * Buscar histórico de clima por cidade
 */
export async function getWeatherHistory(
  city: string,
  countryCode: string,
  range: string = '-7d' // últimos 7 dias por padrão
): Promise<WeatherDataPoint[]> {
  try {
    const db = getInfluxDB();
    if (!db) {
      logger.warn('InfluxDB not configured, returning empty history');
      return [];
    }

    const queryApi = db.getQueryApi(INFLUXDB_ORG);

    const fluxQuery = `
      from(bucket: "${INFLUXDB_BUCKET}")
        |> range(start: ${range})
        |> filter(fn: (r) => r._measurement == "weather")
        |> filter(fn: (r) => r.city == "${city}")
        |> filter(fn: (r) => r.countryCode == "${countryCode}")
        |> sort(columns: ["_time"])
    `;

    const data: WeatherDataPoint[] = [];
    let lastRow: any = null;

    return new Promise((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row: string[], tableMeta: any) {
          const obj = tableMeta.toObject(row);
          const field = obj._field;
          const value = obj._value;
          const time = new Date(obj._time);

          // Agrupar campos do mesmo timestamp
          if (!lastRow || lastRow.timestamp.getTime() !== time.getTime()) {
            if (lastRow) {
              data.push(lastRow);
            }
            lastRow = {
              city,
              countryCode,
              timestamp: time,
              temperature: 0,
              humidity: 0,
              conditions: '',
              windSpeed: 0,
              feelsLike: 0,
            };
          }

          if (field === 'temperature') lastRow.temperature = value;
          if (field === 'humidity') lastRow.humidity = value;
          if (field === 'conditions') lastRow.conditions = value;
          if (field === 'windSpeed') lastRow.windSpeed = value;
          if (field === 'feelsLike') lastRow.feelsLike = value;
        },
        error(error: Error) {
          logger.error(error, 'Error querying weather history from InfluxDB');
          reject(error);
        },
        complete() {
          if (lastRow) {
            data.push(lastRow);
          }
          resolve(data);
        },
      });
    });
  } catch (error) {
    logger.error(error, 'Failed to get weather history from InfluxDB');
    return [];
  }
}

/**
 * Buscar últimas N horas/dias
 */
export async function getWeatherStats(
  city: string,
  countryCode: string,
  range: string = '-24h'
): Promise<{
  avgTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  avgHumidity: number;
  lastUpdate: Date | null;
} | null> {
  try {
    const history = await getWeatherHistory(city, countryCode, range);

    if (history.length === 0) {
      return null;
    }

    const temperatures = history.map(h => h.temperature);
    const humidities = history.map(h => h.humidity);

    return {
      avgTemperature: Math.round((temperatures.reduce((a, b) => a + b) / temperatures.length) * 10) / 10,
      maxTemperature: Math.max(...temperatures),
      minTemperature: Math.min(...temperatures),
      avgHumidity: Math.round((humidities.reduce((a, b) => a + b) / humidities.length) * 10) / 10,
      lastUpdate: history[history.length - 1].timestamp || null,
    };
  } catch (error) {
    logger.error(error, 'Failed to get weather stats from InfluxDB');
    return null;
  }
}
