/**
 * Startup configuration, read once.
 *
 * Vite inlines `import.meta.env` at build time and the app reads it only at
 * startup. A missing value used to reach `createClient(undefined, undefined)` in
 * the auth store, which throws while that module is being evaluated — before React
 * mounts — so the page rendered as a black void with an empty `#root` and no Vite
 * error overlay. Nothing on screen said which variable was missing.
 *
 * So this module collects problems instead of throwing, letting the app render a
 * page that names them.
 */

const RAW: Record<string, string | undefined> = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

/**
 * `your-anon-key` and friends are the literal placeholders in `.env.example`.
 * Copying the example and forgetting to fill it in is the most common way to get
 * here, and it is worth catching: the placeholder is a valid string, so the client
 * constructs fine and then fails later with an opaque auth error instead.
 */
function isUnset(value: string | undefined): boolean {
  if (typeof value !== 'string') return true;
  const trimmed = value.trim();
  return trimmed === '' || trimmed.startsWith('your-');
}

export const missingEnvVars: string[] = Object.keys(RAW).filter((key) => isUnset(RAW[key]));

export const isConfigured: boolean = missingEnvVars.length === 0;

/**
 * Fallbacks exist only so `createClient` cannot throw during module evaluation.
 * They are never used for a real request: when `isConfigured` is false the app
 * renders the configuration screen and never reaches the network.
 */
export const supabaseUrl: string = isUnset(RAW.VITE_SUPABASE_URL)
  ? 'http://localhost'
  : (RAW.VITE_SUPABASE_URL as string);

export const supabaseAnonKey: string = isUnset(RAW.VITE_SUPABASE_ANON_KEY)
  ? 'unconfigured-anon-key'
  : (RAW.VITE_SUPABASE_ANON_KEY as string);
