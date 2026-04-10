import { useEffect } from 'react';
import { supabase, useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, session, setSession, signOut } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, [setSession]);

  return { user, session, signOut, isAuthenticated: !!session };
}
