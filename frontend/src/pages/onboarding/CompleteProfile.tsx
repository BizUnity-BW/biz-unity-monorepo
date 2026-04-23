import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import { useThemeStore } from '../../store/themeStore';
import ThemeToggle from '../../components/ui/ThemeToggle';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-faint)] focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { fetchProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const theme = useThemeStore((s) => s.theme);
  const logo = theme === 'dark' ? '/BizUnity_Logo_BB.png' : '/BizUnity_Logo_WB.png';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      await authApi.completeProfile(data);
      await fetchProfile();
      navigate('/onboarding/company');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Something went wrong. Please try again.';
      setError(msg);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/8 blur-[100px]" />
      </div>

      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <Link to="/">
            <img src={logo} alt="BizUnity" className="h-14 w-auto" />
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 gap-2">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-black text-xs font-black flex items-center justify-center flex-shrink-0">1</div>
            <span className="text-sm font-semibold text-amber-500">Your profile</span>
          </div>
          <div className="w-8 h-px bg-[var(--color-border-strong)] flex-shrink-0" />
          <div className="flex items-center gap-2.5 flex-1 justify-end">
            <span className="text-sm text-[var(--color-text-faint)]">Company setup</span>
            <div className="w-7 h-7 rounded-lg bg-[var(--color-border)] border border-[var(--color-border-strong)] text-[var(--color-text-faint)] text-xs font-black flex items-center justify-center flex-shrink-0">2</div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8">
          <h1 className="text-xl font-bold text-[var(--color-text)] mb-1">Tell us about yourself</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-7">This helps personalise your experience.</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                  First name
                </label>
                <input type="text" placeholder="Jane" autoComplete="given-name" className={inputClass} {...register('firstName')} />
                {errors.firstName && <span className="text-red-400 text-xs">{errors.firstName.message}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                  Last name
                </label>
                <input type="text" placeholder="Smith" autoComplete="family-name" className={inputClass} {...register('lastName')} />
                {errors.lastName && <span className="text-red-400 text-xs">{errors.lastName.message}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                Phone <span className="text-[var(--color-text-faint)] normal-case font-normal">(optional)</span>
              </label>
              <input type="tel" placeholder="+267 71 234 567" autoComplete="tel" className={inputClass} {...register('phone')} />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 text-black font-bold py-3 rounded-xl text-sm transition-colors mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Saving…' : (
                <>
                  Continue
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
