import { useEffect } from 'react';
import { supabase, useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';

/**
 * Initialises the Supabase auth subscription.
 * Must be called exactly ONCE at the top of the component tree (App).
 */
export function useAuthInit() {
  const { setSession, setProfile, setOrganisation, setProfileLoading } = useAuthStore();

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

    // Restore session on page load
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) fetchProfile();
    });

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
