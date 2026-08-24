import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import { uploadLimiter } from '../../middleware/rateLimiter';
import * as controller from './controller';

const router = Router();
router.use(requireAuth, requireTenant);

router.get('/', controller.list);
// Leg 1 of the upload. Leg 2 goes browser-to-Supabase and never touches this API.
router.post('/upload-url', uploadLimiter, controller.createUploadSlot);
router.post('/:id/confirm', controller.confirm);
router.get('/:id/download-url', controller.downloadUrl);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
