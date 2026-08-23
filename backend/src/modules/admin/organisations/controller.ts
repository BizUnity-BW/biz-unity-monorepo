import { Request, Response } from 'express';
import { z } from 'zod';
import { paginationSchema } from '../../../shared/validators';
import { ok, fail, paginationMeta } from '../../../shared/utils';
import * as service from './service';

const listQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  // Suspended organisations are hidden by default so the list reads as "live customers".
  includeDeleted: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export async function list(req: Request, res: Response): Promise<void> {
  const filter = listQuerySchema.safeParse(req.query);
  const page = paginationSchema.safeParse(req.query);
  if (!filter.success || !page.success) {
    fail(res, 'Validation failed', 422, (filter.success ? page : filter).error?.flatten());
    return;
  }

  const { total, organisations } = await service.listOrganisations({
    search: filter.data.search,
    includeDeleted: filter.data.includeDeleted,
    page: page.data.page,
    limit: page.data.limit,
  });

  ok(res, organisations, { meta: paginationMeta(total, page.data.page, page.data.limit) });
}

export async function get(req: Request, res: Response): Promise<void> {
  const organisation = await service.getOrganisation(req.params.id as string);
  if (!organisation) {
    fail(res, 'Not found', 404);
    return;
  }
  ok(res, organisation);
}
