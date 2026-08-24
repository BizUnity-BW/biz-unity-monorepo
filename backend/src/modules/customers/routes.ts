import { Router } from 'express';
import { OrgRole } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import { requireOrgRole } from '../../middleware/orgRole';
import * as controller from './controller';

const router = Router();
router.use(requireAuth, requireTenant);

// Read and write are open to all three roles per the MVP1 spec role matrix; only the
// soft-delete is restricted. Unguarded routes here are open by design.
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', requireOrgRole(OrgRole.OWNER, OrgRole.MANAGER), controller.remove);

export default router;
