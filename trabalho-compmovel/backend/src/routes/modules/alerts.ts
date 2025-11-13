import { Router } from "express";

import { acknowledgeAlertById, listAlerts } from "../../services/alertService";

export const alertsRouter = Router();

alertsRouter.get("/", (_req, res) => {
  res.json(listAlerts());
});

alertsRouter.post("/:id/acknowledge", (req, res) => {
  const alert = acknowledgeAlertById(req.params.id);
  if (!alert) {
    return res.status(404).json({ message: "Alerta não encontrado" });
  }
  return res.json(alert);
});

