import { Router } from 'express';
import authRoutes from './auth.js';
import feesRoutes from './fees.js';
import transportRoutes from './transport.js';
import resourceRoutes from './resources.js';
import { getDriver } from '../services/repository.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', storage: getDriver(), time: new Date().toISOString() }));
router.use('/auth', authRoutes);
router.use('/fees', feesRoutes);
router.use('/transport', transportRoutes);
router.use('/', resourceRoutes); // keep last – matches /:collection

export default router;
