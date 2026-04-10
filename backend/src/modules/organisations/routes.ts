import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import * as controller from './controller';

const router = Router();

router.post('/', requireAuth, controller.create);
router.get('/me', requireAuth, requireTenant, controller.get);
router.patch('/me', requireAuth, requireTenant, controller.update);

export default router;
