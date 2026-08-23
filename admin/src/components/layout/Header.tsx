import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../ui/ThemeToggle';

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { profile, signOut } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-header)] px-4 py-3 sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] md:hidden"
        aria-label="Open navigation"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
          />
        </svg>
      </button>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-sm text-[var(--color-text-secondary)] sm:inline">
          {profile?.email}
        </span>
        <ThemeToggle />
        <button
          onClick={() => void signOut()}
          className="rounded-lg border border-[var(--color-border-strong)] px-3 py-1.5 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
