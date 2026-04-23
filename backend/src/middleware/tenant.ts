import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../shared/types';
import { fail } from '../shared/utils';

export async function requireTenant(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authReq = req as AuthenticatedRequest;

  const profile = await prisma.userProfile.findUnique({
    where: { supabaseId: authReq.user.id },
    include: { organisation: true },
  });

  if (!profile || !profile.organisation) {
    fail(res, 'No organisation found for this user', 403);
    return;
  }

  authReq.org = {
    id: profile.organisation.id,
    name: profile.organisation.name,
    slug: profile.organisation.slug,
  };

  next();
}
