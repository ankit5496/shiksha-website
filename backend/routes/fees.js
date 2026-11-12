import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';
import { createOrder, verifyPayment, webhook } from '../controllers/feesController.js';

const router = Router();

router.post('/orders', requireAuth, requireRole('parent', 'admin', 'office'), createOrder);
router.post('/verify', requireAuth, requireRole('parent', 'admin', 'office'), verifyPayment);
router.post('/webhook', webhook); // called by the payment gateway (signature-verified in production)

export default router;
