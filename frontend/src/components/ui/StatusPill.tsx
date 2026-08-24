export type Tone = 'gray' | 'amber' | 'green' | 'red' | 'blue';

const TONE_CLASSES: Record<Tone, string> = {
  gray: 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
  amber: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  green: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  red: 'bg-red-500/10 text-red-400 border-red-500/30',
  blue: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
};

// Maps quotation + invoice statuses to a colour tone.
const STATUS_TONE: Record<string, Tone> = {
  // Quotation
  DRAFT: 'gray',
  SENT: 'blue',
  ACCEPTED: 'green',
  REJECTED: 'red',
  EXPIRED: 'gray',
  CONVERTED: 'amber',
  // Invoice
  PARTIALLY_PAID: 'amber',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'gray',
  // Payment verification + document review
  PENDING: 'amber',
  VERIFIED: 'green',
  NOT_REQUIRED: 'gray',
};

export default function StatusPill({
  status,
  tone: toneOverride,
  label: labelOverride,
}: {
  status: string;
  /**
   * Overrides the STATUS_TONE lookup for statuses whose meaning is
   * context-dependent. `EXPIRED` is grey for a lapsed quotation but must be red for
   * an expired trade licence, and one shared map cannot express both.
   */
  tone?: Tone;
  /** Overrides the derived label, e.g. "Expires in 12 days". */
  label?: string;
}) {
  const tone = toneOverride ?? STATUS_TONE[status] ?? 'gray';
  const label =
    labelOverride ?? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ');
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}
