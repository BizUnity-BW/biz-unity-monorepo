import { Request, Response } from 'express';
import { z } from 'zod';
import { quotationSchema } from '../../shared/validators';
import { ok, fail } from '../../shared/utils';
import { AuthenticatedRequest } from '../../shared/types';
import { QuotationStatus } from '@prisma/client';
import * as service from './service';

const statusSchema = z.object({
  status: z.nativeEnum(QuotationStatus),
});

export async function list(req: Request, res: Response): Promise<void> {
  ok(res, await service.listQuotations((req as AuthenticatedRequest).org.id));
}

export async function get(req: Request, res: Response): Promise<void> {
  const item = await service.getQuotation(
    req.params.id as string,
    (req as AuthenticatedRequest).org.id,
  );
  if (!item) {
    fail(res, 'Not found', 404);
    return;
  }
  ok(res, item);
}

export async function create(req: Request, res: Response): Promise<void> {
  const parsed = quotationSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }
  ok(res, await service.createQuotation((req as AuthenticatedRequest).org.id, parsed.data), 201);
}

export async function update(req: Request, res: Response): Promise<void> {
  const parsed = quotationSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }
  const result = await service.updateQuotation(
    req.params.id as string,
    (req as AuthenticatedRequest).org.id,
    parsed.data,
  );

  if ('error' in result) {
    if (result.error === 'NOT_FOUND') {
      fail(res, 'Not found', 404);
    } else {
      fail(res, 'Only DRAFT quotations can be edited', 409);
    }
    return;
  }

  ok(res, result);
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }
  await service.updateQuotationStatus(
    req.params.id as string,
    (req as AuthenticatedRequest).org.id,
    parsed.data.status,
  );
  ok(res, null);
}
