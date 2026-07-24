import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customersApi } from '../../api/customers';
import type { Customer } from '../../types';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-faint)] focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors';

const labelClass = 'text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide';

/** Maps empty strings to undefined so optional fields aren't stored as "". */
function clean(data: FormData): Partial<Customer> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = typeof v === 'string' && v.trim() === '' ? undefined : v;
  }
  return out as Partial<Customer>;
}

function errMessage(err: unknown): string {
  return (
    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
    'Something went wrong. Please try again.'
  );
}

interface Props {
  open: boolean;
  /** When set, the modal edits this customer; otherwise it creates a new one. */
  initial?: Customer | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CustomerFormModal({ open, initial, onClose, onSaved }: Props) {
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(initial);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Re-seed the form each time the modal opens (for edit) or clears (for create).
  useEffect(() => {
    if (!open) return;
    setError(null);
    reset({
      firstName: initial?.firstName ?? '',
      lastName: initial?.lastName ?? '',
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      company: initial?.company ?? '',
      address: initial?.address ?? '',
      notes: initial?.notes ?? '',
    });
  }, [open, initial, reset]);

  if (!open) return null;

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      if (isEdit && initial) {
        await customersApi.update(initial.id, clean(data));
      } else {
        await customersApi.create(clean(data));
      }
      onSaved();
    } catch (err) {
      setError(errMessage(err));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-[var(--color-text)]">
          {isEdit ? 'Edit customer' : 'New customer'}
        </h2>
        <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
          {isEdit ? 'Update this customer’s details.' : 'Add a customer to your organisation.'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>First name</label>
              <input className={inputClass} placeholder="Thabo" {...register('firstName')} />
              {errors.firstName && (
                <span className="text-xs text-red-400">{errors.firstName.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Last name</label>
              <input className={inputClass} placeholder="Molefe" {...register('lastName')} />
              {errors.lastName && (
                <span className="text-xs text-red-400">{errors.lastName.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Email{' '}
                <span className="font-normal normal-case text-[var(--color-text-faint)]">
                  (opt.)
                </span>
              </label>
              <input
                type="email"
                className={inputClass}
                placeholder="thabo@company.com"
                {...register('email')}
              />
              {errors.email && <span className="text-xs text-red-400">{errors.email.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Phone{' '}
                <span className="font-normal normal-case text-[var(--color-text-faint)]">
                  (opt.)
                </span>
              </label>
              <input
                type="tel"
                className={inputClass}
                placeholder="+267 71 234 567"
                {...register('phone')}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Company{' '}
              <span className="font-normal normal-case text-[var(--color-text-faint)]">(opt.)</span>
            </label>
            <input className={inputClass} placeholder="Acme (Pty) Ltd" {...register('company')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Address{' '}
              <span className="font-normal normal-case text-[var(--color-text-faint)]">(opt.)</span>
            </label>
            <textarea
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="123 Main St, Gaborone"
              {...register('address')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Notes{' '}
              <span className="font-normal normal-case text-[var(--color-text-faint)]">(opt.)</span>
            </label>
            <textarea
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Anything worth remembering about this customer"
              {...register('notes')}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400 disabled:bg-amber-500/40"
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
