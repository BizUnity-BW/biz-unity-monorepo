import { useEffect } from 'react';
import { supabase, useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';

/**
 * Initialises the Supabase auth subscription. Call exactly once, at the top of the
 * tree. Mirrors the tenant app's hook — the profile fetch is what carries
 * `systemRole`, so the route guard depends on it having completed.
 */
export function useAuthInit() {
  const { setSession, setProfile, setOrganisation, setProfileLoading, setAuthReady } =
    useAuthStore();

  useEffect(() => {
    let isFetching = false;

    async function fetchProfile() {
      if (isFetching || useAuthStore.getState().profileLoading) return;
      isFetching = true;
      setProfileLoading(true);
      try {
        const res = await authApi.getMe();
        setProfile(res.data.data.profile);
        setOrganisation(res.data.data.organisation);
      } catch {
        setProfile(null);
        setOrganisation(null);
      } finally {
        setProfileLoading(false);
        isFetching = false;
      }
    }

    // Mark auth ready only once the session and, if signed in, the profile have
    // resolved: the guard checks systemRole, so deciding earlier would bounce a
    // legitimate admin on every hard page load.
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        if (data.session) await fetchProfile();
      } finally {
        setAuthReady(true);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') fetchProfile();
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setOrganisation(null);
      }
    });

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
