import { Request, Response, NextFunction, RequestHandler } from 'express';
import { OrgRole } from '@prisma/client';
import { AuthenticatedRequest } from '../shared/types';
import { fail } from '../shared/utils';

/**
 * Per-route org-role guard for the tenant modules (OWNER / MANAGER / SALES).
 *
 * Must be mounted after `requireAuth, requireTenant` — it reads the `orgRole` that
 * `requireTenant` attaches to `req.profile` from the `UserProfile` row. The role comes
 * from that row and never from a token claim, matching `requireSystemAdmin`.
 *
 * Applied per-route rather than once at the parent router, because the permission
 * matrix is per-verb: SALES may POST a payment but not DELETE one, so no single
 * parent-level guard can express it. Routes the spec opens to all three roles get no
 * guard at all rather than a no-op `requireOrgRole(OWNER, MANAGER, SALES)` — an absent
 * guard reads as "open by design" once the restricted routes beside it each carry one.
 *
 * Note this is application-layer authorisation only, and not a substitute for
 * database-level RLS.
 */
export function requireOrgRole(...allowed: OrgRole[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { profile } = req as AuthenticatedRequest;

    if (!allowed.includes(profile.orgRole)) {
      // Deliberately does not name the required role: which roles could perform this
      // is not something an unauthorised caller needs to learn.
      fail(res, 'Insufficient permissions for this action', 403);
      return;
    }

    next();
  };
}
