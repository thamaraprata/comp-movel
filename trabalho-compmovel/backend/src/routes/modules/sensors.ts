import { Router } from "express";

import { listSensors, listSensorReadings } from "../../services/sensorService";

export const sensorsRouter = Router();

sensorsRouter.get("/", (_req, res) => {
  res.json(listSensors());
});

sensorsRouter.get("/:sensorId/readings", (req, res) => {
  const sensorId = req.params.sensorId;
  const readings = listSensorReadings(sensorId);
  if (!readings) {
    return res.status(404).json({ message: "Sensor não encontrado" });
  }
  return res.json(readings);
});

