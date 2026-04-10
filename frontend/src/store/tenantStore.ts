import { create } from 'zustand';
import type { Organisation } from '../types';

interface TenantState {
  org: Organisation | null;
  setOrg: (org: Organisation | null) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  org: null,
  setOrg: (org) => set({ org }),
}));
