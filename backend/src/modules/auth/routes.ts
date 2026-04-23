import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimiter';
import { requireAuth } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();

router.post('/register', authLimiter, controller.register);
router.post('/profile', requireAuth, controller.completeProfile);
router.post('/organisation', requireAuth, controller.createOrganisation);
router.get('/me', requireAuth, controller.getMe);

export default router;
