import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useThemeStore } from '../../store/themeStore';
import ThemeToggle from '../ui/ThemeToggle';

interface Props {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: Props) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const theme = useThemeStore((s) => s.theme);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const initials =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
      : profile?.email?.[0].toUpperCase() ?? '?';

  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.email ?? '';

  const logo = theme === 'dark' ? '/BizUnity_Logo_BB.png' : '/BizUnity_Logo_WB.png';

  return (
    <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-header)] flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      {/* Left — hamburger (mobile only) to open the sidebar drawer */}
      <button
        onClick={onMenuClick}
        className="md:hidden -ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
      <div className="hidden md:block" />

      {/* Right   theme toggle + user + sign out */}
      <div className="flex items-center gap-2">
        {/* Logo (small, contextual) */}
        <img src={logo} alt="BizUnity" className="h-6 w-auto opacity-60 hidden md:block mr-1" />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--color-border)]" />

        {/* Avatar + name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center justify-center">
            {initials}
          </div>
          <span className="text-sm text-[var(--color-text-muted)] hidden md:block">{displayName}</span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--color-border)]" />

        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/8"
          title="Sign out"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          <span className="hidden md:block">Sign out</span>
        </button>
      </div>
    </header>
  );
}
