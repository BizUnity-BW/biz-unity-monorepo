import { Request, Response } from 'express';
import { customerSchema } from '../../shared/validators';
import { ok, fail } from '../../shared/utils';
import { AuthenticatedRequest } from '../../shared/types';
import * as service from './service';

export async function list(req: Request, res: Response): Promise<void> {
  const { org } = req as AuthenticatedRequest;
  ok(res, await service.listCustomers(org.id));
}

export async function get(req: Request, res: Response): Promise<void> {
  const { org } = req as AuthenticatedRequest;
  const item = await service.getCustomer(req.params.id, org.id);
  if (!item) { fail(res, 'Not found', 404); return; }
  ok(res, item);
}

export async function create(req: Request, res: Response): Promise<void> {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) { fail(res, 'Validation failed', 422, parsed.error.flatten()); return; }
  const { org } = req as AuthenticatedRequest;
  ok(res, await service.createCustomer(org.id, parsed.data), 201);
}

export async function update(req: Request, res: Response): Promise<void> {
  const parsed = customerSchema.partial().safeParse(req.body);
  if (!parsed.success) { fail(res, 'Validation failed', 422, parsed.error.flatten()); return; }
  const { org } = req as AuthenticatedRequest;
  await service.updateCustomer(req.params.id, org.id, parsed.data);
  ok(res, null);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { org } = req as AuthenticatedRequest;
  await service.deleteCustomer(req.params.id, org.id);
  ok(res, null);
}
