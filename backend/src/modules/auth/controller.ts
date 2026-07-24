import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { prisma } from '../../config/prisma';
import { supabaseAdmin } from '../../config/supabase';
import { ok, fail, slugify } from '../../shared/utils';
import { AuthenticatedRequest } from '../../shared/types';
import {
  registerSchema,
  completeProfileSchema,
  createOrganisationSchema,
} from '../../shared/validators';

// POST /api/v1/auth/register — public
export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }

  const { email, password } = parsed.data;

  // DEV: auto-confirm the email in non-production so no confirmation email is required.
  // Production still requires real email confirmation (needs SMTP + templates configured).
  // TODO: enable proper email confirmation before production — see ClickUp task.
  const autoConfirm = env.NODE_ENV !== 'production';

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: autoConfirm,
  });

  if (error) {
    fail(res, error.message, 400);
    return;
  }

  await prisma.userProfile.create({
    data: {
      supabaseId: data.user.id,
      email,
    },
  });

  ok(
    res,
    {
      message: autoConfirm
        ? 'Account created. You can sign in now.'
        : 'Check your email to confirm your account',
    },
    201,
  );
}

// POST /api/v1/auth/profile — requires auth
export async function completeProfile(req: Request, res: Response): Promise<void> {
  const parsed = completeProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }

  const { user } = req as AuthenticatedRequest;

  const profile = await prisma.userProfile.findUnique({
    where: { supabaseId: user.id },
  });

  if (!profile) {
    fail(res, 'Profile not found', 404);
    return;
  }

  const updated = await prisma.userProfile.update({
    where: { supabaseId: user.id },
    data: parsed.data,
  });

  ok(res, updated);
}

// POST /api/v1/auth/organisation — requires auth
export async function createOrganisation(req: Request, res: Response): Promise<void> {
  const parsed = createOrganisationSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }

  const { user } = req as AuthenticatedRequest;

  const profile = await prisma.userProfile.findUnique({
    where: { supabaseId: user.id },
  });

  if (!profile) {
    fail(res, 'Profile not found', 404);
    return;
  }

  if (profile.organisationId) {
    fail(res, 'Organisation already set up', 409);
    return;
  }

  const { name, email, phone, address, currency } = parsed.data;
  let slug = slugify(name);

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Handle slug collisions
    const existing = await tx.organisation.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const org = await tx.organisation.create({
      data: { name, slug, email, phone, address, currency: currency ?? 'ZAR' },
    });

    const updatedProfile = await tx.userProfile.update({
      where: { supabaseId: user.id },
      data: { organisationId: org.id, orgRole: 'OWNER' },
    });

    return { org, profile: updatedProfile };
  });

  ok(res, { organisation: result.org, profile: result.profile }, 201);
}

// GET /api/v1/auth/me — requires auth
export async function getMe(req: Request, res: Response): Promise<void> {
  const { user } = req as AuthenticatedRequest;

  const profile = await prisma.userProfile.findUnique({
    where: { supabaseId: user.id },
    include: { organisation: true },
  });

  if (!profile) {
    fail(res, 'Profile not found', 404);
    return;
  }

  const { organisation, ...profileData } = profile;

  ok(res, { profile: profileData, organisation: organisation ?? null });
}
