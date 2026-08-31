import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { organisationsApi } from '../../api/organisations';
import { usersApi } from '../../api/users';
import { formatDate, errMessage } from '../../lib/format';
import SkeletonShimmer from '../../components/ui/SkeletonShimmer';
import { PLACEHOLDER_ORGANISATIONS } from '../../lib/skeletonPlaceholders';
import type { AdminOrganisation } from '../../types';

/**
 * Built from no new endpoints on purpose.
 *
 * The counts come from `meta.total` on the existing list endpoints with `limit=1`,
 * and the recent list from `limit=5`. Money aggregates, payment volume and the
 * 12-month trend chart belong to ClickUp 86cb8q4zx, so they are left out rather than
 * half-built here.
 */
export default function PlatformDashboard() {
  const [orgCount, setOrgCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [recent, setRecent] = useState<AdminOrganisation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const [orgsHead, usersHead, recentOrgs] = await Promise.all([
          organisationsApi.list({ limit: 1 }),
          usersApi.list({ limit: 1 }),
          organisationsApi.list({ limit: 5 }),
        ]);
        if (ignore) return;
        setOrgCount(orgsHead.data.meta?.total ?? 0);
        setUserCount(usersHead.data.meta?.total ?? 0);
        setRecent(recentOrgs.data.data);
      } catch (err) {
        if (!ignore) setError(errMessage(err, 'Could not load platform figures.'));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  // Rendered through stand-ins while loading: SkeletonShimmer measures the real
  // boxes, so short-circuiting to a spinner would give it nothing to measure.
  const rows = loading ? PLACEHOLDER_ORGANISATIONS : recent;
  const orgs = loading ? 12 : orgCount;
  const users = loading ? 34 : userCount;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 data-shimmer-ignore className="text-xl font-semibold text-[var(--color-text)]">
        Platform
      </h1>
      <p data-shimmer-ignore className="mt-1 text-sm text-[var(--color-text-secondary)]">
        Every figure here spans all organisations.
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <SkeletonShimmer loading={loading}>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Tile label="Organisations" value={orgs} to="/organisations" />
          <Tile label="User profiles" value={users} to="/users" />
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2
              data-shimmer-ignore
              className="text-sm font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase"
            >
              Newest organisations
            </h2>
            <Link
              to="/organisations"
              data-shimmer-ignore
              className="text-sm text-amber-500 hover:text-amber-400"
            >
              View all
            </Link>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            {!loading && rows.length === 0 ? (
              <p className="p-4 text-sm text-[var(--color-text-secondary)]">
                No organisations yet. The first one appears when someone completes company setup.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-border-subtle)]">
                {rows.map((org) => (
                  <li key={org.id}>
                    <Link
                      to={`/organisations/${org.id}`}
                      className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-[var(--color-surface-hover)]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-[var(--color-text)]">
                          {org.name}
                        </span>
                        <span className="block truncate font-mono text-xs text-[var(--color-text-muted)]">
                          {org.slug}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-[var(--color-text-secondary)]">
                        {org._count.userProfiles} {org._count.userProfiles === 1 ? 'user' : 'users'}{' '}
                        · {formatDate(org.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </SkeletonShimmer>
    </div>
  );
}

function Tile({ label, value, to }: { label: string; value: number | null; to: string }) {
  return (
    <Link
      to={to}
      className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:bg-[var(--color-surface-hover)]"
    >
      <p
        data-shimmer-ignore
        className="text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase"
      >
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-[var(--color-text)]">{value ?? '—'}</p>
    </Link>
  );
}
