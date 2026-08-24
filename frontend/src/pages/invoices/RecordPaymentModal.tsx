import { useRef, useState } from 'react';
import { paymentsApi } from '../../api/payments';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';
import { formatMoney, errMessage, toDateInput } from '../../lib/format';
import { PAYMENT_METHODS } from '../../lib/paymentMethods';
import FileDropZone from '../../components/upload/FileDropZone';
import UploadQueue from '../../components/upload/UploadQueue';
import type { Invoice, PaymentMethod } from '../../types';

const inputClass =
  'w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-faint)] focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors';
const labelClass = 'text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide';

interface Props {
  invoice: Invoice;
  currency: string;
  defaultAmountCents: number;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Record a payment, optionally with proof attached in the same step.
 *
 * A document cannot reference a payment that does not exist, so the upload has to
 * follow the create. That ordering creates the one hazard worth designing around: a
 * file upload must never put the money at risk. So the payment id is held in a ref and
 * the create is skipped on any retry, and if uploads fail the modal stays open with
 * the payment already safely recorded.
 */
export default function RecordPaymentModal({
  invoice,
  currency,
  defaultAmountCents,
  onClose,
  onSaved,
}: Props) {
  const [amount, setAmount] = useState((defaultAmountCents / 100).toFixed(2));
  const [method, setMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [paidAt, setPaidAt] = useState(toDateInput());
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partial, setPartial] = useState(false);

  // autoStart is false: there is no payment to attach to until the user submits.
  const upload = useDocumentUpload({ kind: 'PROOF_OF_PAYMENT', autoStart: false });
  const paymentIdRef = useRef<string | null>(null);

  const staged = upload.items.length;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    // Post-failure state: the payment exists, only the files need another attempt.
    if (partial) {
      setSaving(true);
      const outcome = await upload.retryFailed();
      if (outcome.failed === 0) onSaved();
      else setSaving(false);
      return;
    }

    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    setSaving(true);
    try {
      // Guarded so a retry after a partial failure cannot record the payment twice.
      if (!paymentIdRef.current) {
        const res = await paymentsApi.create({
          invoiceId: invoice.id,
          amountCents,
          method,
          reference: reference.trim() || undefined,
          paidAt: new Date(paidAt).toISOString(),
        });
        paymentIdRef.current = res.data.data.id;
      }

      if (staged === 0) {
        onSaved();
        return;
      }

      const outcome = await upload.start({ paymentId: paymentIdRef.current ?? undefined });
      if (outcome.failed === 0) {
        onSaved();
        return;
      }

      // The payment is recorded. Stay open so the files can be retried.
      setPartial(true);
      setSaving(false);
    } catch (err) {
      setError(errMessage(err, 'Failed to record payment.'));
      setSaving(false);
    }
  }

  const submitLabel = saving
    ? upload.busy
      ? 'Uploading…'
      : 'Recording…'
    : staged > 0
      ? `Record payment and upload ${staged} file${staged === 1 ? '' : 's'}`
      : 'Record payment';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        onClick={(event) => event.stopPropagation()}
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
              disabled={partial}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Method</label>
              <select
                className={`${inputClass} cursor-pointer`}
                value={method}
                disabled={partial}
                onChange={(event) => setMethod(event.target.value as PaymentMethod)}
              >
                {PAYMENT_METHODS.map((m) => (
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
                disabled={partial}
                onChange={(event) => setPaidAt(event.target.value)}
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
              disabled={partial}
              onChange={(event) => setReference(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 border-t border-[var(--color-border-subtle)] pt-4">
            <div>
              <p className={labelClass}>
                Proof of payment{' '}
                <span className="font-normal normal-case text-[var(--color-text-faint)]">
                  (optional)
                </span>
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-faint)]">
                Attach a bank confirmation now, or add it later. A payment can only be verified once
                proof is attached.
              </p>
            </div>
            <FileDropZone
              accept={upload.config.accept}
              multiple
              compact
              hint={upload.config.hint}
              disabled={upload.busy}
              label="Choose files"
              onFiles={upload.addFiles}
            />
            <UploadQueue
              items={upload.items}
              rejected={upload.rejected}
              onRetry={upload.retry}
              onRemove={upload.remove}
            />
          </div>

          {partial && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
              Payment recorded. {upload.failed} of {staged} file
              {staged === 1 ? '' : 's'} did not upload. Retry above, or close and attach proof later
              from the payment row.
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mt-1 flex justify-end gap-3">
            <button
              type="button"
              onClick={partial ? onSaved : onClose}
              disabled={saving && !partial}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
            >
              {partial ? "Done, I'll add it later" : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400 disabled:bg-amber-500/40"
            >
              {partial ? 'Retry upload' : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
