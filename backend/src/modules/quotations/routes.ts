import { Router } from 'express';
import { OrgRole } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import { requireOrgRole } from '../../middleware/orgRole';
import * as controller from './controller';

const router = Router();
router.use(requireAuth, requireTenant);

// Drafting a quotation is open to all three roles; moving it through the approval chain
// is not. `PATCH /:id/status` drives DRAFT → SENT → ACCEPTED/REJECTED → CONVERTED, so
// leaving it open would let a SALES user mark a quotation ACCEPTED on the customer's
// behalf. Unguarded routes here are open by design.
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch(
  '/:id/status',
  requireOrgRole(OrgRole.OWNER, OrgRole.MANAGER),
  controller.updateStatus,
);

export default router;
