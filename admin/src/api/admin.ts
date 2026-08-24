import client from './client';
import type { ApiResponse } from '../types';

export const adminApi = {
  /** Guard health check. 200 proves the caller is a platform admin end to end. */
  ping: () =>
    client.get<ApiResponse<{ ok: true; profileId: string; email: string }>>('/api/v1/admin/ping'),
};
