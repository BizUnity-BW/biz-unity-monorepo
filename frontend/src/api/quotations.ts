import client from './client';
import type { Quotation } from '../types';

export const quotationsApi = {
  list: () => client.get<{ success: true; data: Quotation[] }>('/api/v1/quotations'),
  get: (id: string) => client.get<{ success: true; data: Quotation }>(`/api/v1/quotations/${id}`),
  create: (data: unknown) => client.post('/api/v1/quotations', data),
  update: (id: string, data: unknown) => client.put(`/api/v1/quotations/${id}`, data),
  updateStatus: (id: string, status: Quotation['status']) =>
    client.patch(`/api/v1/quotations/${id}/status`, { status }),
};
