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

export const authLimiter = env.RATE_LIMIT_ENABLED
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many requests, please try again later.' },
    })
  : bypass;
