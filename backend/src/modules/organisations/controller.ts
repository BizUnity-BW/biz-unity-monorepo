import { Request, Response } from 'express';
import { createOrganisationSchema } from '../../shared/validators';
import { ok, fail } from '../../shared/utils';
import { AuthenticatedRequest } from '../../shared/types';
import * as service from './service';

export async function get(req: Request, res: Response): Promise<void> {
  const { org } = req as AuthenticatedRequest;
  const data = await service.getOrganisation(org.id);
  if (!data) {
    fail(res, 'Not found', 404);
    return;
  }
  ok(res, data);
}

export async function update(req: Request, res: Response): Promise<void> {
  const parsed = createOrganisationSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }
  const { org } = req as AuthenticatedRequest;
  const data = await service.updateOrganisation(org.id, parsed.data);
  ok(res, data);
}
