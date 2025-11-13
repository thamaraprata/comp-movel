import dayjs from "dayjs";
import { z } from "zod";

import { getDatabase } from "../database/connection";
import type { Threshold } from "../types";

const updateThresholdSchema = z.object({
  minValue: z.number().nullable().optional(),
  maxValue: z.number().nullable().optional(),
  unit: z.string().min(1)
});

export function getThresholds(): Threshold[] {
  return getDatabase()
    .prepare(
      `SELECT sensor_type as sensorType, min_value as minValue, max_value as maxValue, unit, updated_at as updatedAt FROM thresholds`
    )
    .all();
}

export function getThresholdByType(sensorType: string) {
  return getDatabase()
    .prepare(
      `SELECT sensor_type as sensorType, min_value as minValue, max_value as maxValue, unit, updated_at as updatedAt FROM thresholds WHERE sensor_type = ?`
    )
    .get(sensorType) as Threshold | undefined;
}

export function updateThreshold(sensorType: string, payload: unknown): Threshold | null {
  const parsed = updateThresholdSchema.safeParse(payload);
  if (!parsed.success) {
    return null;
  }

  const { minValue = null, maxValue = null, unit } = parsed.data;
  const db = getDatabase();
  const updatedAt = dayjs().toISOString();

  db.prepare(
    `INSERT INTO thresholds (sensor_type, min_value, max_value, unit, updated_at)
     VALUES (@sensorType, @minValue, @maxValue, @unit, @updatedAt)
     ON CONFLICT(sensor_type)
     DO UPDATE SET min_value = excluded.min_value,
                   max_value = excluded.max_value,
                   unit = excluded.unit,
                   updated_at = excluded.updated_at`
  ).run({ sensorType, minValue, maxValue, unit, updatedAt });

  return {
    sensorType: sensorType as Threshold["sensorType"],
    minValue,
    maxValue,
    unit,
    updatedAt
  };
}

