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

export default router;
