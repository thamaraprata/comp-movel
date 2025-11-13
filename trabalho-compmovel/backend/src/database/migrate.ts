import { getDatabase } from "./connection";
import { logger } from "../config/logger";

const MIGRATIONS = [
  `
    CREATE TABLE IF NOT EXISTS sensors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      type TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS readings (
      id TEXT PRIMARY KEY,
      sensor_id TEXT NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(sensor_id) REFERENCES sensors(id)
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      sensor_id TEXT NOT NULL,
      sensor_type TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL,
      value REAL NOT NULL,
      threshold REAL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      FOREIGN KEY(sensor_id) REFERENCES sensors(id)
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS thresholds (
      sensor_type TEXT PRIMARY KEY,
      min_value REAL,
      max_value REAL,
      unit TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `
];

export async function migrate() {
  const db = getDatabase();
  db.transaction(() => {
    for (const migration of MIGRATIONS) {
      db.exec(migration);
    }
  })();
  logger.info("Migrations executadas com sucesso");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error(error, "Erro ao executar migrations");
      process.exit(1);
    });
}

