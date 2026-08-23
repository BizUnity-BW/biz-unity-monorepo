import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersApi } from '../../api/users';
import { useAuth } from '../../hooks/useAuth';
import { errMessage } from '../../lib/format';
import ImageUploader from '../../components/upload/ImageUploader';

const inputClass =
  'w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-faint)] focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors';
const labelClass = 'text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide';

const schema = z.object({
  firstName: z.string().min(1, 'Enter your first name').max(100),
  lastName: z.string().min(1, 'Enter your last name').max(100),
  phone: z.string().max(40).or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function ProfileSettings() {
  const { profile, fetchProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      phone: profile?.phone ?? '',
    },
  });

  const initials =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
      : (profile?.email?.[0]?.toUpperCase() ?? '?');

  async function onSubmit(values: FormData) {
    setError(null);
    setSaved(false);
    try {
      await usersApi.updateMe({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim() || undefined,
      });
      await fetchProfile();
      setSaved(true);
    } catch (err) {
      setError(errMessage(err, 'Could not save your profile.'));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">Profile photo</h2>
        <p className="mt-1 mb-4 text-sm text-[var(--color-text-muted)]">
          Shown in the header and anywhere your name appears.
        </p>
        <ImageUploader
          kind="USER_AVATAR"
          currentUrl={profile?.avatarUrl ?? null}
          initials={initials}
          shape="circle"
          userProfileId={profile?.id}
          onUploaded={fetchProfile}
        />
      </section>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      >
        <h2 className="text-sm font-semibold text-[var(--color-text)]">Your details</h2>
        <p className="mt-1 mb-5 text-sm text-[var(--color-text-muted)]">
          Your name appears on the records you create.
        </p>

        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>First name</label>
              <input className={inputClass} {...register('firstName')} />
              {errors.firstName && (
                <span className="text-xs text-red-400">{errors.firstName.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Last name</label>
              <input className={inputClass} {...register('lastName')} />
              {errors.lastName && (
                <span className="text-xs text-red-400">{errors.lastName.message}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Phone{' '}
              <span className="font-normal normal-case text-[var(--color-text-faint)]">(opt.)</span>
            </label>
            <input className={inputClass} {...register('phone')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Email</label>
            <p className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
              {profile?.email ?? '—'}
            </p>
            <span className="text-xs text-[var(--color-text-faint)]">
              Your sign-in email cannot be changed here.
            </span>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {saved && !error && <p className="text-sm text-emerald-500">Profile saved.</p>}

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
