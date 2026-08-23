import client from './client';
import type { ApiResponse, AdminOrganisation, AdminOrganisationDetail } from '../types';

export interface OrgListParams {
  page?: number;
  limit?: number;
  search?: string;
  includeDeleted?: boolean;
}

export const organisationsApi = {
  list: (params: OrgListParams = {}) =>
    client.get<ApiResponse<AdminOrganisation[]>>('/api/v1/admin/organisations', {
      params: {
        page: params.page,
        limit: params.limit,
        search: params.search || undefined,
        // Only sent when true: the backend defaults to hiding suspended orgs.
        includeDeleted: params.includeDeleted ? 'true' : undefined,
      },
    }),

  get: (id: string) =>
    client.get<ApiResponse<AdminOrganisationDetail>>(`/api/v1/admin/organisations/${id}`),
};
