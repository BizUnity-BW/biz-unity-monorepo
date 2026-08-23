import { useState } from 'react';
import { documentsApi } from '../../api/documents';
import { DOCUMENT_KINDS } from '../../lib/uploadKinds';
import { daysUntil, errMessage, formatDate, formatFileSize } from '../../lib/format';
import { downloadFromUrl } from '../../lib/download';
import DocumentUploader from '../../components/upload/DocumentUploader';
import StatusPill from '../../components/ui/StatusPill';
import { IconDocument, IconDownload, IconTrash } from '../../components/ui/icons';
import type { DocumentKind, DocumentRecord } from '../../types';

interface Props {
  kind: DocumentKind;
  document: DocumentRecord | undefined;
  readOnly?: boolean;
  onChanged: () => void;
  onEditDetails: (document: DocumentRecord) => void;
  onDelete: (document: DocumentRecord) => void;
}

/**
 * An expiry pill.
 *
 * `EXPIRED` maps to grey in the shared status map because that is right for a lapsed
 * quotation — but an expired trade licence is a problem, so the tone is overridden.
 */
function ExpiryPill({ expiresAt }: { expiresAt: string | null }) {
  const days = daysUntil(expiresAt);
  if (days === null) return null;
  if (days < 0) {
    return <StatusPill status="EXPIRED" tone="red" label={`Expired ${formatDate(expiresAt)}`} />;
  }
  if (days <= 30) {
    return (
      <StatusPill
        status="EXPIRING"
        tone="amber"
        label={`Expires in ${days} ${days === 1 ? 'day' : 'days'}`}
      />
    );
  }
  if (days <= 60) {
    return <StatusPill status="EXPIRING" tone="blue" label={`Expires ${formatDate(expiresAt)}`} />;
  }
  return null;
}

/** One row of the compliance pack: a fixed slot, filled or not. */
export default function DocumentSlot({
  kind,
  document,
  readOnly = false,
  onChanged,
  onEditDetails,
  onDelete,
}: Props) {
  const config = DOCUMENT_KINDS[kind];
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    if (!document) return;
    setBusy(true);
    setError(null);
    try {
      const res = await documentsApi.downloadUrl(document.id);
      downloadFromUrl(res.data.data.url, document.fileName);
    } catch (err) {
      setError(errMessage(err, 'Could not open that document.'));
    } finally {
      setBusy(false);
    }
  }

  const meta = document
    ? [
        document.documentNumber && `No. ${document.documentNumber}`,
        document.issuedAt && `Issued ${formatDate(document.issuedAt)}`,
        document.expiresAt && `Expires ${formatDate(document.expiresAt)}`,
      ].filter(Boolean)
    : [];

  return (
    <li className="flex flex-col gap-3 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <IconDocument
              className={`h-5 w-5 shrink-0 ${
                document ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-faintest)]'
              }`}
            />
            <span className="text-sm font-medium text-[var(--color-text)]">{config.label}</span>
            {document ? (
              <>
                <StatusPill status={document.reviewStatus} />
                <ExpiryPill expiresAt={document.expiresAt} />
              </>
            ) : (
              <span className="text-xs text-[var(--color-text-faint)]">Not uploaded</span>
            )}
          </div>

          {document && (
            <p className="mt-1 pl-7 text-xs text-[var(--color-text-faint)]">
              {document.fileName} · {formatFileSize(document.sizeBytes)}
              {meta.length > 0 && ` · ${meta.join(' · ')}`}
            </p>
          )}
        </div>

        {!readOnly && (
          <div className="flex shrink-0 flex-wrap gap-1.5">
            {document && (
              <>
                <button
                  type="button"
                  onClick={download}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                >
                  <IconDownload className="h-3.5 w-3.5" />
                  {busy ? 'Opening…' : 'View'}
                </button>
                <button
                  type="button"
                  onClick={() => onEditDetails(document)}
                  className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)]"
                >
                  Details
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setUploading((open) => !open)}
              className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-amber-500 transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              {uploading ? 'Cancel' : document ? 'Replace' : 'Upload'}
            </button>
            {document && (
              <button
                type="button"
                onClick={() => onDelete(document)}
                aria-label={`Delete ${config.label}`}
                className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[var(--color-text-faint)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-red-400"
              >
                <IconTrash />
              </button>
            )}
          </div>
        )}
      </div>

      {document?.reviewStatus === 'REJECTED' && document.rejectionReason && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <span className="font-medium">Rejected:</span> {document.rejectionReason} Upload a
          replacement to send it back for review.
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {uploading && (
        <DocumentUploader
          kind={kind}
          compact
          onUploaded={() => {
            setUploading(false);
            onChanged();
          }}
        />
      )}
    </li>
  );
}
