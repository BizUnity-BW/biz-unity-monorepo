import client from './client';
import type { Payment } from '../types';

export const paymentsApi = {
  list: () => client.get<{ success: true; data: Payment[] }>('/api/v1/payments'),
  create: (data: unknown) => client.post('/api/v1/payments', data),
};
