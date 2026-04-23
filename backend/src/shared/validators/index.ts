import { z } from 'zod';

// ── Pagination & common ───────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20)),
});

export const uuidParam = z.object({
  id: z.string().uuid(),
});

// ── Auth ──────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const completeProfileSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
});

export const createOrganisationSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().length(3).optional(),
});

// ── Customers ─────────────────────────────────────────────────────────────

export const customerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// ── Quotations ────────────────────────────────────────────────────────────

export const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  taxPercent: z.number().nonnegative().default(0),
  sortOrder: z.number().int().optional(),
});

export const quotationSchema = z.object({
  customerId: z.string(),
  expiryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(lineItemSchema).min(1),
});

// ── Invoices ──────────────────────────────────────────────────────────────

export const invoiceSchema = z.object({
  customerId: z.string(),
  quotationId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(lineItemSchema).min(1),
});

// ── Payments ──────────────────────────────────────────────────────────────

export const paymentSchema = z.object({
  invoiceId: z.string(),
  amountCents: z.number().int().positive(),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'MOBILE_MONEY', 'OTHER']),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().datetime(),
});
