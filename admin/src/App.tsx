import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthInit } from './hooks/useAuthInit';
import { useThemeInit } from './hooks/useThemeInit';
import { isConfigured, missingEnvVars } from './lib/env';
import ConfigError from './components/ConfigError';
import NotAuthorised from './components/NotAuthorised';
import AdminShell from './components/layout/AdminShell';
import Login from './pages/auth/Login';
import PlatformDashboard from './pages/dashboard/PlatformDashboard';
import OrganisationList from './pages/organisations/OrganisationList';
import OrganisationDetail from './pages/organisations/OrganisationDetail';
import UserList from './pages/users/UserList';
import UserDetail from './pages/users/UserDetail';

const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
  </div>
);

/**
 * Requires a session AND `systemRole === 'SYSTEM_ADMIN'`.
 *
 * Note what this deliberately does NOT do: it does not reuse the tenant app's
 * `ProfileGuard`, which redirects any profile without an `organisationId` to
 * `/onboarding/company`. Platform admins have no organisation by design, so that
 * guard would trap every one of them in a loop they can never complete.
 *
 * It also waits for `profileLoading` to finish, because `systemRole` arrives with
 * the profile — deciding earlier would reject a legitimate admin on every reload.
 */
function SystemAdminRoute({ children }: { children: React.ReactNode }) {
  const { authReady, isAuthenticated, profile, profileLoading } = useAuth();

  if (!authReady || profileLoading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!profile) return <Spinner />;
  if (profile.systemRole !== 'SYSTEM_ADMIN') return <NotAuthorised />;
  return <>{children}</>;
}

function LoginRoute() {
  const { authReady, isAuthenticated } = useAuth();
  if (!authReady) return <Spinner />;
  return isAuthenticated ? <Navigate to="/" replace /> : <Login />;
}

export default function App() {
  useAuthInit();
  useThemeInit();

  // Hooks run first so their order stays unconditional.
  if (!isConfigured) return <ConfigError missing={missingEnvVars} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route
          element={
            <SystemAdminRoute>
              <AdminShell />
            </SystemAdminRoute>
          }
        >
          <Route path="/" element={<PlatformDashboard />} />
          <Route path="/organisations" element={<OrganisationList />} />
          <Route path="/organisations/:id" element={<OrganisationDetail />} />
          <Route path="/users" element={<UserList />} />
          <Route path="/users/:id" element={<UserDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
