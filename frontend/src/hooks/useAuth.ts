import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';

export function useAuth() {
  const store = useAuthStore();

  async function fetchProfile() {
    // Bail out if a fetch is already in flight
    if (useAuthStore.getState().profileLoading) return;

    store.setProfileLoading(true);
    try {
      const res = await authApi.getMe();
      store.setProfile(res.data.data.profile);
      store.setOrganisation(res.data.data.organisation);
    } catch {
      store.setProfile(null);
      store.setOrganisation(null);
    } finally {
      store.setProfileLoading(false);
    }
  }

  return {
    user: store.user,
    session: store.session,
    profile: store.profile,
    organisation: store.organisation,
    profileLoading: store.profileLoading,
    isAuthenticated: !!store.session,
    isProfileComplete: !!store.profile?.firstName && !!store.profile?.lastName,
    hasOrganisation: !!store.profile?.organisationId,
    fetchProfile,
    signOut: store.signOut,
  };
}
