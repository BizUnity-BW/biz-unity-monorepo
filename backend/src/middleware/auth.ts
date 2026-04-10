import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../shared/types';
import { fail } from '../shared/utils';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    fail(res, 'Missing or malformed Authorization header', 401);
    return;
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    fail(res, 'Invalid or expired token', 401);
    return;
  }

  (req as AuthenticatedRequest).user = {
    id: data.user.id,
    email: data.user.email ?? '',
    role: (data.user.app_metadata?.role as string) ?? 'member',
  };

  next();
}