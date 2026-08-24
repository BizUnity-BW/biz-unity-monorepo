import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { invoicesApi } from '../../api/invoices';
import { useAuth } from '../../hooks/useAuth';
import { formatMoney, formatDate, errMessage } from '../../lib/format';
import { paymentMethodLabel } from '../../lib/paymentMethods';
import StatusPill from '../../components/ui/StatusPill';
import SkeletonShimmer from '../../components/ui/SkeletonShimmer';
import { IconPaperclip } from '../../components/ui/icons';
import { PLACEHOLDER_INVOICE } from '../../lib/skeletonPlaceholders';
import RecordPaymentModal from './RecordPaymentModal';
import AttachProofModal from './AttachProofModal';
import type { Invoice, InvoiceStatus, Payment } from '../../types';

const STATUSES: InvoiceStatus[] = [
  'DRAFT',
  'SENT',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
];

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
  const [attachFor, setAttachFor] = useState<Payment | null>(null);

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

  // Shimmer measures the rendered children, so the layout must still render while
  // loading — with a stand-in invoice standing in for the real one.
  const model = invoice ?? PLACEHOLDER_INVOICE;
  const balanceCents = model.totalCents - model.paidCents;

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

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : loading || invoice ? (
        <SkeletonShimmer loading={loading}>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[var(--color-text)]">{model.number}</h1>
                <StatusPill status={model.status} />
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {customerName(model)} · Issued {formatDate(model.issueDate)}
                {model.dueDate ? ` · Due ${formatDate(model.dueDate)}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={model.status}
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
                {(model.items ?? []).map((it) => (
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
              <Row label="Subtotal" value={formatMoney(model.subtotalCents, currency)} />
              <Row label="Tax" value={formatMoney(model.taxCents, currency)} />
              <div className="mt-1 flex justify-between border-t border-[var(--color-border)] pt-2 text-base font-bold text-[var(--color-text)]">
                <span>Total</span>
                <span>{formatMoney(model.totalCents, currency)}</span>
              </div>
              <Row label="Paid" value={formatMoney(model.paidCents, currency)} muted />
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
            {(model.payments ?? []).length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[var(--color-text-muted)]">
                No payments recorded yet.
              </div>
            ) : (
              <ul className="divide-y divide-[var(--color-border-subtle)]">
                {(model.payments ?? []).map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text)]">
                        {formatMoney(p.amountCents, currency)}
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {paymentMethodLabel(p.method)}
                        </span>
                        <StatusPill status={p.verificationStatus} />
                        {(p.documents ?? []).length > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                            <IconPaperclip />
                            {(p.documents ?? []).length}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--color-text-faint)]">
                        {formatDate(p.paidAt)}
                        {p.reference ? ` · ${p.reference}` : ''}
                        {p.verifiedAt ? ` · Verified ${formatDate(p.verifiedAt)}` : ''}
                      </p>
                      {p.verificationStatus === 'REJECTED' && p.rejectionReason && (
                        <p className="mt-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-400">
                          Rejected: {p.rejectionReason} Upload a clearer document to resubmit.
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachFor(p)}
                      className="shrink-0 rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)]"
                    >
                      {p.verificationStatus === 'REJECTED'
                        ? 'Resubmit'
                        : (p.documents ?? []).length > 0
                          ? 'Proof'
                          : 'Attach proof'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SkeletonShimmer>
      ) : null}

      {/* Fixed-position overlays, so they stay outside the shimmer's measured subtree.
          Both are gated on the real `invoice`, never on `model`. */}
      {payOpen && invoice && (
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

      {attachFor && invoice && (
        <AttachProofModal
          payment={attachFor}
          currency={currency}
          onClose={() => setAttachFor(null)}
          onSaved={() => {
            setAttachFor(null);
            void load();
          }}
        />
      )}
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
