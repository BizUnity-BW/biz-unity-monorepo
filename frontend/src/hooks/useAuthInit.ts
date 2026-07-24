import { useEffect } from 'react';
import { supabase, useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';

/**
 * Initialises the Supabase auth subscription.
 * Must be called exactly ONCE at the top of the component tree (App).
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

    // Restore session on page load. Mark auth "ready" only AFTER the session (and, if signed
    // in, the initial profile) has resolved — route guards wait for this so a hard page load
    // doesn't redirect to /login before the session is restored.
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

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchProfile();
      }

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setOrganisation(null);
      }
    });

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
