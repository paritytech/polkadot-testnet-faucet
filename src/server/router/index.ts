import express from 'express';

import actionRoutes from './actions';
import healthcheckRoutes from './healthcheck';
import metricsRoutes from './metrics';

const router = express.Router();

router.use(healthcheckRoutes);
router.use(metricsRoutes);
router.use(actionRoutes);

export default router;
