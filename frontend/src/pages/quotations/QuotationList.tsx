import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationsApi } from '../../api/quotations';
import { useAuth } from '../../hooks/useAuth';
import { formatMoney, formatDate, errMessage } from '../../lib/format';
import StatusPill from '../../components/ui/StatusPill';
import type { Quotation, QuotationStatus } from '../../types';

const STATUSES: QuotationStatus[] = [
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
  'CONVERTED',
];

function customerName(q: Quotation): string {
  return q.customer ? `${q.customer.firstName} ${q.customer.lastName}`.trim() : '—';
}

export default function QuotationList() {
  const navigate = useNavigate();
  const { organisation } = useAuth();
  const currency = organisation?.currency ?? 'BWP';

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await quotationsApi.list();
      setQuotations(res.data.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load quotations.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return quotations;
    return quotations.filter((q) =>
      [q.number, customerName(q), q.status].join(' ').toLowerCase().includes(query),
    );
  }, [quotations, search]);

  async function changeStatus(q: Quotation, status: QuotationStatus) {
    // optimistic update
    setQuotations((prev) => prev.map((x) => (x.id === q.id ? { ...x, status } : x)));
    try {
      await quotationsApi.updateStatus(q.id, status);
    } catch (err) {
      setError(errMessage(err, 'Failed to update status.'));
      void load();
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Quotations</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {loading
              ? 'Loading…'
              : `${quotations.length} ${quotations.length === 1 ? 'quotation' : 'quotations'}`}
          </p>
        </div>
        <button
          onClick={() => navigate('/quotations/new')}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New quotation
        </button>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by number, customer or status…"
          className="w-full max-w-sm rounded-xl border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-faint)] transition-colors focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">
          Loading quotations…
        </div>
      ) : quotations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] py-16 text-center">
          <h3 className="text-base font-semibold text-[var(--color-text)]">No quotations yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
            Create a quotation to send priced proposals to your customers.
          </p>
          <button
            onClick={() => navigate('/quotations/new')}
            className="mt-5 inline-flex rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400"
          >
            Create your first quotation
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">
          No quotations match “{search}”.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[var(--color-surface)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Number</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Customer</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Total</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Issued</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Expires</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id} className="border-t border-[var(--color-border-subtle)]">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-[var(--color-text)]">
                    {q.number}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-secondary)]">
                    {customerName(q)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusPill status={q.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-[var(--color-text)]">
                    {formatMoney(q.totalCents, currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-secondary)]">
                    {formatDate(q.issueDate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-secondary)]">
                    {formatDate(q.expiryDate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        value={q.status}
                        onChange={(e) => changeStatus(q, e.target.value as QuotationStatus)}
                        className="rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-1 text-xs text-[var(--color-text)] focus:border-amber-500/60 focus:outline-none"
                        aria-label="Change status"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-[var(--color-surface)]">
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                      {/*
                        Only a DRAFT quotation is editable — the backend returns 409 for
                        anything else. Rendered as a disabled control rather than hidden so
                        the row's action column doesn't reflow between statuses, and so the
                        reason is visible on hover instead of the button just vanishing.
                      */}
                      <button
                        onClick={() => navigate(`/quotations/${q.id}/edit`)}
                        disabled={q.status !== 'DRAFT'}
                        title={
                          q.status !== 'DRAFT' ? 'Only draft quotations can be edited' : undefined
                        }
                        className="rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors enabled:hover:bg-[var(--color-surface)] enabled:hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
