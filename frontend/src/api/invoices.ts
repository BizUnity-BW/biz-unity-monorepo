import client from './client';
import type { Invoice } from '../types';

export const invoicesApi = {
  list: () => client.get<{ success: true; data: Invoice[] }>('/api/v1/invoices'),
  get: (id: string) => client.get<{ success: true; data: Invoice }>(`/api/v1/invoices/${id}`),
  create: (data: unknown) => client.post('/api/v1/invoices', data),
  updateStatus: (id: string, status: Invoice['status']) => client.patch(`/api/v1/invoices/${id}/status`, { status }),
};
