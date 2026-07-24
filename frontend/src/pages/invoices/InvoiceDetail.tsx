import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { invoicesApi } from '../../api/invoices';
import { paymentsApi } from '../../api/payments';
import { useAuth } from '../../hooks/useAuth';
import { formatMoney, formatDate, errMessage } from '../../lib/format';
import StatusPill from '../../components/ui/StatusPill';
import type { Invoice, InvoiceStatus, PaymentMethod } from '../../types';

const STATUSES: InvoiceStatus[] = [
  'DRAFT',
  'SENT',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
];

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CARD', label: 'Card' },
  { value: 'MOBILE_MONEY', label: 'Mobile money' },
  { value: 'OTHER', label: 'Other' },
];

const inputClass =
  'w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-faint)] focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors';
const labelClass = 'text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide';

function customerName(i: Invoice): string {
  return i.customer ? `${i.customer.firstName} ${i.customer.lastName}`.trim() : '—';
}

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { organisation } = useAuth();
  const currency = organisation?.currency ?? 'BWP';

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await invoicesApi.get(id);
      setInvoice(res.data.data);
    } catch (err) {
      setError(errMessage(err, 'Invoice not found.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(status: InvoiceStatus) {
    if (!invoice) return;
    setInvoice({ ...invoice, status });
    try {
      await invoicesApi.updateStatus(invoice.id, status);
    } catch (err) {
      setError(errMessage(err, 'Failed to update status.'));
      void load();
    }
  }

  const balanceCents = invoice ? invoice.totalCents - invoice.paidCents : 0;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/invoices"
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
        Back to invoices
      </Link>

      {loading ? (
        <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">Loading…</div>
      ) : error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : invoice ? (
        <>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[var(--color-text)]">{invoice.number}</h1>
                <StatusPill status={invoice.status} />
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {customerName(invoice)} · Issued {formatDate(invoice.issueDate)}
                {invoice.dueDate ? ` · Due ${formatDate(invoice.dueDate)}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={invoice.status}
                onChange={(e) => changeStatus(e.target.value as InvoiceStatus)}
                className="rounded-xl border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-amber-500/60 focus:outline-none"
                aria-label="Change status"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-[var(--color-surface)]">
                    {s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              {balanceCents > 0 && (
                <button
                  onClick={() => setPayOpen(true)}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-amber-400"
                >
                  Record payment
                </button>
              )}
            </div>
          </div>

          {/* Line items */}
          <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--color-border)]">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[var(--color-surface)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">Unit price</th>
                  <th className="px-4 py-3 text-right font-medium">Tax %</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items ?? []).map((it) => (
                  <tr key={it.id} className="border-t border-[var(--color-border-subtle)]">
                    <td className="px-4 py-3 text-[var(--color-text)]">{it.description}</td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                      {Number(it.quantity)}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                      {formatMoney(it.unitPriceCents, currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                      {Number(it.taxPercent)}%
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text)]">
                      {formatMoney(it.totalCents, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-xs rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
              <Row label="Subtotal" value={formatMoney(invoice.subtotalCents, currency)} />
              <Row label="Tax" value={formatMoney(invoice.taxCents, currency)} />
              <div className="mt-1 flex justify-between border-t border-[var(--color-border)] pt-2 text-base font-bold text-[var(--color-text)]">
                <span>Total</span>
                <span>{formatMoney(invoice.totalCents, currency)}</span>
              </div>
              <Row label="Paid" value={formatMoney(invoice.paidCents, currency)} muted />
              <div className="mt-1 flex justify-between border-t border-[var(--color-border-subtle)] pt-2 font-semibold text-[var(--color-text)]">
                <span>Balance due</span>
                <span className={balanceCents > 0 ? 'text-amber-500' : 'text-emerald-500'}>
                  {formatMoney(balanceCents, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Payments */}
          <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Payments</h2>
            </div>
            {(invoice.payments ?? []).length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[var(--color-text-muted)]">
                No payments recorded yet.
              </div>
            ) : (
              <ul className="divide-y divide-[var(--color-border-subtle)]">
                {(invoice.payments ?? []).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <p className="text-sm text-[var(--color-text)]">
                        {formatMoney(p.amountCents, currency)}
                        <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                          {METHODS.find((m) => m.value === p.method)?.label ?? p.method}
                        </span>
                      </p>
                      <p className="text-xs text-[var(--color-text-faint)]">
                        {formatDate(p.paidAt)}
                        {p.reference ? ` · ${p.reference}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {payOpen && (
            <RecordPaymentModal
              invoice={invoice}
              currency={currency}
              defaultAmountCents={balanceCents}
              onClose={() => setPayOpen(false)}
              onSaved={() => {
                setPayOpen(false);
                void load();
              }}
            />
          )}
        </>
      ) : null}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div
      className={`flex justify-between py-1 ${muted ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-secondary)]'}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function RecordPaymentModal({
  invoice,
  currency,
  defaultAmountCents,
  onClose,
  onSaved,
}: {
  invoice: Invoice;
  currency: string;
  defaultAmountCents: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState((defaultAmountCents / 100).toFixed(2));
  const [method, setMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      await paymentsApi.create({
        invoiceId: invoice.id,
        amountCents,
        method,
        reference: reference.trim() || undefined,
        paidAt: new Date(paidAt).toISOString(),
      });
      onSaved();
    } catch (err) {
      setError(errMessage(err, 'Failed to record payment.'));
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[var(--color-text)]">Record payment</h2>
        <p className="mt-1 mb-5 text-sm text-[var(--color-text-muted)]">
          Balance due {formatMoney(defaultAmountCents, currency)} on {invoice.number}.
        </p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Amount ({currency})</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Method</label>
              <select
                className={`${inputClass} cursor-pointer`}
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-[var(--color-surface)]">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Date</label>
              <input
                type="date"
                className={inputClass}
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Reference{' '}
              <span className="font-normal normal-case text-[var(--color-text-faint)]">(opt.)</span>
            </label>
            <input
              className={inputClass}
              placeholder="e.g. EFT ref, receipt no."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mt-1 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400 disabled:bg-amber-500/40"
            >
              {saving ? 'Saving…' : 'Record payment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
