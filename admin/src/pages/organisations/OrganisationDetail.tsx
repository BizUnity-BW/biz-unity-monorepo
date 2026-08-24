import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { organisationsApi } from '../../api/organisations';
import { formatDate, errMessage } from '../../lib/format';
import SkeletonShimmer from '../../components/ui/SkeletonShimmer';
import { PLACEHOLDER_ORGANISATION_DETAIL } from '../../lib/skeletonPlaceholders';
import type { AdminOrganisationDetail } from '../../types';

/** Read-only. Editing and suspend/restore are ClickUp 86cb8q623. */
export default function OrganisationDetail() {
  const { id } = useParams<{ id: string }>();
  const [loaded, setLoaded] = useState<AdminOrganisationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let ignore = false;

    (async () => {
      try {
        const res = await organisationsApi.get(id);
        if (!ignore) setLoaded(res.data.data);
      } catch (err) {
        if (!ignore) setError(errMessage(err, 'Could not load this organisation.'));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [id]);

  if (!loading && (error || !loaded)) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link to="/organisations" className="text-sm text-amber-500 hover:text-amber-400">
          ← Organisations
        </Link>
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error ?? 'Not found.'}
        </p>
      </div>
    );
  }

  // Rendered through a stand-in while loading: SkeletonShimmer measures the real
  // boxes, so returning a spinner instead would leave it nothing to measure.
  const org = loaded ?? PLACEHOLDER_ORGANISATION_DETAIL;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/organisations"
        data-shimmer-ignore
        className="text-sm text-amber-500 hover:text-amber-400"
      >
        ← Organisations
      </Link>

      <SkeletonShimmer loading={loading}>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{org.name}</h1>
          {org.deletedAt && (
            <span className="rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-bold tracking-wider text-red-400 uppercase">
              Suspended {formatDate(org.deletedAt)}
            </span>
          )}
        </div>
        <p className="mt-1 font-mono text-sm text-[var(--color-text-muted)]">{org.slug}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Panel title="Profile">
            <Field label="Email" value={org.email} />
            <Field label="Phone" value={org.phone} />
            <Field label="Address" value={org.address} />
            <Field label="VAT number" value={org.vatNumber} />
            <Field label="Currency" value={org.currency} />
            <Field label="Created" value={formatDate(org.createdAt)} />
          </Panel>

          <Panel title="Activity">
            <Field label="Users" value={String(org._count.userProfiles)} />
            <Field label="Customers" value={String(org._count.customers)} />
            <Field label="Quotations" value={String(org._count.quotations)} />
            <Field label="Invoices" value={String(org._count.invoices)} />
            <Field label="Payments" value={String(org._count.payments)} />
          </Panel>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
            Members
          </h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            {org.userProfiles.length === 0 ? (
              <p className="p-4 text-sm text-[var(--color-text-secondary)]">
                No members. This organisation cannot be administered from inside until someone is
                assigned to it.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-border-subtle)]">
                {org.userProfiles.map((member) => (
                  <li key={member.id}>
                    <Link
                      to={`/users/${member.id}`}
                      className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-[var(--color-surface-hover)]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-[var(--color-text)]">
                          {[member.firstName, member.lastName].filter(Boolean).join(' ') || '—'}
                        </span>
                        <span className="block truncate text-xs text-[var(--color-text-muted)]">
                          {member.email}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {member.systemRole === 'SYSTEM_ADMIN' && (
                          <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-500 uppercase">
                            Staff
                          </span>
                        )}
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          {member.orgRole}
                        </span>
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h2 className="text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
        {title}
      </h2>
      <dl className="mt-3 space-y-2">{children}</dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-[var(--color-text-secondary)]">{label}</dt>
      <dd className="truncate text-right text-[var(--color-text)]">{value || '—'}</dd>
    </div>
  );
}
