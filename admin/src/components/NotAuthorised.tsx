import { useAuth } from '../hooks/useAuth';

/**
 * Shown to a signed-in user who is not a platform admin.
 *
 * Deliberately not a redirect: bouncing them to /login while their session is still
 * valid produces a loop, since the session restores and lands here again. Sign-out
 * is offered as the way out instead.
 */
export default function NotAuthorised() {
  const { profile, signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center sm:p-8">
        <p className="text-xs font-semibold tracking-widest text-amber-500 uppercase">
          Not authorised
        </p>
        <h1 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
          This console is for BizUnity staff
        </h1>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          {profile?.email ? (
            <>
              You are signed in as{' '}
              <span className="font-mono text-[var(--color-text)]">{profile.email}</span>, which
              does not have platform-admin access.
            </>
          ) : (
            <>This account does not have platform-admin access.</>
          )}
        </p>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          If you are looking for your own organisation&rsquo;s dashboard, use the main BizUnity app
          instead.
        </p>
        <button
          onClick={() => void signOut()}
          className="mt-6 w-full rounded-lg border border-[var(--color-border-strong)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
