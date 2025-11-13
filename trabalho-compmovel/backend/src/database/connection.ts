import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { ENV } from "../config/env";
import { logger } from "../config/logger";

let db: Database.Database | null = null;

export function getDatabase() {
  if (!db) {
    const dbPath = ENV.DATABASE_PATH;
    mkdirSync(dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    logger.info({ dbPath }, "SQLite conectado");
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

