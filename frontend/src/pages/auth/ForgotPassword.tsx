import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { supabase } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import ThemeToggle from '../../components/ui/ThemeToggle';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-faint)] focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors';

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const theme = useThemeStore((s) => s.theme);
  const logo = theme === 'dark' ? '/BizUnity_Logo_BB.png' : '/BizUnity_Logo_BB.png';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
        <div className="fixed top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md text-center">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-10">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-7 h-7 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">Check your email</h2>
            <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
              If that email is registered, we&apos;ve sent a password reset link to it.
            </p>
          </div>
          <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
            <Link
              to="/login"
              className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
            >
              Back to sign in
            </Link>
          </p>
        </div>
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
            <img src={logo} alt="BizUnity" className="h-24 w-auto" />
          </Link>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8">
          <h1 className="text-xl font-bold text-[var(--color-text)] mb-1">Reset your password</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-7">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className={inputClass}
                {...register('email')}
              />
              {errors.email && <span className="text-red-400 text-xs">{errors.email.message}</span>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 text-black font-bold py-3 rounded-xl text-sm transition-colors mt-2"
            >
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
          <Link
            to="/login"
            className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
