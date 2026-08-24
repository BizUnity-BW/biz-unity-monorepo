import type { PaginationMeta } from '../../types';

/** Shared by every admin list. All of them are cross-tenant and unbounded. */
export default function Pagination({
  meta,
  onPage,
}: {
  meta: PaginationMeta | undefined;
  onPage: (page: number) => void;
}) {
  if (!meta || meta.pages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
      <p className="text-[var(--color-text-secondary)]">
        Page {meta.page} of {meta.pages} · {meta.total} total
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPage(meta.page - 1)}
          disabled={meta.page <= 1}
          className="rounded-lg border border-[var(--color-border-strong)] px-3 py-1.5 text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={() => onPage(meta.page + 1)}
          disabled={meta.page >= meta.pages}
          className="rounded-lg border border-[var(--color-border-strong)] px-3 py-1.5 text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
