import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customersApi } from '../../api/customers';
import { quotationsApi } from '../../api/quotations';
import { invoicesApi } from '../../api/invoices';
import { paymentsApi } from '../../api/payments';
import { useAuth } from '../../hooks/useAuth';
import { formatMoney, formatDate } from '../../lib/format';
import StatusPill from '../../components/ui/StatusPill';
import type { Customer, Quotation, Invoice, Payment } from '../../types';

interface Data {
  customers: Customer[];
  quotations: Quotation[];
  invoices: Invoice[];
  payments: Payment[];
}

const OPEN_INVOICE_STATUSES = new Set(['DRAFT', 'SENT', 'PARTIALLY_PAID', 'OVERDUE']);

export default function TenantDashboard() {
  const { organisation, profile } = useAuth();
  const currency = organisation?.currency ?? 'BWP';

  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // Each call is independent — one empty/failed resource shouldn't blank the whole dashboard.
    const [customers, quotations, invoices, payments] = await Promise.all([
      customersApi
        .list()
        .then((r) => r.data.data)
        .catch(() => [] as Customer[]),
      quotationsApi
        .list()
        .then((r) => r.data.data)
        .catch(() => [] as Quotation[]),
      invoicesApi
        .list()
        .then((r) => r.data.data)
        .catch(() => [] as Invoice[]),
      paymentsApi
        .list()
        .then((r) => r.data.data)
        .catch(() => [] as Payment[]),
    ]);
    setData({ customers, quotations, invoices, payments });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const outstandingCents =
    data?.invoices
      .filter((i) => OPEN_INVOICE_STATUSES.has(i.status))
      .reduce((sum, i) => sum + (i.totalCents - i.paidCents), 0) ?? 0;
  const revenueCents = data?.payments.reduce((sum, p) => sum + p.amountCents, 0) ?? 0;
  const recentQuotations = (data?.quotations ?? []).slice(0, 5);

  const firstName = profile?.firstName;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          {firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {organisation?.name
            ? `Here's how ${organisation.name} is doing.`
            : 'Overview of your business.'}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Customers"
          value={loading ? '…' : String(data?.customers.length ?? 0)}
          to="/customers"
        />
        <StatCard
          label="Quotations"
          value={loading ? '…' : String(data?.quotations.length ?? 0)}
          to="/quotations"
        />
        <StatCard
          label="Outstanding"
          value={loading ? '…' : formatMoney(outstandingCents, currency)}
          hint="Unpaid invoices"
          to="/invoices"
        />
        <StatCard
          label="Revenue collected"
          value={loading ? '…' : formatMoney(revenueCents, currency)}
          hint="Payments received"
          to="/payments"
        />
      </div>

      {/* Recent quotations */}
      <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Recent quotations</h2>
          <Link
            to="/quotations"
            className="text-xs font-medium text-amber-500 hover:text-amber-400"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
            Loading…
          </div>
        ) : recentQuotations.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
            No quotations yet.{' '}
            <Link to="/quotations/new" className="text-amber-500 hover:text-amber-400">
              Create one
            </Link>
            .
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border-subtle)]">
            {recentQuotations.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-text)]">
                    {q.number}
                    <span className="ml-2 font-normal text-[var(--color-text-muted)]">
                      {q.customer ? `${q.customer.firstName} ${q.customer.lastName}` : ''}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--color-text-faint)]">
                    {formatDate(q.issueDate)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusPill status={q.status} />
                  <span className="text-sm text-[var(--color-text)]">
                    {formatMoney(q.totalCents, currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  to,
}: {
  label: string;
  value: string;
  hint?: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-amber-500/40"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--color-text-faint)]">{hint}</p>}
    </Link>
  );
}
