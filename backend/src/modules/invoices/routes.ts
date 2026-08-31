import { Router } from 'express';
import { OrgRole } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import { requireOrgRole } from '../../middleware/orgRole';
import * as controller from './controller';

const router = Router();
router.use(requireAuth, requireTenant);

// Invoices are the most restricted module in the MVP1 spec: SALES may read only. Issuing
// an invoice or moving its status is an OWNER/MANAGER act. Unguarded routes here are open
// by design.
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', requireOrgRole(OrgRole.OWNER, OrgRole.MANAGER), controller.create);
router.post(
  '/from-quotation/:quotationId',
  requireOrgRole(OrgRole.OWNER, OrgRole.MANAGER),
  controller.createFromQuotation,
);
router.patch(
  '/:id/status',
  requireOrgRole(OrgRole.OWNER, OrgRole.MANAGER),
  controller.updateStatus,
);
// Registered after `/:id/status` — Express matches in order, and `/:id` would otherwise
// swallow the status route.
router.patch('/:id', requireOrgRole(OrgRole.OWNER, OrgRole.MANAGER), controller.update);
// OWNER only, stricter than the quotation equivalent: deleting an invoice is the one
// destructive act on a financial document the spec does not delegate to a MANAGER.
router.delete('/:id', requireOrgRole(OrgRole.OWNER), controller.remove);

export default router;
