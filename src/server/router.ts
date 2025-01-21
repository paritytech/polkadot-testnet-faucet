import express from "express";

import actionRoutes from "./routes/actions.js";
import healthcheckRoutes from "./routes/healthcheck.js";
import metricsRoutes from "./routes/metrics.js";

const router = express.Router();

router.use(healthcheckRoutes);
router.use(metricsRoutes);
router.use(actionRoutes);

export default router;
