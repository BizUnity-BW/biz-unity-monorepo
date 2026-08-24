import { NavLink } from 'react-router-dom';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Nav is intentionally sparse. Payment verification, documents and feature flags all
 * land here later (ClickUp 86cawpynt, 86cawph38), so the list is built to grow
 * rather than to fit today's three items.
 */
const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/organisations', label: 'Organisations', end: false },
  { to: '/users', label: 'Users', end: false },
];

export default function Sidebar({ open, onClose }: Props) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-4">
          <span className="text-base font-semibold text-[var(--color-text)]">BizUnity</span>
          {/* The persistent marker: staff often run both apps at once, and mistaking
              the cross-tenant console for the tenant app is the expensive mistake. */}
          <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-amber-500 uppercase">
            Admin
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-amber-500/10 font-medium text-amber-500'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <p className="border-t border-[var(--color-border)] px-5 py-3 text-xs text-[var(--color-text-muted)]">
          Cross-tenant. Every read here spans all organisations.
        </p>
      </aside>
    </>
  );
}
