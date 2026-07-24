import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { paymentsApi } from '../../api/payments';
import { useAuth } from '../../hooks/useAuth';
import { formatMoney, formatDate, errMessage } from '../../lib/format';
import type { Payment, PaymentMethod } from '../../types';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank transfer',
  CARD: 'Card',
  MOBILE_MONEY: 'Mobile money',
  OTHER: 'Other',
};

export default function PaymentHistory() {
  const { organisation } = useAuth();
  const currency = organisation?.currency ?? 'BWP';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentsApi.list();
      setPayments(res.data.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load payments.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalCents = useMemo(() => payments.reduce((sum, p) => sum + p.amountCents, 0), [payments]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Payments</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {loading
              ? 'Loading…'
              : `${payments.length} ${payments.length === 1 ? 'payment' : 'payments'} · ${formatMoney(totalCents, currency)} collected`}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">
          Loading payments…
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] py-16 text-center">
          <h3 className="text-base font-semibold text-[var(--color-text)]">No payments yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
            Payments recorded against invoices appear here.
          </p>
          <Link
            to="/invoices"
            className="mt-5 inline-flex rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400"
          >
            Go to invoices
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[var(--color-surface)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Date</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Invoice</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Customer</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Method</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Reference</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-[var(--color-border-subtle)]">
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-secondary)]">
                    {formatDate(p.paidAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {p.invoice ? (
                      <Link
                        to={`/invoices/${p.invoice.id}`}
                        className="font-medium text-amber-500 hover:text-amber-400"
                      >
                        {p.invoice.number}
                      </Link>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-secondary)]">
                    {p.invoice?.customer
                      ? `${p.invoice.customer.firstName} ${p.invoice.customer.lastName}`
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-secondary)]">
                    {METHOD_LABELS[p.method]}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-secondary)]">
                    {p.reference ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-[var(--color-text)]">
                    {formatMoney(p.amountCents, currency)}
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
