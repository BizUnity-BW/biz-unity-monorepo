import { Request, Response } from 'express';
import { paymentSchema } from '../../shared/validators';
import { ok, fail } from '../../shared/utils';
import { AuthenticatedRequest } from '../../shared/types';
import * as service from './service';

export async function list(req: Request, res: Response): Promise<void> {
  ok(res, await service.listPayments((req as AuthenticatedRequest).org.id));
}

export async function create(req: Request, res: Response): Promise<void> {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) { fail(res, 'Validation failed', 422, parsed.error.flatten()); return; }
  ok(res, await service.createPayment((req as AuthenticatedRequest).org.id, parsed.data), 201);
}
