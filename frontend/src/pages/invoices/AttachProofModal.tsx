import { useState } from 'react';
import { documentsApi } from '../../api/documents';
import { formatMoney, formatDate, formatFileSize, errMessage } from '../../lib/format';
import DocumentUploader from '../../components/upload/DocumentUploader';
import { IconDocument, IconDownload } from '../../components/ui/icons';
import { downloadFromUrl } from '../../lib/download';
import type { DocumentRecord, Payment } from '../../types';

interface Props {
  payment: Payment;
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}

/** Attach proof to a payment that has already been recorded. */
export default function AttachProofModal({ payment, currency, onClose, onSaved }: Props) {
  const [attached, setAttached] = useState<DocumentRecord[]>(payment.documents ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // The confirm response is the canonical record, so appending it is not optimism —
  // there is nothing to reconcile and no need to refetch.
  function handleUploaded(document: DocumentRecord) {
    setAttached((previous) => [...previous, document]);
  }

  async function open(document: DocumentRecord) {
    setBusyId(document.id);
    setError(null);
    try {
      const res = await documentsApi.downloadUrl(document.id);
      downloadFromUrl(res.data.data.url, document.fileName);
    } catch (err) {
      setError(errMessage(err, 'Could not open that document.'));
    } finally {
      setBusyId(null);
    }
  }

  const rejected = payment.verificationStatus === 'REJECTED';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {rejected ? 'Resubmit proof of payment' : 'Proof of payment'}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {formatMoney(payment.amountCents, currency)} on {formatDate(payment.paidAt)}
        </p>

        {rejected && payment.rejectionReason && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span className="font-medium">Rejected:</span> {payment.rejectionReason}
            <p className="mt-1 text-xs text-red-400/80">
              Upload a clearer document to send it back for verification.
            </p>
          </div>
        )}

        {attached.length > 0 && (
          <ul className="mt-5 flex flex-col gap-2">
            {attached.map((document) => (
              <li
                key={document.id}
                className="flex items-center gap-3 rounded-xl border border-[var(--color-border-subtle)] px-3 py-2.5"
              >
                <IconDocument className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[var(--color-text)]">{document.fileName}</p>
                  <p className="text-xs text-[var(--color-text-faint)]">
                    {formatFileSize(document.sizeBytes)} · {formatDate(document.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => open(document)}
                  disabled={busyId === document.id}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                >
                  <IconDownload className="h-3.5 w-3.5" />
                  {busyId === document.id ? 'Opening…' : 'Download'}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5">
          <DocumentUploader
            kind="PROOF_OF_PAYMENT"
            paymentId={payment.id}
            compact
            onUploaded={handleUploaded}
          />
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onSaved}
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
