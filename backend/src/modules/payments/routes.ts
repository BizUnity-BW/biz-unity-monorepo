import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import * as controller from './controller';

const router = Router();
router.use(requireAuth, requireTenant);

// No `requireOrgRole` here, deliberately: the MVP1 spec opens both of these to all three
// roles — a SALES user is explicitly allowed to record a payment. This is not a missing
// guard. The one restricted payments route, `DELETE /:id` (OWNER, MANAGER), does not exist
// yet and arrives with its guard attached.
router.get('/', controller.list);
router.post('/', controller.create);

export default router;
