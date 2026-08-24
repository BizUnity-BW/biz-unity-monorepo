import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile, Organisation } from '../types';
import { supabaseUrl, supabaseAnonKey } from '../lib/env';

// Values come from lib/env so a missing one cannot throw here. This module is
// evaluated before React mounts, so a throw took the whole page down with no
// visible error; App renders ConfigError instead.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthState {
  // Supabase session
  user: User | null;
  session: Session | null;
  // Backend profile
  profile: UserProfile | null;
  organisation: Organisation | null;
  profileLoading: boolean;
  // True once the initial session restore (+ profile fetch, if signed in) has completed.
  // Route guards must wait for this before deciding to redirect, or a hard page load
  // redirects to /login before the session is restored (deep-link bounce).
  authReady: boolean;
  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setOrganisation: (organisation: Organisation | null) => void;
  setProfileLoading: (loading: boolean) => void;
  setAuthReady: (ready: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  organisation: null,
  profileLoading: false,
  authReady: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),

  setProfile: (profile) => set({ profile }),

  setOrganisation: (organisation) => set({ organisation }),

  setProfileLoading: (profileLoading) => set({ profileLoading }),

  setAuthReady: (authReady) => set({ authReady }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, organisation: null });
  },
}));
