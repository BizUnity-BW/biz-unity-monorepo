/** Shown instead of the app when required env vars are missing or unfilled. */
export default function ConfigError({ missing }: { missing: string[] }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="w-full max-w-xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-widest text-amber-500 uppercase">
          Configuration
        </p>
        <h1 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
          The admin app can&rsquo;t start yet
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          These environment variables are missing or still set to their example placeholders:
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
          <p>
            Copy <span className="font-mono">admin/.env.example</span> to{' '}
            <span className="font-mono">admin/.env.local</span> and fill in the values. Use the{' '}
            <strong className="text-[var(--color-text)]">anon</strong> key, never the service-role
            key.
          </p>
          <p className="text-[var(--color-text-secondary)]">
            Vite reads env only at startup, so restart the dev server afterwards.
          </p>
        </div>
      </div>
    </div>
  );
}
