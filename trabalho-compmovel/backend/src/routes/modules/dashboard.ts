import { Router } from "express";

import { getDashboardSnapshot } from "../../services/dashboardService";

export const dashboardRouter = Router();

dashboardRouter.get("/", (_req, res) => {
  const snapshot = getDashboardSnapshot();
  res.json(snapshot);
});

