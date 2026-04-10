import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../config/supabase';
import { ok, fail } from '../../shared/utils';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }

  const { email, password } = parsed.data;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    fail(res, error.message, 400);
    return;
  }

  ok(res, { userId: data.user.id }, 201);
}

export async function login(_req: Request, res: Response): Promise<void> {
  // Login is handled client-side via Supabase JS SDK.
  // This endpoint is a placeholder for any server-side login logic.
  fail(res, 'Use the Supabase client SDK to sign in', 400);
}
