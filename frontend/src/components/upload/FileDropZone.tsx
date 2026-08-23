import { useId, useRef, useState } from 'react';
import { IconUpload } from '../ui/icons';

interface Props {
  accept: string;
  multiple: boolean;
  hint: string;
  disabled?: boolean;
  label?: string;
  compact?: boolean;
  onFiles: (files: File[]) => void;
}

/**
 * Presentational drop target plus an accessible file input. Knows nothing about the
 * network.
 *
 * Accessibility: the real `<input type="file">` is the control — visually hidden but
 * focusable — and the `<label htmlFor>` gives keyboard and screen-reader activation
 * for free, so no ARIA is needed. The drop `<div>` is pure progressive enhancement
 * and deliberately gets no `role`/`tabIndex`: a second focus stop that does nothing
 * on Enter is worse than none.
 */
export default function FileDropZone({
  accept,
  multiple,
  hint,
  disabled = false,
  label = 'Choose file',
  compact = false,
  onFiles,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const files = Array.from(event.dataTransfer.files);
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={(event) => {
        // dragleave also fires when crossing into a child, so ignore those.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={handleDrop}
      className={`rounded-2xl border border-dashed text-center transition-colors ${
        compact ? 'px-4 py-5' : 'px-5 py-8'
      } ${
        dragging
          ? 'border-amber-500/60 bg-amber-500/5'
          : 'border-[var(--color-border)] bg-[var(--color-surface)]'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {!compact && (
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
          <IconUpload />
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) onFiles(files);
          // Reset so re-picking the same file after a failure fires change again.
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
      <label
        htmlFor={inputId}
        className={`inline-flex cursor-pointer rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-amber-400 focus-within:ring-2 focus-within:ring-amber-500/40 ${
          disabled ? 'pointer-events-none' : ''
        }`}
      >
        {label}
      </label>

      <p className="mt-2 text-xs text-[var(--color-text-muted)]">or drag and drop here</p>
      <p className="mt-1 text-xs text-[var(--color-text-faint)]">{hint}</p>
    </div>
  );
}
