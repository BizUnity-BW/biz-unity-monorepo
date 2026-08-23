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
