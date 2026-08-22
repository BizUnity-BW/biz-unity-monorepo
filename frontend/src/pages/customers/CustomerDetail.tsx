import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { customersApi } from '../../api/customers';
import type { Customer } from '../../types';
import CustomerFormModal from './CustomerFormModal';
import ConfirmDialog from './ConfirmDialog';
import SkeletonShimmer from '../../components/ui/SkeletonShimmer';
import { PLACEHOLDER_CUSTOMER } from '../../lib/skeletonPlaceholders';

function errMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback;
}

function fullName(c: Customer): string {
  return `${c.firstName} ${c.lastName}`.trim();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await customersApi.get(id);
      setCustomer(res.data.data);
    } catch (err) {
      setError(errMessage(err, 'Customer not found.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await customersApi.remove(id);
      navigate('/customers');
    } catch (err) {
      setError(errMessage(err, 'Failed to delete customer.'));
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  // Shimmer measures the rendered children, so the layout must still render while
  // loading — with a stand-in customer standing in for the real one.
  const model = customer ?? PLACEHOLDER_CUSTOMER;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/customers"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to customers
      </Link>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : loading || customer ? (
        <SkeletonShimmer loading={loading}>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">{fullName(model)}</h1>
              {model.company && (
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{model.company}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-amber-400"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                className="rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <Field label="Email" value={model.email} />
              <Field label="Phone" value={model.phone} />
              <Field label="Company" value={model.company} />
              <Field label="Address" value={model.address} />
              <Field label="Added" value={formatDate(model.createdAt)} />
              <Field label="Last updated" value={formatDate(model.updatedAt)} />
            </dl>

            {model.notes && (
              <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-5">
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Notes
                </dt>
                <dd className="mt-1.5 whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">
                  {model.notes}
                </dd>
              </div>
            )}
          </div>
        </SkeletonShimmer>
      ) : null}

      {/* Overlays live outside the shimmer: they are fixed-position, so measuring
          them would produce stray blocks, and they only open once data has loaded. */}
      {customer && (
        <>
          <CustomerFormModal
            open={editOpen}
            initial={customer}
            onClose={() => setEditOpen(false)}
            onSaved={() => {
              setEditOpen(false);
              void load();
            }}
          />

          <ConfirmDialog
            open={confirmOpen}
            title="Delete customer"
            message={`Delete ${fullName(customer)}? They will be removed from your customer list.`}
            confirmLabel="Delete"
            danger
            busy={deleting}
            onConfirm={confirmDelete}
            onCancel={() => setConfirmOpen(false)}
          />
        </>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-[var(--color-text)]">{value ?? '—'}</dd>
    </div>
  );
}
