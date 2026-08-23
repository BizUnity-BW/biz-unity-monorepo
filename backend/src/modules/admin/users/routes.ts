import { Router } from 'express';
import * as controller from './controller';

// Guarded by the parent admin router; do not add requireAuth/requireSystemAdmin here.
const router = Router();

router.get('/', controller.list);
router.get('/:id', controller.get);
router.patch('/:id/roles', controller.setRoles);
router.patch('/:id/organisation', controller.setOrganisation);

export default router;
