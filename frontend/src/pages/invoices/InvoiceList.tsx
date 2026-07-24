import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoicesApi } from '../../api/invoices';
import { quotationsApi } from '../../api/quotations';
import { useAuth } from '../../hooks/useAuth';
import { formatMoney, formatDate, errMessage } from '../../lib/format';
import StatusPill from '../../components/ui/StatusPill';
import type { Invoice, Quotation } from '../../types';

function customerName(i: Invoice): string {
  return i.customer ? `${i.customer.firstName} ${i.customer.lastName}`.trim() : '—';
}

export default function InvoiceList() {
  const navigate = useNavigate();
  const { organisation } = useAuth();
  const currency = organisation?.currency ?? 'BWP';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [convertOpen, setConvertOpen] = useState(false);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [quotationsLoading, setQuotationsLoading] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await invoicesApi.list();
      setInvoices(res.data.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load invoices.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((i) =>
      [i.number, customerName(i), i.status].join(' ').toLowerCase().includes(q),
    );
  }, [invoices, search]);

  async function openConvert() {
    setConvertOpen(true);
    setQuotationsLoading(true);
    try {
      const res = await quotationsApi.list();
      // Only quotations not already converted can become invoices.
      setQuotations(res.data.data.filter((q) => q.status !== 'CONVERTED'));
    } catch (err) {
      setError(errMessage(err, 'Failed to load quotations.'));
    } finally {
      setQuotationsLoading(false);
    }
  }

  async function convert(q: Quotation) {
    setConvertingId(q.id);
    try {
      const res = await invoicesApi.fromQuotation(q.id);
      setConvertOpen(false);
      await load();
      navigate(`/invoices/${res.data.data.id}`);
    } catch (err) {
      setError(errMessage(err, 'Failed to convert quotation.'));
    } finally {
      setConvertingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Invoices</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {loading
              ? 'Loading…'
              : `${invoices.length} ${invoices.length === 1 ? 'invoice' : 'invoices'}`}
          </p>
        </div>
        <button
          onClick={openConvert}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25" />
          </svg>
          New from quotation
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
        <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">Loading invoices…</div>
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] py-16 text-center">
          <h3 className="text-base font-semibold text-[var(--color-text)]">No invoices yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
            Invoices are created by converting a quotation.
          </p>
          <button
            onClick={openConvert}
            className="mt-5 inline-flex rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400"
          >
            Create from a quotation
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">
          No invoices match “{search}”.
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
                <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Balance</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr
                  key={i.id}
                  onClick={() => navigate(`/invoices/${i.id}`)}
                  className="cursor-pointer border-t border-[var(--color-border-subtle)] transition-colors hover:bg-[var(--color-surface-hover)]"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-[var(--color-text)]">{i.number}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-secondary)]">{customerName(i)}</td>
                  <td className="whitespace-nowrap px-4 py-3"><StatusPill status={i.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-[var(--color-text)]">{formatMoney(i.totalCents, currency)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-[var(--color-text-secondary)]">{formatMoney(i.totalCents - i.paidCents, currency)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-secondary)]">{formatDate(i.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {convertOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto bg-black/60 backdrop-blur-sm"
          onClick={() => setConvertOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-[var(--color-text)]">Convert a quotation to an invoice</h2>
            <p className="mt-1 mb-4 text-sm text-[var(--color-text-muted)]">
              Pick a quotation. Its line items and totals are copied to a new invoice.
            </p>

            {quotationsLoading ? (
              <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">Loading quotations…</div>
            ) : quotations.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                No convertible quotations. Create one first.
              </div>
            ) : (
              <ul className="max-h-80 divide-y divide-[var(--color-border-subtle)] overflow-y-auto">
                {quotations.map((q) => (
                  <li key={q.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-text)]">
                        {q.number}
                        <span className="ml-2 font-normal text-[var(--color-text-muted)]">
                          {q.customer ? `${q.customer.firstName} ${q.customer.lastName}` : ''}
                        </span>
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <StatusPill status={q.status} />
                        <span className="text-xs text-[var(--color-text-faint)]">
                          {formatMoney(q.totalCents, currency)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => convert(q)}
                      disabled={convertingId !== null}
                      className="shrink-0 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-black transition-colors hover:bg-amber-400 disabled:opacity-50"
                    >
                      {convertingId === q.id ? 'Converting…' : 'Convert'}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setConvertOpen(false)}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
