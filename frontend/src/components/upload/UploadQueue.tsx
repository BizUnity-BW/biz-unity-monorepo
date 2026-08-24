import { formatFileSize } from '../../lib/format';
import type { UploadItem } from '../../hooks/useDocumentUpload';
import { IconDocument, IconWarning } from '../ui/icons';

const PHASE_NOTE: Record<UploadItem['phase'], string> = {
  queued: 'ready to upload',
  requesting: 'preparing…',
  uploading: '',
  confirming: 'saving…',
  done: '',
  error: '',
};

interface Props {
  items: UploadItem[];
  /** Client-side validation failures, as ready-to-render messages. */
  rejected: string[];
  onRetry: (localId: string) => void;
  onRemove: (localId: string) => void;
}

/**
 * Presentational queue for `useDocumentUpload`.
 *
 * Separate from the drop zone and from the hook so a caller that needs to drive the
 * upload from its own submit handler — the record-payment flow, where the payment has
 * to exist before a file can link to it — can compose the pieces itself.
 */
export default function UploadQueue({ items, rejected, onRetry, onRemove }: Props) {
  if (items.length === 0 && rejected.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {rejected.length > 0 && (
        <ul className="flex flex-col gap-1">
          {rejected.map((message) => (
            <li key={message} className="flex items-start gap-2 text-xs text-red-400">
              <IconWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {message}
            </li>
          ))}
        </ul>
      )}

      {/* Announced so additions, completions and failures reach a screen reader. */}
      <ul aria-live="polite" className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.localId}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-2.5"
          >
            <IconDocument className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[var(--color-text)]">{item.file.name}</p>
              <p className="text-xs text-[var(--color-text-faint)]">
                {formatFileSize(item.file.size)}
                {item.phase === 'uploading' && item.progress !== null
                  ? ` · ${item.progress}%`
                  : PHASE_NOTE[item.phase] && ` · ${PHASE_NOTE[item.phase]}`}
              </p>

              {(item.phase === 'uploading' || item.phase === 'confirming') && (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--color-border-subtle)]">
                  <div
                    // An indeterminate bar is the cost of the fallback transport,
                    // which has no progress events.
                    className={`h-full bg-amber-500 transition-[width] duration-200 ${
                      item.progress === null ? 'w-1/3 animate-pulse' : ''
                    }`}
                    style={item.progress === null ? undefined : { width: `${item.progress}%` }}
                  />
                </div>
              )}

              {item.error && <p className="mt-1 text-xs text-red-400">{item.error}</p>}
            </div>

            {item.phase === 'done' && (
              <span className="shrink-0 text-xs font-medium text-emerald-500">Uploaded</span>
            )}

            {item.phase === 'error' && (
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => onRetry(item.localId)}
                  className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)]"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item.localId)}
                  className="rounded-lg px-2 py-1 text-xs text-[var(--color-text-faint)] transition-colors hover:text-[var(--color-text)]"
                >
                  Discard
                </button>
              </div>
            )}

            {item.phase === 'queued' && (
              <button
                type="button"
                onClick={() => onRemove(item.localId)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs text-[var(--color-text-faint)] transition-colors hover:text-[var(--color-text)]"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
