import { Router } from "express";

import { dashboardRouter } from "./modules/dashboard";
import { alertsRouter } from "./modules/alerts";
import { thresholdsRouter } from "./modules/thresholds";
import { sensorsRouter } from "./modules/sensors";
import { tipsRouter } from "./modules/tips";
import { telegramRouter } from "./modules/telegram";
import { weatherRouter } from "./modules/weather";

export const routes = Router();

routes.use("/dashboard", dashboardRouter);
routes.use("/alerts", alertsRouter);
routes.use("/thresholds", thresholdsRouter);
routes.use("/sensors", sensorsRouter);
routes.use("/tips", tipsRouter);
routes.use("/telegram", telegramRouter);
routes.use("/weather", weatherRouter);

