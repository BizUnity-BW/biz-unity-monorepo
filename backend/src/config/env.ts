import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform(Number),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Storage. The documents bucket is private with no storage policies, so only
  // the service-role key can reach it; the public bucket holds logos and avatars,
  // which render in <img> on every page and cannot afford a signed-URL round trip.
  SUPABASE_BUCKET_DOCUMENTS: z.string().min(1).default('bizunity-documents'),
  SUPABASE_BUCKET_PUBLIC: z.string().min(1).default('bizunity-public'),
  // Download URLs are minted per click and never cached, so a leaked one dies fast.
  SIGNED_URL_TTL_SECONDS: z.string().default('300').transform(Number),

  // Read by app.ts for the CORS origin. Was previously only in .env.example, so a
  // typo failed open to localhost instead of failing loudly at startup.
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  FLAGSMITH_ENVIRONMENT_KEY: z.string().optional(),
  RATE_LIMIT_ENABLED: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  // A fresh clone has no backend/.env at all, so this is the first thing it hits.
  // Without the hint the exit reads as a code fault rather than missing setup.
  console.error(
    '\nIf this is a fresh clone, create the env files first:\n' +
      '  ./scripts/dev-setup.sh   (from the repo root)\n' +
      'then fill in the values listed above. See README → Environment variables.\n',
  );
  process.exit(1);
}

export const env = parsed.data;
