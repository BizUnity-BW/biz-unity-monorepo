import { useState } from 'react';
import { documentsApi } from '../../api/documents';
import { DOCUMENT_KINDS } from '../../lib/uploadKinds';
import { errMessage } from '../../lib/format';
import type { DocumentRecord } from '../../types';

const inputClass =
  'w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-faint)] focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors';
const labelClass = 'text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide';

/** ISO instant to the YYYY-MM-DD a date input needs. */
function toDateValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

/** Date input value back to an ISO instant, or null to clear the field. */
function toIso(value: string): string | null {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null;
}

interface Props {
  document: DocumentRecord;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Edit the compliance metadata on a document: its number and its issue and expiry
 * dates. The expiry is what drives the "needs attention" surface on the pack.
 */
export default function DocumentMetaModal({ document, onClose, onSaved }: Props) {
  const [documentNumber, setDocumentNumber] = useState(document.documentNumber ?? '');
  const [issuedAt, setIssuedAt] = useState(toDateValue(document.issuedAt));
  const [expiresAt, setExpiresAt] = useState(toDateValue(document.expiresAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (issuedAt && expiresAt && expiresAt < issuedAt) {
      setError('The expiry date cannot be before the issue date.');
      return;
    }

    setSaving(true);
    try {
      await documentsApi.update(document.id, {
        documentNumber: documentNumber.trim() || null,
        issuedAt: toIso(issuedAt),
        expiresAt: toIso(expiresAt),
      });
      onSaved();
    } catch (err) {
      setError(errMessage(err, 'Could not save those details.'));
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {DOCUMENT_KINDS[document.kind].label}
        </h2>
        <p className="mt-1 mb-5 text-sm text-[var(--color-text-muted)]">
          Recording the expiry lets us warn you before this lapses.
        </p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Document number{' '}
              <span className="font-normal normal-case text-[var(--color-text-faint)]">(opt.)</span>
            </label>
            <input
              className={inputClass}
              placeholder="e.g. CIPA/2019/12345"
              value={documentNumber}
              onChange={(event) => setDocumentNumber(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Issued</label>
              <input
                type="date"
                className={inputClass}
                value={issuedAt}
                onChange={(event) => setIssuedAt(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Expires</label>
              <input
                type="date"
                className={inputClass}
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
              />
            </div>
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
              {saving ? 'Saving…' : 'Save details'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
