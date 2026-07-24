import client from './client';
import type { Invoice } from '../types';

export const invoicesApi = {
  list: () => client.get<{ success: true; data: Invoice[] }>('/api/v1/invoices'),
  get: (id: string) => client.get<{ success: true; data: Invoice }>(`/api/v1/invoices/${id}`),
  create: (data: unknown) => client.post('/api/v1/invoices', data),
  fromQuotation: (quotationId: string, dueDate?: string) =>
    client.post<{ success: true; data: Invoice }>(
      `/api/v1/invoices/from-quotation/${quotationId}`,
      { dueDate },
    ),
  updateStatus: (id: string, status: Invoice['status']) =>
    client.patch(`/api/v1/invoices/${id}/status`, { status }),
};
