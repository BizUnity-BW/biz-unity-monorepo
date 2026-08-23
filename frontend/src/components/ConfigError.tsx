/**
 * Shown instead of the app when required env vars are missing or still hold their
 * `.env.example` placeholders. Replaces what used to happen in that case: a black
 * page with an empty `#root` and nothing in the UI to explain it.
 */
export default function ConfigError({ missing }: { missing: string[] }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="w-full max-w-xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-widest text-amber-500 uppercase">
          Configuration
        </p>
        <h1 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
          The app can&rsquo;t start yet
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {missing.length === 1
            ? 'One required environment variable is missing or still set to its example placeholder:'
            : `${missing.length} required environment variables are missing or still set to their example placeholders:`}
        </p>

        <ul className="mt-4 space-y-1">
          {missing.map((name) => (
            <li
              key={name}
              className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] px-3 py-2 font-mono text-sm text-[var(--color-text)]"
            >
              {name}
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-3 text-sm text-[var(--color-text-secondary)]">
          <p className="font-medium text-[var(--color-text)]">To fix it</p>
          <p>
            From the repo root, create the env files if you haven&rsquo;t already, then fill in the
            real values:
          </p>
          <pre className="overflow-x-auto rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-3 font-mono text-xs text-[var(--color-text)]">
            ./scripts/dev-setup.sh
          </pre>
          <p>
            Values come from your Supabase project dashboard, under{' '}
            <span className="text-[var(--color-text)]">Project Settings → API</span>.
          </p>
          <p className="text-[var(--color-text-secondary)]">
            Vite reads env files only at startup, so restart{' '}
            <span className="font-mono">npm run dev</span> after editing{' '}
            <span className="font-mono">frontend/.env.local</span> — the page will not hot-reload
            the change.
          </p>
        </div>
      </div>
    </div>
  );
}
