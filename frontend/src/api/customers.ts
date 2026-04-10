import client from './client';
import type { Customer } from '../types';

export const customersApi = {
  list: () => client.get<{ success: true; data: Customer[] }>('/api/v1/customers'),
  get: (id: string) => client.get<{ success: true; data: Customer }>(`/api/v1/customers/${id}`),
  create: (data: Partial<Customer>) => client.post('/api/v1/customers', data),
  update: (id: string, data: Partial<Customer>) => client.patch(`/api/v1/customers/${id}`, data),
  remove: (id: string) => client.delete(`/api/v1/customers/${id}`),
};
