/**
 * Startup configuration, read once.
 *
 * Collected rather than thrown: this module's values reach `createClient`, and a
 * throw there happens while modules are being evaluated — before React mounts — so
 * the page would render as a black void with no error overlay and nothing naming
 * the missing variable.
 */
const RAW: Record<string, string | undefined> = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

/** `your-anon-key` is the literal placeholder in `.env.example`; copying the example
 *  and not filling it in is the most common way to get here, and the placeholder is a
 *  valid string, so the client would otherwise construct and fail later instead. */
function isUnset(value: string | undefined): boolean {
  if (typeof value !== 'string') return true;
  const trimmed = value.trim();
  return trimmed === '' || trimmed.startsWith('your-');
}

export const missingEnvVars: string[] = Object.keys(RAW).filter((key) => isUnset(RAW[key]));
export const isConfigured: boolean = missingEnvVars.length === 0;

/** Placeholders only so `createClient` cannot throw; never used for a request. */
export const supabaseUrl: string = isUnset(RAW.VITE_SUPABASE_URL)
  ? 'http://localhost'
  : (RAW.VITE_SUPABASE_URL as string);
export const supabaseAnonKey: string = isUnset(RAW.VITE_SUPABASE_ANON_KEY)
  ? 'unconfigured-anon-key'
  : (RAW.VITE_SUPABASE_ANON_KEY as string);
