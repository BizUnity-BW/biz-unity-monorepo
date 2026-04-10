import client from './client';

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    client.post('/api/v1/auth/register', data),
};
