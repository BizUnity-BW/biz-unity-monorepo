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
