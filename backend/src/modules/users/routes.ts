import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();
router.use(requireAuth);

router.get('/me', controller.getMe);
router.patch('/me', controller.updateMe);

export default router;
