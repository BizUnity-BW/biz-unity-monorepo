import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types';

interface OkOptions {
  status?: number;
  meta?: PaginationMeta;
}

// The third argument stays backwards-compatible: `ok(res, data)` and `ok(res, data, 201)` behave
// exactly as before, while `ok(res, data, { meta })` adds the pagination envelope. `meta` is left
// off the body entirely when absent, so unpaginated responses serialise byte-identically to before.
export function ok<T>(res: Response, data: T, statusOrOptions: number | OkOptions = 200): void {
  const options: OkOptions =
    typeof statusOrOptions === 'number' ? { status: statusOrOptions } : statusOrOptions;
  const { status = 200, meta } = options;

  const body: ApiResponse<T> = { success: true, data, ...(meta ? { meta } : {}) };
  res.status(status).json(body);
}

// Builds the meta block for a paginated list. `limit` is clamped to at least 1 so a `?limit=0`
// query can never divide by zero and report Infinity pages.
export function paginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const effectiveLimit = limit > 0 ? Math.floor(limit) : 1;
  return { total, page, pages: Math.ceil(total / effectiveLimit), limit: effectiveLimit };
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
