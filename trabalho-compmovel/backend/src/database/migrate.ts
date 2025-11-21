import { getDatabase, saveDB } from "./connection.js";
import { logger } from "../config/logger.js";

export async function migrate() {
  // Com banco JSON, as tabelas são arrays, não precisa criar nada
  // Apenas certifica que o banco está carregado
  const db = getDatabase();

  // Inicializa arrays vazios se não existirem
  if (!db.sensors) db.sensors = [];
  if (!db.readings) db.readings = [];
  if (!db.alerts) db.alerts = [];
  if (!db.thresholds) db.thresholds = [];

  saveDB();
  logger.info("Database inicializado com sucesso");
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

