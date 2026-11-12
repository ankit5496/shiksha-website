import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { permit } from '../middleware/authorize.js';
import { validateCreate } from '../middleware/validate.js';
import { bulkUpsert, create, getOne, list, remove, update } from '../controllers/resourceController.js';

/**
 * Generic REST resources: /api/:collection
 * Collections and role rules are defined in config/permissions.js.
 * optionalAuth lets public collections (gallery, events, enquiry forms) work without a token;
 * `permit` rejects everything else that lacks a valid JWT.
 */
const router = Router();

router.get('/:collection', optionalAuth, permit('read'), list);
router.post('/:collection/bulk', optionalAuth, permit('update'), bulkUpsert);
router.get('/:collection/:id', optionalAuth, permit('read'), getOne);
router.post('/:collection', optionalAuth, permit('create'), validateCreate, create);
router.put('/:collection/:id', optionalAuth, permit('update'), update);
router.patch('/:collection/:id', optionalAuth, permit('update'), update);
router.delete('/:collection/:id', optionalAuth, permit('delete'), remove);

export default router;
