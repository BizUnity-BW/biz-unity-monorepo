import { useDocumentUpload } from '../../hooks/useDocumentUpload';
import type { DocumentKind, DocumentRecord } from '../../types';
import FileDropZone from './FileDropZone';
import UploadQueue from './UploadQueue';

interface Props {
  kind: DocumentKind;
  paymentId?: string;
  compact?: boolean;
  label?: string;
  onUploaded?: (document: DocumentRecord) => void;
}

/**
 * Self-driving file uploader: pick a file and it uploads immediately.
 *
 * Used where the owning record already exists — the compliance pack, and attaching
 * proof to an already-recorded payment. The record-payment flow composes
 * `useDocumentUpload` with `FileDropZone` and `UploadQueue` itself instead, because
 * there the payment must be created before a file can link to it.
 */
export default function DocumentUploader({
  kind,
  paymentId,
  compact = false,
  label,
  onUploaded,
}: Props) {
  const upload = useDocumentUpload({ kind, paymentId, onUploaded });

  return (
    <div className="flex flex-col gap-3">
      <FileDropZone
        accept={upload.config.accept}
        multiple={upload.config.multiple}
        hint={upload.config.hint}
        compact={compact}
        disabled={upload.busy}
        label={label ?? (upload.config.multiple ? 'Choose files' : 'Choose file')}
        onFiles={upload.addFiles}
      />
      <UploadQueue
        items={upload.items}
        rejected={upload.rejected}
        onRetry={upload.retry}
        onRemove={upload.remove}
      />
    </div>
  );
}
