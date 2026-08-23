import client from './client';
import type { ApiResponse, Organisation } from '../types';

/** `logoUrl` is deliberately not writable here — it is owned by the document flow. */
export type OrganisationUpdate = Partial<
  Pick<Organisation, 'name' | 'email' | 'phone' | 'address' | 'vatNumber' | 'currency'>
>;

export const organisationsApi = {
  me: () => client.get<ApiResponse<Organisation>>('/api/v1/organisations/me'),
  update: (data: OrganisationUpdate) =>
    client.patch<ApiResponse<Organisation>>('/api/v1/organisations/me', data),
};
