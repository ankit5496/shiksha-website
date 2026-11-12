import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { ingest, live } from '../controllers/transportController.js';

const router = Router();

router.get('/live', requireAuth, live);
router.post('/location', ingest); // GPS devices authenticate with the x-device-key header

export default router;
