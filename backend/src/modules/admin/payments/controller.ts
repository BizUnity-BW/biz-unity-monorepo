import { Request, Response } from 'express';
import {
  paginationSchema,
  verificationQueueSchema,
  verifyDecisionSchema,
} from '../../../shared/validators';
import { ok, fail, paginationMeta } from '../../../shared/utils';
import { AuthenticatedRequest } from '../../../shared/types';
import * as service from './service';

export async function list(req: Request, res: Response): Promise<void> {
  const filter = verificationQueueSchema.safeParse(req.query);
  const page = paginationSchema.safeParse(req.query);
  if (!filter.success || !page.success) {
    fail(res, 'Validation failed', 422, (filter.success ? page : filter).error?.flatten());
    return;
  }

  const { total, payments } = await service.listPayments({
    status: filter.data.status,
    organisationId: filter.data.organisationId,
    page: page.data.page,
    limit: page.data.limit,
  });

  ok(res, payments, { meta: paginationMeta(total, page.data.page, page.data.limit) });
}

export async function get(req: Request, res: Response): Promise<void> {
  const payment = await service.getPayment(req.params.id as string);
  if (!payment) {
    fail(res, 'Not found', 404);
    return;
  }
  ok(res, payment);
}

export async function verify(req: Request, res: Response): Promise<void> {
  const parsed = verifyDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }

  const { profile } = req as AuthenticatedRequest;
  const result = await service.decide(
    req.params.id as string,
    parsed.data,
    profile.id,
    profile.systemRole,
  );

  if ('error' in result) {
    if (result.error === 'NOT_FOUND') {
      fail(res, 'Not found', 404);
      return;
    }
    fail(res, 'This payment has no proof of payment attached, so it cannot be verified', 409);
    return;
  }

  ok(res, result.payment);
}
