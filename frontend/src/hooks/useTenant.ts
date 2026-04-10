import { useTenantStore } from '../store/tenantStore';

export function useTenant() {
  return useTenantStore();
}
