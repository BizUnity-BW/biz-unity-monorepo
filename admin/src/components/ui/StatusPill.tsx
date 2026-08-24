type Tone = 'gray' | 'amber' | 'green' | 'red' | 'blue';

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
};

export default function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? 'gray';
  const label = status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ');
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}
