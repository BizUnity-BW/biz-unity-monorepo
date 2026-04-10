import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import * as controller from './controller';

const router = Router();
router.use(requireAuth, requireTenant);

router.get('/', controller.list);
router.post('/', controller.create);

export default router;
