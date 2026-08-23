import client from './client';
import type { ApiResponse, VerifiedPaymentsStatement } from '../types';

export interface StatementQuery {
  customerId?: string;
  /** YYYY-MM-DD */
  from: string;
  to: string;
}

export const verifiedPaymentsApi = {
  statement: (params: StatementQuery) =>
    client.get<ApiResponse<VerifiedPaymentsStatement>>('/api/v1/verified-payments/statement', {
      params: { ...params, format: 'json' },
    }),

  /**
   * The same endpoint as CSV. Goes through axios rather than a bare `<a href>` so the
   * interceptor can attach the JWT, which an anchor cannot do.
   */
  statementCsv: (params: StatementQuery) =>
    client.get<Blob>('/api/v1/verified-payments/statement', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    }),
};
