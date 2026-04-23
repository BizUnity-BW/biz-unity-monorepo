import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import ThemeToggle from '../../components/ui/ThemeToggle';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-faint)] focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const passwordReset = searchParams.get('reset') === 'success';
  const [authError, setAuthError] = useState<string | null>(null);
  const theme = useThemeStore((s) => s.theme);
  const logo = theme === 'dark' ? '/BizUnity_Logo_BB.png' : '/BizUnity_Logo_WB.png';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setAuthError(error.message);
    } else {
      navigate('/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/8 blur-[100px]" />
      </div>

      {/* Theme toggle   top right */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/">
            <img src={logo} alt="BizUnity" className="h-14 w-auto" />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8">
          <h1 className="text-xl font-bold text-[var(--color-text)] mb-1">Welcome back</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-7">Sign in to your BizUnity account</p>

          {passwordReset && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-sm rounded-xl px-4 py-3 mb-5">
              Password updated. You can sign in with your new password.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                Email address
              </label>
              <input type="email" placeholder="you@example.com" autoComplete="email" className={inputClass} {...register('email')} />
              {errors.email && <span className="text-red-400 text-xs">{errors.email.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-amber-500/80 hover:text-amber-500 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input type="password" placeholder="••••••••" autoComplete="current-password" className={inputClass} {...register('password')} />
              {errors.password && <span className="text-red-400 text-xs">{errors.password.message}</span>}
            </div>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 text-black font-bold py-3 rounded-xl text-sm transition-colors mt-2"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
