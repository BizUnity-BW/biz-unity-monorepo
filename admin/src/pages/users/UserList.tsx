import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usersApi } from '../../api/users';
import { formatDate, errMessage } from '../../lib/format';
import Pagination from '../../components/ui/Pagination';
import type { AdminUser, OrgRole, PaginationMeta, SystemRole } from '../../types';

export default function UserList() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [search, setSearch] = useState('');
  const [systemRole, setSystemRole] = useState<'' | SystemRole>('');
  const [orgRole, setOrgRole] = useState<'' | OrgRole>('');
  // 'none' is the only way to find platform staff and orphaned profiles, since they
  // belong to no organisation and so appear under no org filter.
  const [orgFilter, setOrgFilter] = useState<'' | 'none'>('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    const timer = setTimeout(() => {
      (async () => {
        try {
          const res = await usersApi.list({
            page,
            search,
            systemRole: systemRole || undefined,
            orgRole: orgRole || undefined,
            organisationId: orgFilter || undefined,
          });
          if (ignore) return;
          setRows(res.data.data);
          setMeta(res.data.meta);
          setError(null);
        } catch (err) {
          if (!ignore) setError(errMessage(err, 'Could not load users.'));
        } finally {
          if (!ignore) setLoading(false);
        }
      })();
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [page, search, systemRole, orgRole, orgFilter]);

  const selectClass =
    'rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-amber-500';

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-xl font-semibold text-[var(--color-text)]">Users</h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        Every profile on the platform, in any organisation or none.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search name or email"
          className={`${selectClass} w-full sm:max-w-xs`}
        />
        <select
          value={systemRole}
          onChange={(e) => {
            setPage(1);
            setSystemRole(e.target.value as '' | SystemRole);
          }}
          className={selectClass}
        >
          <option value="">Any platform role</option>
          <option value="SYSTEM_ADMIN">Platform admin</option>
          <option value="SYSTEM_USER">Regular user</option>
        </select>
        <select
          value={orgRole}
          onChange={(e) => {
            setPage(1);
            setOrgRole(e.target.value as '' | OrgRole);
          }}
          className={selectClass}
        >
          <option value="">Any org role</option>
          <option value="OWNER">Owner</option>
          <option value="MANAGER">Manager</option>
          <option value="SALES">Sales</option>
        </select>
        <select
          value={orgFilter}
          onChange={(e) => {
            setPage(1);
            setOrgFilter(e.target.value as '' | 'none');
          }}
          className={selectClass}
        >
          <option value="">Any organisation</option>
          <option value="none">No organisation</option>
        </select>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[44rem] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-xs tracking-wider text-[var(--color-text-secondary)] uppercase">
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Organisation</th>
              <th className="px-4 py-3 font-semibold">Org role</th>
              <th className="px-4 py-3 font-semibold">Platform</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-[var(--color-text-secondary)]">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-[var(--color-text-secondary)]">
                  No users match these filters.
                </td>
              </tr>
            ) : (
              rows.map((user) => (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-[var(--color-surface-hover)]"
                >
                  <td className="px-4 py-3">
                    <Link to={`/users/${user.id}`} className="block">
                      <span className="font-medium text-[var(--color-text)]">
                        {[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
                      </span>
                      <span className="block text-xs text-[var(--color-text-muted)]">
                        {user.email}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {user.organisation ? (
                      <Link
                        to={`/organisations/${user.organisation.id}`}
                        className="hover:text-amber-500"
                      >
                        {user.organisation.name}
                      </Link>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {user.organisation ? user.orgRole : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {user.systemRole === 'SYSTEM_ADMIN' ? (
                      <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-500 uppercase">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}
