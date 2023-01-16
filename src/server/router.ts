import express from "express";

import actionRoutes from "./routes/actions";
import healthcheckRoutes from "./routes/healthcheck";
import metricsRoutes from "./routes/metrics";

const router = express.Router();

router.use(healthcheckRoutes);
router.use(metricsRoutes);
router.use(actionRoutes);

export default router;
