import { Router } from 'express';
import { OrgRole } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import { requireOrgRole } from '../../middleware/orgRole';
import * as controller from './controller';

const router = Router();
router.use(requireAuth, requireTenant);

// `GET /` and `POST /` carry no `requireOrgRole` deliberately: the MVP1 spec opens both to
// all three roles — a SALES user is explicitly allowed to record a payment. Reversing one
// is not theirs to do.
router.get('/', controller.list);
router.post('/', controller.create);
router.delete('/:id', requireOrgRole(OrgRole.OWNER, OrgRole.MANAGER), controller.remove);

export default router;
