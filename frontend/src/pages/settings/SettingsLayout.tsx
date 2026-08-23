import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/settings/organisation', label: 'Organisation' },
  { to: '/settings/documents', label: 'Compliance documents' },
  { to: '/settings/profile', label: 'My profile' },
];

/**
 * Shared chrome for the settings pages.
 *
 * A pathless layout route with its own `<Outlet/>`, the same pattern `AppShell`
 * already establishes one level up.
 */
export default function SettingsLayout() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Settings</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Your organisation profile, compliance pack and personal details.
      </p>

      <nav className="mt-6 mb-6 flex gap-1 overflow-x-auto border-b border-[var(--color-border)]">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
