import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usersApi } from '../../api/users';
import { organisationsApi } from '../../api/organisations';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, errMessage } from '../../lib/format';
import type { AdminOrganisation, AdminUser, OrgRole, SystemRole } from '../../types';

/**
 * The only write surface in the admin app so far. Both actions are cross-tenant and
 * privileged, so each one confirms in place, naming the user and the exact change,
 * and surfaces the backend's guard-rail message inline rather than as a toast — the
 * refusals ("this is the last OWNER") are instructions, not noise.
 *
 * These writes are not yet audited: ClickUp 86cb8q61m adds the trail.
 */
export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile: me } = useAuth();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [orgs, setOrgs] = useState<AdminOrganisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [systemRole, setSystemRole] = useState<SystemRole>('SYSTEM_USER');
  const [orgRole, setOrgRole] = useState<OrgRole>('SALES');
  const [orgId, setOrgId] = useState<string>('');

  const [pending, setPending] = useState<'roles' | 'organisation' | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function adopt(next: AdminUser) {
    setUser(next);
    setSystemRole(next.systemRole);
    setOrgRole(next.orgRole);
    setOrgId(next.organisationId ?? '');
  }

  useEffect(() => {
    if (!id) return;
    let ignore = false;

    (async () => {
      try {
        // The org list feeds the reassignment picker. Capped at the API's max page
        // size, so a platform with more than 100 organisations needs a searchable
        // picker here rather than a select.
        const [userRes, orgRes] = await Promise.all([
          usersApi.get(id),
          organisationsApi.list({ limit: 100 }),
        ]);
        if (ignore) return;
        adopt(userRes.data.data);
        setOrgs(orgRes.data.data);
      } catch (err) {
        if (!ignore) setLoadError(errMessage(err, 'Could not load this user.'));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [id]);

  async function submit(kind: 'roles' | 'organisation') {
    if (!id) return;
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      const res =
        kind === 'roles'
          ? await usersApi.setRoles(id, {
              systemRole,
              ...(user?.organisationId ? { orgRole } : {}),
            })
          : await usersApi.setOrganisation(id, orgId || null);
      adopt(res.data.data);
      setNotice(kind === 'roles' ? 'Roles updated.' : 'Organisation updated.');
      setPending(null);
    } catch (err) {
      setActionError(errMessage(err, 'The change was rejected.'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-[var(--color-text-secondary)]">Loading…</p>;

  if (loadError || !user) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link to="/users" className="text-sm text-amber-500 hover:text-amber-400">
          ← Users
        </Link>
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {loadError ?? 'Not found.'}
        </p>
      </div>
    );
  }

  const isSelf = me?.id === user.id;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const rolesDirty =
    systemRole !== user.systemRole || (!!user.organisationId && orgRole !== user.orgRole);
  const orgDirty = (orgId || null) !== (user.organisationId ?? null);
  const selectClass =
    'w-full rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-amber-500 disabled:opacity-50';

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/users" className="text-sm text-amber-500 hover:text-amber-400">
        ← Users
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">{name}</h1>
        {user.systemRole === 'SYSTEM_ADMIN' && (
          <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-bold tracking-wider text-amber-500 uppercase">
            Platform admin
          </span>
        )}
        {isSelf && (
          <span className="rounded border border-[var(--color-border-strong)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
            This is you
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{user.email}</p>

      <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <dl className="space-y-2 text-sm">
          <Row label="Organisation">
            {user.organisation ? (
              <Link
                to={`/organisations/${user.organisation.id}`}
                className="text-amber-500 hover:text-amber-400"
              >
                {user.organisation.name}
              </Link>
            ) : (
              <span className="text-[var(--color-text-muted)]">None (platform staff)</span>
            )}
          </Row>
          <Row label="Phone">{user.phone || '—'}</Row>
          <Row label="Joined">{formatDate(user.createdAt)}</Row>
        </dl>
      </div>

      {notice && (
        <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          {notice}
        </p>
      )}
      {actionError && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {actionError}
        </p>
      )}

      {/* ── Roles ─────────────────────────────────────────────────────────── */}
      <section className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">Roles</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="block text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
              Platform role
            </span>
            <select
              value={systemRole}
              onChange={(e) => setSystemRole(e.target.value as SystemRole)}
              className={`mt-1.5 ${selectClass}`}
            >
              <option value="SYSTEM_USER">Regular user</option>
              <option value="SYSTEM_ADMIN">Platform admin</option>
            </select>
            {isSelf && systemRole !== 'SYSTEM_ADMIN' && (
              <span className="mt-1 block text-xs text-red-400">
                You cannot remove your own admin access — the server will refuse this.
              </span>
            )}
          </label>

          <label className="block">
            <span className="block text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
              Organisation role
            </span>
            <select
              value={orgRole}
              disabled={!user.organisationId}
              onChange={(e) => setOrgRole(e.target.value as OrgRole)}
              className={`mt-1.5 ${selectClass}`}
            >
              <option value="OWNER">Owner</option>
              <option value="MANAGER">Manager</option>
              <option value="SALES">Sales</option>
            </select>
            {!user.organisationId && (
              <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
                No organisation, so this has no effect.
              </span>
            )}
          </label>
        </div>

        {pending === 'roles' ? (
          <Confirm
            busy={busy}
            message={`Change ${name}'s platform role to ${systemRole === 'SYSTEM_ADMIN' ? 'platform admin' : 'regular user'}${user.organisationId ? ` and organisation role to ${orgRole}` : ''}?`}
            onCancel={() => setPending(null)}
            onConfirm={() => void submit('roles')}
          />
        ) : (
          <button
            disabled={!rolesDirty}
            onClick={() => setPending('roles')}
            className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:opacity-40"
          >
            Save roles
          </button>
        )}
      </section>

      {/* ── Organisation ──────────────────────────────────────────────────── */}
      <section className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">Organisation</h2>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          Detaching a user makes them platform staff. Suspended organisations cannot be assigned.
        </p>
        <select
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          className={`mt-3 ${selectClass}`}
        >
          <option value="">No organisation (platform staff)</option>
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>

        {pending === 'organisation' ? (
          <Confirm
            busy={busy}
            message={
              orgId
                ? `Move ${name} to ${orgs.find((o) => o.id === orgId)?.name ?? 'that organisation'}?`
                : `Detach ${name} from their organisation?`
            }
            onCancel={() => setPending(null)}
            onConfirm={() => void submit('organisation')}
          />
        ) : (
          <button
            disabled={!orgDirty}
            onClick={() => setPending('organisation')}
            className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:opacity-40"
          >
            Save organisation
          </button>
        )}
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[var(--color-text-secondary)]">{label}</dt>
      <dd className="text-right text-[var(--color-text)]">{children}</dd>
    </div>
  );
}

function Confirm({
  message,
  busy,
  onConfirm,
  onCancel,
}: {
  message: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <p className="text-sm text-[var(--color-text)]">{message}</p>
      <div className="mt-3 flex gap-2">
        <button
          disabled={busy}
          onClick={onConfirm}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Confirm'}
        </button>
        <button
          disabled={busy}
          onClick={onCancel}
          className="rounded-lg border border-[var(--color-border-strong)] px-4 py-2 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
