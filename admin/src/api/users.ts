import client from './client';
import type { ApiResponse, AdminUser, OrgRole, SystemRole } from '../types';

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  /** `'none'` finds platform staff and orphaned profiles. */
  organisationId?: string;
  systemRole?: SystemRole;
  orgRole?: OrgRole;
}

export const usersApi = {
  list: (params: UserListParams = {}) =>
    client.get<ApiResponse<AdminUser[]>>('/api/v1/admin/users', {
      params: { ...params, search: params.search || undefined },
    }),

  get: (id: string) => client.get<ApiResponse<AdminUser>>(`/api/v1/admin/users/${id}`),

  setRoles: (id: string, body: { systemRole?: SystemRole; orgRole?: OrgRole }) =>
    client.patch<ApiResponse<AdminUser>>(`/api/v1/admin/users/${id}/roles`, body),

  /** `null` detaches the user, which is how a tenant user becomes platform staff. */
  setOrganisation: (id: string, organisationId: string | null) =>
    client.patch<ApiResponse<AdminUser>>(`/api/v1/admin/users/${id}/organisation`, {
      organisationId,
    }),
};
