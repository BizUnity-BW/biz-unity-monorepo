import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import ThemeToggle from '../../components/ui/ThemeToggle';

const schema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-faint)] focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors';

export default function ResetPasswordCallback() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const theme = useThemeStore((s) => s.theme);
  const logo = theme === 'dark' ? '/BizUnity_Logo_BB.png' : '/BizUnity_Logo_WB.png';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else navigate('/forgot-password');
    });
  }, [navigate]);

  async function onSubmit(data: FormData) {
    setSubmitError(null);
    const { error } = await supabase.auth.updateUser({ password: data.newPassword });
    if (error) { setSubmitError(error.message); return; }
    await supabase.auth.signOut();
    navigate('/login?reset=success');
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/8 blur-[100px]" />
      </div>

      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link to="/">
            <img src={logo} alt="BizUnity" className="h-14 w-auto" />
          </Link>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8">
          <h1 className="text-xl font-bold text-[var(--color-text)] mb-1">Choose a new password</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-7">Make it strong   at least 8 characters.</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                New password
              </label>
              <input type="password" placeholder="Min. 8 characters" autoComplete="new-password" className={inputClass} {...register('newPassword')} />
              {errors.newPassword && <span className="text-red-400 text-xs">{errors.newPassword.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                Confirm new password
              </label>
              <input type="password" placeholder="••••••••" autoComplete="new-password" className={inputClass} {...register('confirmPassword')} />
              {errors.confirmPassword && <span className="text-red-400 text-xs">{errors.confirmPassword.message}</span>}
            </div>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 text-black font-bold py-3 rounded-xl text-sm transition-colors mt-2"
            >
              {isSubmitting ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
          <Link to="/login" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
