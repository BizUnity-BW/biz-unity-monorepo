import { Request } from 'express';

export interface AuthUser {
  id: string; // Supabase user id
  email: string;
  systemRole: 'SYSTEM_ADMIN' | 'SYSTEM_USER';
}

export interface TenantOrg {
  id: string;
  name: string;
  slug: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
  org: TenantOrg;
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
