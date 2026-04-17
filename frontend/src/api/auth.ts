import client from './client';
import type { ApiResponse, UserProfile, Organisation } from '../types';

export const authApi = {
  register: (data: { email: string; password: string }) =>
    client.post<ApiResponse<{ message: string }>>('/api/v1/auth/register', data),

  completeProfile: (data: { firstName: string; lastName: string; phone?: string }) =>
    client.post<ApiResponse<UserProfile>>('/api/v1/auth/profile', data),

  createOrganisation: (data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    currency?: string;
  }) =>
    client.post<ApiResponse<{ organisation: Organisation; profile: UserProfile }>>(
      '/api/v1/auth/organisation',
      data,
    ),

  getMe: () =>
    client.get<ApiResponse<{ profile: UserProfile; organisation: Organisation | null }>>(
      '/api/v1/auth/me',
    ),
};
