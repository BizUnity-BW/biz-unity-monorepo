import { Request, Response, NextFunction } from 'express';
import { SystemRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../shared/types';
import { fail } from '../shared/utils';

/**
 * Platform-staff guard for the cross-tenant `/api/v1/admin/*` routes.
 *
 * Runs after `requireAuth` and *instead of* `requireTenant`: it must never require
 * an organisation, because a platform admin is a `UserProfile` with
 * `organisationId = null`. Requiring one would lock every admin out of everything.
 *
 * `systemRole` is read from the database row, never from a token claim.
 */
export async function requireSystemAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authReq = req as AuthenticatedRequest;

  const profile = await prisma.userProfile.findUnique({
    where: { supabaseId: authReq.user.id },
  });

  if (!profile || profile.systemRole !== SystemRole.SYSTEM_ADMIN) {
    // Same message either way: whether the profile exists is not something an
    // unauthorised caller needs to learn.
    fail(res, 'System administrator access required', 403);
    return;
  }

  authReq.profile = {
    id: profile.id,
    email: profile.email,
    systemRole: profile.systemRole,
    orgRole: profile.orgRole,
    organisationId: profile.organisationId,
  };

  next();
}
