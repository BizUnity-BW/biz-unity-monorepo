import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import * as controller from './controller';

const router = Router();
router.use(requireAuth, requireTenant);

router.get('/statement', controller.statement);

export default router;
