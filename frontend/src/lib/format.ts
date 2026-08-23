/** Format an integer cents amount as currency (defaults to BWP). */
export function formatMoney(cents: number, currency = 'BWP'): string {
  try {
    return new Intl.NumberFormat('en-BW', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format((cents ?? 0) / 100);
  } catch {
    // Unknown currency code → fall back to a plain formatted number with the code prefix.
    return `${currency} ${((cents ?? 0) / 100).toFixed(2)}`;
  }
}

/** Format an ISO date string as e.g. "24 Jul 2026". Returns "—" for null/empty. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Extract a human-readable message from an axios-style error. */
export function errMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback;
}

/** Format a byte count as e.g. "482 KB" or "1.4 MB". */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

/**
 * Whole days from today until an ISO date. Negative once past, null when absent.
 *
 * Compared at date granularity rather than by milliseconds, so a licence expiring
 * later today reads as 0 days instead of a confusing -1.
 */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const then = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((then - today) / 86_400_000);
}

/**
 * Today as the `YYYY-MM-DD` an `<input type="date">` expects.
 *
 * Built from local date parts, not `toISOString().slice(0, 10)`: for a UTC+2 user
 * late in the evening that idiom returns yesterday, which is a real off-by-one on a
 * statement date range.
 */
export function toDateInput(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** First day of the month a date falls in, as a date-input string. */
export function startOfMonthInput(date: Date = new Date()): string {
  return toDateInput(new Date(date.getFullYear(), date.getMonth(), 1));
}
