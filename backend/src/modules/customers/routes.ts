import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import * as controller from './controller';

const router = Router();
router.use(requireAuth, requireTenant);

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
