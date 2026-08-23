import { Router } from 'express';
import * as controller from './controller';

// Guarded by the parent admin router; do not add requireAuth/requireSystemAdmin here.
const router = Router();

router.get('/', controller.list);
router.get('/:id/download-url', controller.downloadUrl);
router.patch('/:id/review', controller.review);

export default router;
