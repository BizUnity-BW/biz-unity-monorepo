import client from './client';
import type { ApiResponse, UserProfile } from '../types';

/** `avatarUrl` is deliberately not writable here — it is owned by the document flow. */
export type ProfileUpdate = Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'phone'>>;

export const usersApi = {
  updateMe: (data: ProfileUpdate) =>
    client.patch<ApiResponse<UserProfile>>('/api/v1/users/me', data),
};
