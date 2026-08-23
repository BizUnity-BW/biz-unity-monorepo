import { useRef, useState } from 'react';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';
import { DOCUMENT_KINDS, validateFile } from '../../lib/uploadKinds';
import Avatar from '../ui/Avatar';
import { IconWarning } from '../ui/icons';

interface Props {
  kind: 'ORGANISATION_LOGO' | 'USER_AVATAR';
  currentUrl: string | null;
  initials: string;
  shape?: 'square' | 'circle';
  userProfileId?: string;
  /** Callers pass `fetchProfile`: the shell reads the URL from the store, not here. */
  onUploaded: () => Promise<void> | void;
}

/**
 * Single-image, replace-in-place surface for the org logo and the user avatar.
 *
 * Shows a local object-URL preview the instant a file is picked, so the change feels
 * immediate, then refreshes the auth store and drops the preview so the stored URL
 * takes over. Refreshing the store is mandatory rather than cosmetic: the header and
 * sidebar read the image straight from it, so local state alone would leave the
 * chrome showing the old picture.
 */
export default function ImageUploader({
  kind,
  currentUrl,
  initials,
  shape = 'square',
  userProfileId,
  onUploaded,
}: Props) {
  const config = DOCUMENT_KINDS[kind];
  const [preview, setPreview] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  const upload = useDocumentUpload({
    kind,
    userProfileId,
    onUploaded: async () => {
      await onUploaded();
      revokePreview();
    },
  });

  function revokePreview() {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPreview(null);
  }

  function pick(files: File[]) {
    const file = files[0];
    if (!file) return;

    const invalid = validateFile(file, config);
    setProblem(invalid);
    if (invalid) return;

    revokePreview();
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setPreview(url);
    upload.addFiles([file]);
  }

  const failed = upload.items.find((item) => item.phase === 'error');
  const size = shape === 'circle' ? 'h-20 w-20' : 'h-20 w-20';

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar
          url={preview ?? currentUrl}
          initials={initials}
          sizeClass={size}
          shape={shape}
          className="text-lg"
        />
        {upload.busy && (
          <div
            className={`absolute inset-0 flex items-center justify-center bg-black/50 ${
              shape === 'circle' ? 'rounded-full' : 'rounded-lg'
            }`}
          >
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept={config.accept}
          className="sr-only"
          onChange={(event) => {
            pick(Array.from(event.target.files ?? []));
            if (inputRef.current) inputRef.current.value = '';
          }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={upload.busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] disabled:opacity-50"
          >
            {currentUrl ? 'Change' : 'Upload'} {shape === 'circle' ? 'photo' : 'logo'}
          </button>
          {failed && (
            <button
              type="button"
              onClick={() => upload.retry(failed.localId)}
              className="rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-sm font-medium text-amber-500 transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              Retry
            </button>
          )}
        </div>

        {problem || failed?.error ? (
          <p className="flex items-start gap-1.5 text-xs text-red-400">
            <IconWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {problem ?? failed?.error}
          </p>
        ) : (
          <p className="text-xs text-[var(--color-text-faint)]">{config.hint}</p>
        )}
      </div>
    </div>
  );
}
