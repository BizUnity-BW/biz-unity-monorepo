import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform(v => (v ? parseInt(v, 10) : 20)),
});

export const uuidParam = z.object({
  id: z.string().uuid(),
});

export const organisationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
});

export const customerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

export const quotationSchema = z.object({
  customerId: z.string().uuid(),
  lineItems: z.array(lineItemSchema).min(1),
  validUntil: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const invoiceSchema = z.object({
  customerId: z.string().uuid(),
  quotationId: z.string().uuid().optional(),
  lineItems: z.array(lineItemSchema).min(1),
  dueDate: z.string().datetime(),
  notes: z.string().optional(),
});

export const paymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['cash', 'card', 'eft', 'other']),
  reference: z.string().optional(),
  paidAt: z.string().datetime().optional(),
});