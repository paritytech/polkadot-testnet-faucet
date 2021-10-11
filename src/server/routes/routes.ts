import express from 'express';

import actionRoutes from './actions';
import healthcheckRoutes from './healthcheck';
import prometheusRoutes from './prometheus';

const router = express.Router();

router.use(healthcheckRoutes);
router.use(prometheusRoutes);
router.use(actionRoutes);

export default router;
