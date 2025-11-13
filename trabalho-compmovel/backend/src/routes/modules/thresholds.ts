import { Router } from "express";

import { getThresholds, updateThreshold } from "../../services/thresholdService";

export const thresholdsRouter = Router();

thresholdsRouter.get("/", (_req, res) => {
  res.json(getThresholds());
});

thresholdsRouter.put("/:sensorType", (req, res) => {
  const sensorType = req.params.sensorType;
  const updated = updateThreshold(sensorType, req.body);
  if (!updated) {
    return res.status(400).json({ message: "Não foi possível atualizar o limite" });
  }
  return res.json(updated);
});

