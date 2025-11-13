import { Router } from "express";

import { dashboardRouter } from "./modules/dashboard";
import { alertsRouter } from "./modules/alerts";
import { thresholdsRouter } from "./modules/thresholds";
import { sensorsRouter } from "./modules/sensors";

export const routes = Router();

routes.use("/dashboard", dashboardRouter);
routes.use("/alerts", alertsRouter);
routes.use("/thresholds", thresholdsRouter);
routes.use("/sensors", sensorsRouter);

