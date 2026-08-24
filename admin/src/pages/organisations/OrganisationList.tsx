import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { organisationsApi } from '../../api/organisations';
import { formatDate, errMessage } from '../../lib/format';
import Pagination from '../../components/ui/Pagination';
import SkeletonShimmer from '../../components/ui/SkeletonShimmer';
import { PLACEHOLDER_ORGANISATIONS } from '../../lib/skeletonPlaceholders';
import type { AdminOrganisation, PaginationMeta } from '../../types';

/** Read-only. Editing and suspend/restore are ClickUp 86cb8q623. */
export default function OrganisationList() {
  const [loadedRows, setLoadedRows] = useState<AdminOrganisation[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    // Debounced so typing in the search box does not fire a cross-tenant query
    // per keystroke.
    const timer = setTimeout(() => {
      (async () => {
        try {
          const res = await organisationsApi.list({ page, search, includeDeleted });
          if (ignore) return;
          setLoadedRows(res.data.data);
          setMeta(res.data.meta);
          setError(null);
        } catch (err) {
          if (!ignore) setError(errMessage(err, 'Could not load organisations.'));
        } finally {
          if (!ignore) setLoading(false);
        }
      })();
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [page, search, includeDeleted]);

  // Placeholder rows so the table shimmers instead of showing a bare "Loading…".
  // The convention doc notes this library gains nothing over a hand-rolled skeleton
  // on list pages — true, but it keeps one visual language across the app and brings
  // the `inert` guard with it. Only the table is wrapped, so the filters above stay
  // usable while a search is in flight.
  const rows = loading ? PLACEHOLDER_ORGANISATIONS : loadedRows;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-xl font-semibold text-[var(--color-text)]">Organisations</h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        Every organisation on the platform.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search name, slug or email"
          className="w-full rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-amber-500 sm:max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => {
              setPage(1);
              setIncludeDeleted(e.target.checked);
            }}
            className="accent-amber-500"
          />
          Include suspended
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <SkeletonShimmer loading={loading}>
        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs tracking-wider text-[var(--color-text-secondary)] uppercase">
                <th className="px-4 py-3 font-semibold">Organisation</th>
                <th className="px-4 py-3 font-semibold">Currency</th>
                <th className="px-4 py-3 text-right font-semibold">Users</th>
                <th className="px-4 py-3 text-right font-semibold">Customers</th>
                <th className="px-4 py-3 text-right font-semibold">Invoices</th>
                <th className="px-4 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-[var(--color-text-secondary)]">
                    {search ? `No organisations match “${search}”.` : 'No organisations yet.'}
                  </td>
                </tr>
              ) : (
                rows.map((org) => (
                  <tr
                    key={org.id}
                    className="transition-colors hover:bg-[var(--color-surface-hover)]"
                  >
                    <td className="px-4 py-3">
                      <Link to={`/organisations/${org.id}`} className="block">
                        <span className="font-medium text-[var(--color-text)]">{org.name}</span>
                        {org.deletedAt && (
                          <span className="ml-2 rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-red-400 uppercase">
                            Suspended
                          </span>
                        )}
                        <span className="block font-mono text-xs text-[var(--color-text-muted)]">
                          {org.slug}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{org.currency}</td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                      {org._count.userProfiles}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                      {org._count.customers}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                      {org._count.invoices}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {formatDate(org.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SkeletonShimmer>

      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}
