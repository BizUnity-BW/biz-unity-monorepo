import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { organisationsApi } from '../../api/organisations';
import { useAuth } from '../../hooks/useAuth';
import { errMessage } from '../../lib/format';
import ImageUploader from '../../components/upload/ImageUploader';

const inputClass =
  'w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-faint)] focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors';
const labelClass = 'text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide';

const schema = z.object({
  name: z.string().min(2, 'Enter your organisation name').max(100),
  email: z.string().email('Enter a valid email').or(z.literal('')),
  phone: z.string().max(40).or(z.literal('')),
  address: z.string().max(300).or(z.literal('')),
  vatNumber: z.string().max(50).or(z.literal('')),
  currency: z.string().length(3, 'Use a 3-letter code, e.g. BWP'),
});

type FormData = z.infer<typeof schema>;

/** Empty strings mean "not set", which the API expresses as an absent field. */
function clean(value: string): string | undefined {
  return value.trim() === '' ? undefined : value.trim();
}

export default function OrganisationSettings() {
  const { organisation, profile, fetchProfile } = useAuth();
  const canManage = profile?.orgRole === 'OWNER' || profile?.orgRole === 'MANAGER';

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: organisation?.name ?? '',
      email: organisation?.email ?? '',
      phone: organisation?.phone ?? '',
      address: organisation?.address ?? '',
      vatNumber: organisation?.vatNumber ?? '',
      currency: organisation?.currency ?? 'BWP',
    },
  });

  const orgInitials = (organisation?.name ?? 'B')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  async function onSubmit(values: FormData) {
    setError(null);
    setSaved(false);
    try {
      await organisationsApi.update({
        name: values.name.trim(),
        email: clean(values.email),
        phone: clean(values.phone),
        address: clean(values.address),
        vatNumber: clean(values.vatNumber),
        currency: values.currency.toUpperCase(),
      });
      await fetchProfile();
      setSaved(true);
    } catch (err) {
      setError(errMessage(err, 'Could not save your organisation.'));
    }
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-8 text-center">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          You do not have permission to manage organisation settings
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-text-muted)]">
          Ask an owner or manager in {organisation?.name ?? 'your organisation'} to make these
          changes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">Logo</h2>
        <p className="mt-1 mb-4 text-sm text-[var(--color-text-muted)]">
          Appears in your sidebar and on the verified-payments statement you share with funders.
        </p>
        <ImageUploader
          kind="ORGANISATION_LOGO"
          currentUrl={organisation?.logoUrl ?? null}
          initials={orgInitials}
          shape="square"
          onUploaded={fetchProfile}
        />
      </section>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      >
        <h2 className="text-sm font-semibold text-[var(--color-text)]">Organisation details</h2>
        <p className="mt-1 mb-5 text-sm text-[var(--color-text-muted)]">
          Used on your quotations, invoices and funder statements.
        </p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Name</label>
            <input className={inputClass} {...register('name')} />
            {errors.name && <span className="text-xs text-red-400">{errors.name.message}</span>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Email{' '}
                <span className="font-normal normal-case text-[var(--color-text-faint)]">
                  (opt.)
                </span>
              </label>
              <input className={inputClass} {...register('email')} />
              {errors.email && <span className="text-xs text-red-400">{errors.email.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Phone{' '}
                <span className="font-normal normal-case text-[var(--color-text-faint)]">
                  (opt.)
                </span>
              </label>
              <input className={inputClass} {...register('phone')} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Address{' '}
              <span className="font-normal normal-case text-[var(--color-text-faint)]">(opt.)</span>
            </label>
            <textarea rows={2} className={`${inputClass} resize-none`} {...register('address')} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                VAT number{' '}
                <span className="font-normal normal-case text-[var(--color-text-faint)]">
                  (opt.)
                </span>
              </label>
              <input className={inputClass} {...register('vatNumber')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Currency</label>
              <input className={inputClass} maxLength={3} {...register('currency')} />
              {errors.currency && (
                <span className="text-xs text-red-400">{errors.currency.message}</span>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {saved && !error && (
            <p className="text-sm text-emerald-500">Organisation details saved.</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400 disabled:bg-amber-500/40"
            >
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
