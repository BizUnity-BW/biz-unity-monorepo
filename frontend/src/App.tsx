import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAuthInit } from './hooks/useAuthInit';
import { useThemeInit } from './hooks/useThemeInit';
import { supabase } from './store/authStore';
import LandingPage from './pages/LandingPage';
import AppShell from './components/layout/AppShell';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPasswordCallback from './pages/auth/ResetPasswordCallback';
import CompleteProfile from './pages/onboarding/CompleteProfile';
import CompanySetup from './pages/onboarding/CompanySetup';
import TenantDashboard from './pages/dashboard/TenantDashboard';
import CustomerList from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import QuotationList from './pages/quotations/QuotationList';
import QuotationForm from './pages/quotations/QuotationForm';
import InvoiceList from './pages/invoices/InvoiceList';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import PaymentHistory from './pages/payments/PaymentHistory';
import VerifiedPaymentsStatement from './pages/payments/VerifiedPaymentsStatement';
import SettingsLayout from './pages/settings/SettingsLayout';
import OrganisationSettings from './pages/settings/OrganisationSettings';
import ComplianceDocuments from './pages/settings/ComplianceDocuments';
import ProfileSettings from './pages/settings/ProfileSettings';
import ConfigError from './components/ConfigError';
import { isConfigured, missingEnvVars } from './lib/env';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Public landing page   redirects to /dashboard if already signed in
function RootRoute() {
  const { isAuthenticated, authReady } = useAuth();
  if (!authReady) return <Spinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

// Redirect to dashboard if already signed in
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady } = useAuth();
  if (!authReady) return <Spinner />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

// Enforces profile completion and org setup before reaching app routes
function ProfileGuard({ children }: { children: React.ReactNode }) {
  const { authReady, profileLoading, isProfileComplete, hasOrganisation } = useAuth();
  if (!authReady || profileLoading) return <Spinner />;
  if (!isProfileComplete) return <Navigate to="/onboarding/profile" replace />;
  if (!hasOrganisation) return <Navigate to="/onboarding/company" replace />;
  return <>{children}</>;
}

// Requires auth + enforces onboarding completion
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady } = useAuth();
  if (!authReady) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <ProfileGuard>{children}</ProfileGuard>;
}

// Auth required but onboarding steps are NOT enforced
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady } = useAuth();
  if (!authReady) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Listens for the PASSWORD_RECOVERY event and redirects to the reset page
function PasswordRecoveryListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') navigate('/reset-password');
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate]);
  return null;
}

export default function App() {
  useAuthInit();
  useThemeInit();

  // Before anything tries to reach Supabase with placeholder credentials, say what
  // is missing. Hooks run first so their order stays unconditional.
  if (!isConfigured) return <ConfigError missing={missingEnvVars} />;

  return (
    <BrowserRouter>
      <PasswordRecoveryListener />
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<RootRoute />} />

        {/* Public auth routes */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          }
        />
        <Route
          path="/register"
          element={
            <AuthRoute>
              <Register />
            </AuthRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthRoute>
              <ForgotPassword />
            </AuthRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPasswordCallback />} />

        {/* Onboarding   auth required, but NOT behind ProfileGuard */}
        <Route
          path="/onboarding/profile"
          element={
            <OnboardingRoute>
              <CompleteProfile />
            </OnboardingRoute>
          }
        />
        <Route
          path="/onboarding/company"
          element={
            <OnboardingRoute>
              <CompanySetup />
            </OnboardingRoute>
          }
        />

        {/* App   auth + onboarding required */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<TenantDashboard />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/quotations" element={<QuotationList />} />
          <Route path="/quotations/new" element={<QuotationForm />} />
          <Route path="/quotations/:id/edit" element={<QuotationForm />} />
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/payments" element={<PaymentHistory />} />
          <Route path="/payments/statement" element={<VerifiedPaymentsStatement />} />
          <Route path="/settings" element={<Navigate to="/settings/organisation" replace />} />
          <Route element={<SettingsLayout />}>
            <Route path="/settings/organisation" element={<OrganisationSettings />} />
            <Route path="/settings/documents" element={<ComplianceDocuments />} />
            <Route path="/settings/profile" element={<ProfileSettings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
