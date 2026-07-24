import { Request, Response } from 'express';
import { z } from 'zod';
import { invoiceSchema } from '../../shared/validators';
import { ok, fail } from '../../shared/utils';
import { AuthenticatedRequest } from '../../shared/types';
import { InvoiceStatus } from '@prisma/client';
import * as service from './service';

const statusSchema = z.object({
  status: z.nativeEnum(InvoiceStatus),
});

export async function list(req: Request, res: Response): Promise<void> {
  ok(res, await service.listInvoices((req as AuthenticatedRequest).org.id));
}

export async function get(req: Request, res: Response): Promise<void> {
  const item = await service.getInvoice(
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
  const parsed = invoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }
  ok(res, await service.createInvoice((req as AuthenticatedRequest).org.id, parsed.data), 201);
}

export async function createFromQuotation(req: Request, res: Response): Promise<void> {
  const quotationId = req.params.quotationId as string;
  const dueDate = typeof req.body?.dueDate === 'string' ? req.body.dueDate : undefined;

  const result = await service.createInvoiceFromQuotation(
    (req as AuthenticatedRequest).org.id,
    quotationId,
    { dueDate },
  );

  if ('error' in result) {
    if (result.error === 'NOT_FOUND') {
      fail(res, 'Quotation not found', 404);
    } else {
      fail(res, 'This quotation has already been converted to an invoice', 409);
    }
    return;
  }

  ok(res, result, 201);
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }
  await service.updateInvoiceStatus(
    req.params.id as string,
    (req as AuthenticatedRequest).org.id,
    parsed.data.status,
  );
  ok(res, null);
}
