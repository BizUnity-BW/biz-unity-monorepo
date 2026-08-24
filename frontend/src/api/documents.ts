import client from './client';
import type { ApiResponse, DocumentKind, DocumentRecord } from '../types';

export interface UploadSlot {
  documentId: string;
  bucket: string;
  path: string;
  token: string;
  /** Full signed PUT URL. Present means the browser can use XHR and get progress. */
  signedUrl: string;
}

export const documentsApi = {
  /** Leg 1: reserve a slot and get a signed upload URL. */
  createUploadSlot: (data: {
    kind: DocumentKind;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    paymentId?: string;
    userProfileId?: string;
  }) => client.post<ApiResponse<UploadSlot>>('/api/v1/documents/upload-url', data),

  /** Leg 3: tell the API the bytes landed. Idempotent, so retrying is safe. */
  confirm: (id: string) =>
    client.post<ApiResponse<DocumentRecord>>(`/api/v1/documents/${id}/confirm`),

  list: (params?: { kind?: DocumentKind; paymentId?: string }) =>
    client.get<ApiResponse<DocumentRecord[]>>('/api/v1/documents', { params }),

  /** Short-lived; fetch it per click rather than caching it. */
  downloadUrl: (id: string) =>
    client.get<ApiResponse<{ url: string; expiresIn: number; fileName: string }>>(
      `/api/v1/documents/${id}/download-url`,
    ),

  update: (
    id: string,
    data: Partial<Pick<DocumentRecord, 'documentNumber' | 'issuedAt' | 'expiresAt'>>,
  ) => client.patch<ApiResponse<DocumentRecord>>(`/api/v1/documents/${id}`, data),

  remove: (id: string) => client.delete<ApiResponse<null>>(`/api/v1/documents/${id}`),
};
