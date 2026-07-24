import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../../api/customers';
import type { Customer } from '../../types';
import CustomerFormModal from './CustomerFormModal';
import ConfirmDialog from './ConfirmDialog';

function errMessage(err: unknown): string {
  return (
    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
    'Failed to load customers.'
  );
}

function fullName(c: Customer): string {
  return `${c.firstName} ${c.lastName}`.trim();
}

export default function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customersApi.list();
      setCustomers(res.data.data);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [fullName(c), c.email ?? '', c.company ?? '', c.phone ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [customers, search]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await customersApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Customers</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {loading
              ? 'Loading…'
              : `${customers.length} ${customers.length === 1 ? 'customer' : 'customers'}`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New customer
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, company, email or phone…"
          className="w-full max-w-sm rounded-xl border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-faint)] transition-colors focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">Loading customers…</div>
      ) : customers.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">
          No customers match “{search}”.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-[var(--color-surface)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Name</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Company</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Email</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Phone</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/customers/${c.id}`)}
                  className="cursor-pointer border-t border-[var(--color-border-subtle)] transition-colors hover:bg-[var(--color-surface-hover)]"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-[var(--color-text)]">{fullName(c)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-secondary)]">{c.company ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-secondary)]">{c.email ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-secondary)]">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-amber-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CustomerFormModal
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          void load();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete customer"
        message={
          deleteTarget
            ? `Delete ${fullName(deleteTarget)}? They will be removed from your customer list.`
            : ''
        }
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text)]">No customers yet</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
        Add your first customer to start creating quotations and invoices.
      </p>
      <button
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400"
      >
        Add your first customer
      </button>
    </div>
  );
}
