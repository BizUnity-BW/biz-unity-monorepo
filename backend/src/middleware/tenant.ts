import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../shared/types';
import { fail } from '../shared/utils';

export async function requireTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authReq = req as AuthenticatedRequest;

  const user = await prisma.user.findUnique({
    where: { supabaseId: authReq.user.id },
    include: { organisation: true },
  });

  if (!user || !user.organisation) {
    fail(res, 'No organisation found for this user', 403);
    return;
  }

  authReq.org = {
    id: user.organisation.id,
    name: user.organisation.name,
    slug: user.organisation.slug,
  };

  next();
}