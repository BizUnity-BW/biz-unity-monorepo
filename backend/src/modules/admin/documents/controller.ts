import { Request, Response } from 'express';
import { z } from 'zod';
import { paginationSchema, verifyDecisionSchema } from '../../../shared/validators';
import { ok, fail, paginationMeta } from '../../../shared/utils';
import { AuthenticatedRequest } from '../../../shared/types';
import * as service from './service';

const queueSchema = z.object({
  reviewStatus: z.enum(['NOT_REQUIRED', 'PENDING', 'VERIFIED', 'REJECTED']).optional(),
  organisationId: z.string().optional(),
});

export async function list(req: Request, res: Response): Promise<void> {
  const filter = queueSchema.safeParse(req.query);
  const page = paginationSchema.safeParse(req.query);
  if (!filter.success || !page.success) {
    fail(res, 'Validation failed', 422, (filter.success ? page : filter).error?.flatten());
    return;
  }

  const { total, documents } = await service.listDocuments({
    reviewStatus: filter.data.reviewStatus,
    organisationId: filter.data.organisationId,
    page: page.data.page,
    limit: page.data.limit,
  });

  ok(res, documents, { meta: paginationMeta(total, page.data.page, page.data.limit) });
}

export async function downloadUrl(req: Request, res: Response): Promise<void> {
  const result = await service.createDownloadUrl(req.params.id as string);
  if ('error' in result) {
    if (result.error === 'NOT_FOUND') {
      fail(res, 'Not found', 404);
      return;
    }
    fail(res, 'Storage is unavailable, please try again', 502);
    return;
  }
  ok(res, result);
}

export async function review(req: Request, res: Response): Promise<void> {
  const parsed = verifyDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }

  const { profile } = req as AuthenticatedRequest;
  const result = await service.review(
    req.params.id as string,
    parsed.data,
    profile.id,
    profile.systemRole,
  );

  if ('error' in result) {
    fail(res, 'Not found', 404);
    return;
  }
  ok(res, result.document);
}
