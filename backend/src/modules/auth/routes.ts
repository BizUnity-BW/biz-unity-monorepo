import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimiter';
import * as controller from './controller';

const router = Router();

router.post('/register', authLimiter, controller.register);
router.post('/login', authLimiter, controller.login);

export default router;
