import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";

import { ENV } from "../config/env.js";
import { logger } from "../config/logger.js";

interface Database {
  sensors: any[];
  readings: any[];
  alerts: any[];
  thresholds: any[];
}

let db: Database | null = null;

function loadDatabase(): Database {
  const dbPath = ENV.DATABASE_PATH;
  mkdirSync(dirname(dbPath), { recursive: true });

  if (existsSync(dbPath)) {
    try {
      const content = readFileSync(dbPath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      logger.warn("Erro ao carregar banco, criando novo");
    }
  }

  return {
    sensors: [],
    readings: [],
    alerts: [],
    thresholds: []
  };
}

function saveDatabase(database: Database) {
  const dbPath = ENV.DATABASE_PATH;
  mkdirSync(dirname(dbPath), { recursive: true });
  writeFileSync(dbPath, JSON.stringify(database, null, 2));
}

export function getDatabase() {
  if (!db) {
    db = loadDatabase();
    logger.info({ dbPath: ENV.DATABASE_PATH }, "Database carregado");
  }
  return db;
}

export function saveDB() {
  if (db) {
    saveDatabase(db);
  }
}

export function closeDatabase() {
  if (db) {
    saveDatabase(db);
    db = null;
  }
}

