import { Response } from 'express';
import { ApiResponse } from '../types';

export function ok<T>(res: Response, data: T, status = 200): void {
  const body: ApiResponse<T> = { success: true, data };
  res.status(status).json(body);
}

export function fail(res: Response, message: string, status = 400, details?: unknown): void {
  const body: ApiResponse = { success: false, error: message, details };
  res.status(status).json(body);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
