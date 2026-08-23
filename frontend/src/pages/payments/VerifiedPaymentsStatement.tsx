import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customersApi } from '../../api/customers';
import { verifiedPaymentsApi } from '../../api/verifiedPayments';
import { useAuth } from '../../hooks/useAuth';
import {
  errMessage,
  formatDate,
  formatMoney,
  startOfMonthInput,
  toDateInput,
} from '../../lib/format';
import { paymentMethodLabel } from '../../lib/paymentMethods';
import { downloadBlob } from '../../lib/download';
import { IconDownload } from '../../components/ui/icons';
import type { Customer, VerifiedPaymentsStatement as Statement } from '../../types';

const inputClass =
  'w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors';
const labelClass = 'text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide';

function customerLabel(customer: Customer): string {
  return customer.company || `${customer.firstName} ${customer.lastName}`.trim();
}

/**
 * The funder-facing artefact: verified payments only, with the verifier and date that
 * make each line defensible.
 *
 * Printing is handled by the `@media print` block in `index.css`, which re-points the
 * colour tokens for paper. Without that the dark theme prints white-on-white.
 */
export default function VerifiedPaymentsStatement() {
  const { organisation } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [from, setFrom] = useState(startOfMonthInput());
  const [to, setTo] = useState(toDateInput());

  const [statement, setStatement] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(true);
  const [csvBusy, setCsvBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      const res = await customersApi.list();
      setCustomers(res.data.data);
    } catch {
      // Non-fatal: the statement still works across all customers.
    }
  }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await verifiedPaymentsApi.statement({
        customerId: customerId || undefined,
        from,
        to,
      });
      setStatement(res.data.data);
    } catch (err) {
      setError(errMessage(err, 'Could not generate the statement.'));
    } finally {
      setLoading(false);
    }
  }, [customerId, from, to]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    void generate();
    // Intentionally only on mount: afterwards the user drives it with Generate, so
    // the statement does not thrash while they are still picking a date range.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function downloadCsv() {
    setCsvBusy(true);
    setError(null);
    try {
      const res = await verifiedPaymentsApi.statementCsv({
        customerId: customerId || undefined,
        from,
        to,
      });
      downloadBlob(res.data, `verified-payments-${from}-to-${to}.csv`);
    } catch (err) {
      // With responseType 'blob' an error body is also a Blob, so errMessage cannot
      // read `response.data.error`. The fallback is the honest answer here.
      setError(errMessage(err, 'Could not download the CSV.'));
    } finally {
      setCsvBusy(false);
    }
  }

  const currency = statement?.organisation.currency ?? organisation?.currency ?? 'BWP';

  return (
    <div className="mx-auto max-w-4xl">
      <div data-print-hide>
        <Link
          to="/payments"
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
          Back to payments
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-[var(--color-text)]">
          Verified payments statement
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          An independently verified record of payments received, for lenders and funders.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void generate();
          }}
          className="mt-5 grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-[2fr_1fr_1fr_auto]"
        >
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Customer</label>
            <select
              className={`${inputClass} cursor-pointer`}
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            >
              <option value="" className="bg-[var(--color-surface)]">
                All customers
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id} className="bg-[var(--color-surface)]">
                  {customerLabel(customer)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>From</label>
            <input
              type="date"
              className={inputClass}
              value={from}
              max={to}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>To</label>
            <input
              type="date"
              className={inputClass}
              value={to}
              min={from}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-amber-400 disabled:bg-amber-500/40 sm:w-auto"
            >
              {loading ? 'Loading…' : 'Generate'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {statement && statement.rows.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadCsv}
              disabled={csvBusy}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] disabled:opacity-50"
            >
              <IconDownload />
              {csvBusy ? 'Preparing…' : 'Download CSV'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
            >
              Print or save as PDF
            </button>
          </div>
        )}
      </div>

      {statement && (
        <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border)] pb-5">
            <div className="flex items-center gap-3">
              {organisation?.logoUrl && (
                <img
                  src={organisation.logoUrl}
                  alt=""
                  className="h-12 w-auto max-w-[160px] object-contain"
                />
              )}
              <div>
                <p className="text-lg font-black text-[var(--color-text)]">
                  {statement.organisation.name}
                </p>
                {organisation?.address && (
                  <p className="text-xs text-[var(--color-text-muted)]">{organisation.address}</p>
                )}
                {organisation?.vatNumber && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    VAT {organisation.vatNumber}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Statement of verified payments
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {statement.customer?.name ?? 'All customers'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {formatDate(statement.from)} – {formatDate(statement.to)}
              </p>
              <p className="text-xs text-[var(--color-text-faint)]">
                Generated {formatDate(statement.generatedAt)}
              </p>
            </div>
          </div>

          {statement.rows.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="text-base font-semibold text-[var(--color-text)]">
                No verified payments in this period
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-text-muted)]">
                Only payments with proof attached and verified by BizUnity appear here. Attach proof
                of payment to your recorded payments to have them verified.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="py-2.5 pr-3 font-medium">Date</th>
                      <th className="py-2.5 pr-3 font-medium">Invoice</th>
                      <th className="py-2.5 pr-3 font-medium">Customer</th>
                      <th className="py-2.5 pr-3 font-medium">Method</th>
                      <th className="py-2.5 pr-3 font-medium">Reference</th>
                      <th className="py-2.5 pr-3 font-medium">Verified</th>
                      <th className="py-2.5 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.rows.map((row) => (
                      <tr
                        key={row.paymentId}
                        className="border-b border-[var(--color-border-subtle)]"
                      >
                        <td className="whitespace-nowrap py-3 pr-3 text-[var(--color-text-secondary)]">
                          {formatDate(row.paidAt)}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-3 text-[var(--color-text)]">
                          {row.invoiceNumber}
                        </td>
                        <td className="py-3 pr-3 text-[var(--color-text-secondary)]">
                          {row.customerName}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-3 text-[var(--color-text-secondary)]">
                          {paymentMethodLabel(row.method)}
                        </td>
                        <td className="py-3 pr-3 text-[var(--color-text-secondary)]">
                          {row.reference ?? '—'}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-3 text-[var(--color-text-secondary)]">
                          {formatDate(row.verifiedAt)}
                          {row.verifiedBy && (
                            <span className="block text-xs text-[var(--color-text-faint)]">
                              by {row.verifiedBy}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-3 text-right text-[var(--color-text)]">
                          {formatMoney(row.amountCents, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[var(--color-border-strong)]">
                      <td colSpan={6} className="py-3 font-semibold text-[var(--color-text)]">
                        Total verified ({statement.rows.length}{' '}
                        {statement.rows.length === 1 ? 'payment' : 'payments'})
                      </td>
                      <td className="py-3 text-right text-base font-bold text-[var(--color-text)]">
                        {formatMoney(statement.totalCents, currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* This paragraph is the actual funder-grade assurance, so it prints. */}
              <p className="mt-6 border-t border-[var(--color-border-subtle)] pt-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
                Only payments verified against a proof-of-payment document are listed. Verification
                is performed independently by BizUnity and recorded with the verifier and timestamp
                against an append-only audit trail.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
