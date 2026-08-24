import { useAuthStore } from '../store/authStore';

/**
 * The tenant app's hook minus `isProfileComplete` / `hasOrganisation`, plus
 * `isSystemAdmin`. Those two are deliberately absent: a platform admin has no
 * organisation, so any guard built on them would loop forever on onboarding.
 */
export function useAuth() {
  const store = useAuthStore();

  return {
    user: store.user,
    session: store.session,
    profile: store.profile,
    profileLoading: store.profileLoading,
    authReady: store.authReady,
    isAuthenticated: !!store.session,
    isSystemAdmin: store.profile?.systemRole === 'SYSTEM_ADMIN',
    signOut: store.signOut,
  };
}
