import { Request, Response } from 'express';
import { organisationSchema } from '../../shared/validators';
import { ok, fail } from '../../shared/utils';
import { AuthenticatedRequest } from '../../shared/types';
import * as service from './service';

export async function create(req: Request, res: Response): Promise<void> {
  const parsed = organisationSchema.safeParse(req.body);
  if (!parsed.success) { fail(res, 'Validation failed', 422, parsed.error.flatten()); return; }

  const authReq = req as AuthenticatedRequest;
  const org = await service.createOrganisation(
    parsed.data.name,
    authReq.user.id,
    authReq.user.email,
    req.body.name,
  );
  ok(res, org, 201);
}

export async function get(req: Request, res: Response): Promise<void> {
  const { org } = req as AuthenticatedRequest;
  const data = await service.getOrganisation(org.id);
  if (!data) { fail(res, 'Not found', 404); return; }
  ok(res, data);
}

export async function update(req: Request, res: Response): Promise<void> {
  const parsed = organisationSchema.partial().safeParse(req.body);
  if (!parsed.success) { fail(res, 'Validation failed', 422, parsed.error.flatten()); return; }
  const { org } = req as AuthenticatedRequest;
  const data = await service.updateOrganisation(org.id, parsed.data);
  ok(res, data);
}
