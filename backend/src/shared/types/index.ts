import { Request } from 'express';
import { OrgRole, SystemRole } from '@prisma/client';

export interface AuthUser {
  id: string; // Supabase user id
  email: string;
}

export interface TenantOrg {
  id: string;
  name: string;
  slug: string;
}

/**
 * The caller's `UserProfile`, attached by `requireTenant` and `requireSystemAdmin`.
 *
 * `id` is the `UserProfile.id`, not the Supabase id on `AuthUser` — that
 * distinction matters because every actor column in the audit trail
 * (`uploadedById`, `verifiedById`, `actorUserId`) is a `UserProfile` reference.
 *
 * `systemRole` comes from this row and nowhere else. It used to be read off
 * `app_metadata.system_role`, which nothing ever wrote, so every user silently
 * resolved to SYSTEM_USER.
 */
export interface RequestProfile {
  id: string;
  email: string;
  systemRole: SystemRole;
  orgRole: OrgRole;
  organisationId: string | null;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
  org: TenantOrg;
  profile: RequestProfile;
}

// Pagination envelope from the MVP1 spec: { success, data?, error?, meta? }.
export interface PaginationMeta {
  total: number; // matching rows across all pages
  page: number; // 1-based
  pages: number; // total pages at this limit
  limit: number; // page size actually applied
}

export type ApiResponse<T = undefined> =
  | { success: true; data: T; meta?: PaginationMeta }
  | { success: false; error: string; details?: unknown };
