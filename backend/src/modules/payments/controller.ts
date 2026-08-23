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
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }
  const { org, profile } = req as AuthenticatedRequest;
  const payment = await service.createPayment(org.id, profile.id, profile.orgRole, parsed.data);
  if (!payment) {
    fail(res, 'Invoice not found', 404);
    return;
  }
  ok(res, payment, 201);
}
