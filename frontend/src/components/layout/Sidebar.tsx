import { NavLink } from 'react-router-dom';
import { useThemeStore } from '../../store/themeStore';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';

interface Props {
  /** Mobile drawer open state (ignored at md+ where the sidebar is static). */
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

/** Sections exist so organisation-level links do not sit among the day-to-day ones. */
interface NavSection {
  heading?: string;
  items: NavItem[];
  /** Hidden for users who cannot act on it — the API 403s either way. */
  requiresOrgManagement?: boolean;
}

const PRIMARY: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    ),
  },
  {
    to: '/customers',
    label: 'Customers',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    ),
  },
  {
    to: '/quotations',
    label: 'Quotations',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 3.75h3M9 8.25h6M6.75 3h10.5A1.5 1.5 0 0118.75 4.5v15A1.5 1.5 0 0117.25 21H6.75A1.5 1.5 0 015.25 19.5v-15A1.5 1.5 0 016.75 3z"
      />
    ),
  },
  {
    to: '/invoices',
    label: 'Invoices',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 8.25h6m-6 3h6m-6 3h3.75M6.75 3h10.5a1.5 1.5 0 011.5 1.5v15.75l-3-1.5-2.25 1.5-2.25-1.5-2.25 1.5-3-1.5V4.5a1.5 1.5 0 011.5-1.5z"
      />
    ),
  },
  {
    to: '/payments',
    label: 'Payments',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3M3.75 5.25h16.5c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125H3.75c-.621 0-1.125-.504-1.125-1.125V6.375c0-.621.504-1.125 1.125-1.125z"
      />
    ),
  },
];

const ORGANISATION: NavItem[] = [
  {
    to: '/settings/documents',
    label: 'Compliance',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    to: '/settings/organisation',
    label: 'Settings',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.449-.12l.738.527c.35.25.806.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
      />
    ),
  },
  // Also add a Profile icon path? Kept to two: profile lives inside Settings.
];

export default function Sidebar({ open, onClose }: Props) {
  const theme = useThemeStore((s) => s.theme);
  const logo = theme === 'dark' ? '/BizUnity_Logo_BB.png' : '/BizUnity_Logo_WB.png';
  const { profile, organisation } = useAuth();

  const canManageOrg = profile?.orgRole === 'OWNER' || profile?.orgRole === 'MANAGER';
  const sections: NavSection[] = [
    { items: PRIMARY },
    { heading: 'Organisation', items: ORGANISATION, requiresOrgManagement: true },
  ];

  const orgInitials = (organisation?.name ?? 'B')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        data-print-hide
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 transform flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-200 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / brand */}
        <div className="flex h-16 items-center gap-2 border-b border-[var(--color-border)] px-5">
          <NavLink to="/dashboard" onClick={onClose}>
            <img src={logo} alt="BizUnity" className="h-7 w-auto" />
          </NavLink>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {sections
            .filter((section) => !section.requiresOrgManagement || canManageOrg)
            .map((section, index) => (
              <div key={section.heading ?? `section-${index}`} className="flex flex-col gap-1">
                {section.heading && (
                  <p className="mt-3 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-faint)]">
                    {section.heading}
                  </p>
                )}
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                      }`
                    }
                  >
                    <svg
                      className="h-5 w-5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                    >
                      {item.icon}
                    </svg>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ))}
        </nav>

        {/* The org logo's permanent home — which is most of the reason to upload one. */}
        <div className="flex items-center gap-2.5 border-t border-[var(--color-border)] px-4 py-3.5">
          <Avatar url={organisation?.logoUrl} initials={orgInitials} sizeClass="h-7 w-7" />
          <span className="truncate text-xs font-semibold text-[var(--color-text-secondary)]">
            {organisation?.name ?? 'BizUnity'}
          </span>
        </div>
      </aside>
    </>
  );
}
