import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireSystemAdmin } from '../../middleware/systemAdmin';
import { ok } from '../../shared/utils';
import { AuthenticatedRequest } from '../../shared/types';
import paymentRoutes from './payments/routes';
import documentRoutes from './documents/routes';
import organisationRoutes from './organisations/routes';
import userRoutes from './users/routes';

const router = Router();

// Applied once, at the parent, so a sub-route added later cannot ship unguarded.
// Note requireSystemAdmin runs *instead of* requireTenant: a platform admin has no
// organisation, and requiring one would lock them out of every route here.
router.use(requireAuth, requireSystemAdmin);

router.get('/ping', (req: Request, res: Response) => {
  const { profile } = req as AuthenticatedRequest;
  ok(res, { ok: true, profileId: profile.id, email: profile.email });
});

router.use('/payments', paymentRoutes);
router.use('/documents', documentRoutes);
router.use('/organisations', organisationRoutes);
router.use('/users', userRoutes);

export default router;
