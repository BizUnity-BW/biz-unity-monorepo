import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { customersApi } from '../../api/customers';
import { quotationsApi } from '../../api/quotations';
import { useAuth } from '../../hooks/useAuth';
import { formatMoney, errMessage } from '../../lib/format';
import type { Customer } from '../../types';

interface ItemRow {
  description: string;
  quantity: string;
  unitPrice: string; // in currency units (e.g. pula), converted to cents on submit
  taxPercent: string;
}

const emptyRow = (): ItemRow => ({ description: '', quantity: '1', unitPrice: '', taxPercent: '0' });

const inputClass =
  'w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-faint)] focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors';
const labelClass = 'text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide';

function toCents(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
function toNum(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export default function QuotationForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { organisation } = useAuth();
  const currency = organisation?.currency ?? 'BWP';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemRow[]>([emptyRow()]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [custRes, quo] = await Promise.all([
        customersApi.list(),
        isEdit && id ? quotationsApi.get(id) : Promise.resolve(null),
      ]);
      setCustomers(custRes.data.data);
      if (quo) {
        const q = quo.data.data;
        setCustomerId(q.customerId);
        setExpiryDate(q.expiryDate ? q.expiryDate.slice(0, 10) : '');
        setNotes(q.notes ?? '');
        setItems(
          (q.items ?? []).map((it) => ({
            description: it.description,
            quantity: String(it.quantity),
            unitPrice: (it.unitPriceCents / 100).toFixed(2),
            taxPercent: String(it.taxPercent),
          })),
        );
      }
    } catch (err) {
      setError(errMessage(err, 'Failed to load the form.'));
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    let subtotalCents = 0;
    let taxCents = 0;
    for (const it of items) {
      const line = Math.round(toNum(it.quantity) * toCents(it.unitPrice));
      subtotalCents += line;
      taxCents += Math.round((line * toNum(it.taxPercent)) / 100);
    }
    return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
  }, [items]);

  function updateItem(idx: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, emptyRow()]);
  }
  function removeItem(idx: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    const cleanItems = items
      .filter((it) => it.description.trim() && toNum(it.quantity) > 0)
      .map((it, idx) => ({
        description: it.description.trim(),
        quantity: toNum(it.quantity),
        unitPriceCents: toCents(it.unitPrice),
        taxPercent: toNum(it.taxPercent),
        sortOrder: idx,
      }));
    if (cleanItems.length === 0) {
      setError('Add at least one line item with a description and quantity.');
      return;
    }

    const payload = {
      customerId,
      notes: notes.trim() || undefined,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      items: cleanItems,
    };

    setSaving(true);
    try {
      if (isEdit && id) {
        await quotationsApi.update(id, payload);
      } else {
        await quotationsApi.create(payload);
      }
      navigate('/quotations');
    } catch (err) {
      setError(errMessage(err, 'Failed to save the quotation.'));
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/quotations"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to quotations
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-[var(--color-text)]">
        {isEdit ? 'Edit quotation' : 'New quotation'}
      </h1>

      {loading ? (
        <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">Loading…</div>
      ) : customers.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-border)] py-12 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            You need a customer before creating a quotation.
          </p>
          <Link
            to="/customers"
            className="mt-4 inline-flex rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400"
          >
            Add a customer
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
          {/* Header fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Customer</label>
              <select
                className={`${inputClass} cursor-pointer`}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="" className="bg-[var(--color-surface)]">
                  Select a customer…
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[var(--color-surface)]">
                    {c.firstName} {c.lastName}
                    {c.company ? ` — ${c.company}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Expiry date{' '}
                <span className="font-normal normal-case text-[var(--color-text-faint)]">(opt.)</span>
              </label>
              <input
                type="date"
                className={inputClass}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          {/* Line items */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Line items</h2>
              <button
                type="button"
                onClick={addItem}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-500 transition-colors hover:bg-amber-500/10"
              >
                + Add item
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {items.map((it, idx) => {
                const lineCents = Math.round(toNum(it.quantity) * toCents(it.unitPrice));
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--color-border-subtle)] p-3 sm:grid-cols-12 sm:items-end"
                  >
                    <div className="col-span-2 flex flex-col gap-1 sm:col-span-5">
                      <label className={labelClass}>Description</label>
                      <input
                        className={inputClass}
                        placeholder="Consulting services"
                        value={it.description}
                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className={labelClass}>Qty</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className={inputClass}
                        value={it.quantity}
                        onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className={labelClass}>Unit price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputClass}
                        placeholder="0.00"
                        value={it.unitPrice}
                        onChange={(e) => updateItem(idx, { unitPrice: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className={labelClass}>Tax %</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        className={inputClass}
                        value={it.taxPercent}
                        onChange={(e) => updateItem(idx, { taxPercent: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:justify-end">
                      <span className="text-sm text-[var(--color-text-secondary)] sm:hidden">
                        {formatMoney(lineCents, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
                        aria-label="Remove item"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="col-span-2 hidden text-right text-sm text-[var(--color-text-secondary)] sm:col-span-12 sm:block sm:pr-9">
                      Line total: {formatMoney(lineCents, currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes + totals */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Notes{' '}
                <span className="font-normal normal-case text-[var(--color-text-faint)]">(opt.)</span>
              </label>
              <textarea
                rows={4}
                className={`${inputClass} resize-none`}
                placeholder="Terms, payment details, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
              <div className="flex justify-between py-1 text-[var(--color-text-secondary)]">
                <span>Subtotal</span>
                <span>{formatMoney(totals.subtotalCents, currency)}</span>
              </div>
              <div className="flex justify-between py-1 text-[var(--color-text-secondary)]">
                <span>Tax</span>
                <span>{formatMoney(totals.taxCents, currency)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-[var(--color-border)] pt-2 text-base font-bold text-[var(--color-text)]">
                <span>Total</span>
                <span>{formatMoney(totals.totalCents, currency)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Link
              to="/quotations"
              className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400 disabled:bg-amber-500/40"
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create quotation'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
