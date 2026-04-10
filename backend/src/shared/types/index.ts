import { Request } from 'express';

export interface AuthUser {
  id: string; // Supabase user id
  email: string;
  role: string;
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

export type ApiResponse<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };
