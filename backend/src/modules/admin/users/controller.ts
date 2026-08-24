import { Request, Response } from 'express';
import { z } from 'zod';
import { paginationSchema } from '../../../shared/validators';
import { ok, fail, paginationMeta } from '../../../shared/utils';
import { AuthenticatedRequest } from '../../../shared/types';
import * as service from './service';
import type { AdminUserError } from './service';

const listQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  // 'none' finds platform staff and orphaned profiles, which is otherwise unreachable.
  organisationId: z.string().min(1).optional(),
  systemRole: z.enum(['SYSTEM_ADMIN', 'SYSTEM_USER']).optional(),
  orgRole: z.enum(['OWNER', 'MANAGER', 'SALES']).optional(),
});

const rolesSchema = z
  .object({
    systemRole: z.enum(['SYSTEM_ADMIN', 'SYSTEM_USER']).optional(),
    orgRole: z.enum(['OWNER', 'MANAGER', 'SALES']).optional(),
  })
  .refine((v) => v.systemRole !== undefined || v.orgRole !== undefined, {
    message: 'Provide systemRole, orgRole, or both',
  });

// `null` detaches the user from their organisation, which is how a tenant user
// becomes platform staff, so it has to be expressible.
const organisationSchema = z.object({ organisationId: z.string().min(1).nullable() });

const ERRORS: Record<AdminUserError, { status: number; message: string }> = {
  NOT_FOUND: { status: 404, message: 'Not found' },
  SELF_DEMOTION: {
    status: 409,
    message:
      'You cannot remove your own platform-admin access. Ask another admin, or use the admin:grant script.',
  },
  ORG_ROLE_WITHOUT_ORG: {
    status: 422,
    message: 'This user has no organisation, so an organisation role cannot be set',
  },
  LAST_OWNER: {
    status: 409,
    message:
      'This user is the only OWNER of their organisation. Promote another member to OWNER first.',
  },
  ORG_NOT_FOUND: { status: 422, message: 'That organisation does not exist or is suspended' },
};

function sendError(res: Response, code: AdminUserError): void {
  const mapped = ERRORS[code];
  fail(res, mapped.message, mapped.status);
}

export async function list(req: Request, res: Response): Promise<void> {
  const filter = listQuerySchema.safeParse(req.query);
  const page = paginationSchema.safeParse(req.query);
  if (!filter.success || !page.success) {
    fail(res, 'Validation failed', 422, (filter.success ? page : filter).error?.flatten());
    return;
  }

  const { total, users } = await service.listUsers({
    ...filter.data,
    page: page.data.page,
    limit: page.data.limit,
  });

  ok(res, users, { meta: paginationMeta(total, page.data.page, page.data.limit) });
}

export async function get(req: Request, res: Response): Promise<void> {
  const user = await service.getUser(req.params.id as string);
  if (!user) {
    fail(res, 'Not found', 404);
    return;
  }
  ok(res, user);
}

export async function setRoles(req: Request, res: Response): Promise<void> {
  const parsed = rolesSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }

  const { profile } = req as AuthenticatedRequest;
  const result = await service.setRoles(req.params.id as string, parsed.data, profile.id);
  if ('error' in result) {
    sendError(res, result.error);
    return;
  }
  ok(res, result.user);
}

export async function setOrganisation(req: Request, res: Response): Promise<void> {
  const parsed = organisationSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }

  const { profile } = req as AuthenticatedRequest;
  const result = await service.setOrganisation(
    req.params.id as string,
    parsed.data.organisationId,
    profile.id,
  );
  if ('error' in result) {
    sendError(res, result.error);
    return;
  }
  ok(res, result.user);
}
