import { Request, Response } from 'express';
import { z } from 'zod';
import { ok, fail } from '../../shared/utils';
import { AuthenticatedRequest } from '../../shared/types';
import * as service from './service';

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export async function getMe(req: Request, res: Response): Promise<void> {
  const { user } = req as AuthenticatedRequest;
  const data = await service.getUserBySupabaseId(user.id);
  if (!data) {
    fail(res, 'User not found', 404);
    return;
  }
  ok(res, data);
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }
  const { user } = req as AuthenticatedRequest;
  ok(res, await service.updateUser(user.id, parsed.data));
}
