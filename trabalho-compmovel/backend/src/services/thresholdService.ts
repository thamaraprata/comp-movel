import dayjs from "dayjs";
import { z } from "zod";

import { getDatabase, saveDB } from "../database/connection.js";
import type { Threshold } from "../types/index.js";

const updateThresholdSchema = z.object({
  minValue: z.number().nullable().optional(),
  maxValue: z.number().nullable().optional(),
  unit: z.string().min(1)
});

export function getThresholds(): Threshold[] {
  const db = getDatabase();
  return (db.thresholds || []).map((t: any) => ({
    sensorType: t.sensor_type,
    minValue: t.min_value,
    maxValue: t.max_value,
    unit: t.unit,
    updatedAt: t.updated_at
  }));
}

export function getThresholdByType(sensorType: string) {
  const db = getDatabase();
  const threshold = db.thresholds?.find((t: any) => t.sensor_type === sensorType);
  if (!threshold) {
    return undefined;
  }
  return {
    sensorType: threshold.sensor_type,
    minValue: threshold.min_value,
    maxValue: threshold.max_value,
    unit: threshold.unit,
    updatedAt: threshold.updated_at
  };
}

export function updateThreshold(sensorType: string, payload: unknown): Threshold | null {
  const parsed = updateThresholdSchema.safeParse(payload);
  if (!parsed.success) {
    return null;
  }

  const { minValue = null, maxValue = null, unit } = parsed.data;
  const db = getDatabase();
  const updatedAt = dayjs().toISOString();

  db.thresholds = db.thresholds || [];
  const existingIndex = db.thresholds.findIndex((t: any) => t.sensor_type === sensorType);

  if (existingIndex >= 0) {
    db.thresholds[existingIndex] = {
      sensor_type: sensorType,
      min_value: minValue,
      max_value: maxValue,
      unit,
      updated_at: updatedAt
    };
  } else {
    db.thresholds.push({
      sensor_type: sensorType,
      min_value: minValue,
      max_value: maxValue,
      unit,
      updated_at: updatedAt
    });
  }

  saveDB();

  return {
    sensorType,
    minValue,
    maxValue,
    unit,
    updatedAt
  };
}

