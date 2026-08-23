import client from './client';
import type { ApiResponse, UserProfile, Organisation } from '../types';

export const authApi = {
  // Shared with the tenant app: the profile it returns carries `systemRole`, which
  // is what gates this whole app.
  getMe: () =>
    client.get<ApiResponse<{ profile: UserProfile; organisation: Organisation | null }>>(
      '/api/v1/auth/me',
    ),
};
