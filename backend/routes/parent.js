import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';
import { parentBusTracking } from '../controllers/transportController.js';

const router = Router();

// Parent-only endpoints. Access is derived from the authenticated parent, never from client-supplied ids.
router.get('/bus-tracking', requireAuth, requireRole('parent'), parentBusTracking);

export default router;
