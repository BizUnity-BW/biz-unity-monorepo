import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

const bypass = (_req: Request, _res: Response, next: NextFunction) => next();

export const defaultLimiter = env.RATE_LIMIT_ENABLED
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
    })
  : bypass;

// Minting a signed upload URL is cheap for us but grants a write into storage, so
// it gets a tighter budget than the app-wide 200. Generous enough for a user
// uploading a whole compliance pack in one sitting.
export const uploadLimiter = env.RATE_LIMIT_ENABLED
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many uploads, please try again later.' },
    })
  : bypass;

export const authLimiter = env.RATE_LIMIT_ENABLED
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many requests, please try again later.' },
    })
  : bypass;
