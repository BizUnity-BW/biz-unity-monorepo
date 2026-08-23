import { z } from 'zod';

// ── Pagination & common ───────────────────────────────────────────────────

// Query params are strings from an untrusted caller, and these values go straight
// into Prisma's `skip`/`take`. A bare parseInt let `?page=abc` through as NaN
// (skip: NaN throws), `?page=-3` as a negative skip, and `?limit=99999` as an
// unbounded page size — which matters most on the cross-tenant admin lists, where
// the whole point of paginating is that the result set is unbounded. Clamp rather
// than reject: these are conveniences, and a 422 on a stray query string would be
// less useful than falling back to the first page.
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

function toBoundedInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = raw === undefined ? fallback : Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => toBoundedInt(v, 1, 1, Number.MAX_SAFE_INTEGER)),
  limit: z
    .string()
    .optional()
    .transform((v) => toBoundedInt(v, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE)),
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
  // Appears on the funder statement letterhead, so it has to be settable.
  vatNumber: z.string().max(50).optional(),
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

// ── Documents ─────────────────────────────────────────────────────────────

export const documentKindSchema = z.enum([
  'PROOF_OF_PAYMENT',
  'COMPANY_REGISTRATION',
  'TAX_CLEARANCE',
  'TRADE_LICENCE',
  'VAT_CERTIFICATE',
  'BANK_CONFIRMATION',
  'DIRECTOR_ID',
  'PROOF_OF_ADDRESS',
  'ORGANISATION_LOGO',
  'USER_AVATAR',
  'OTHER',
]);

// Size and mime are re-derived from storage metadata on confirm, so these bounds
// only stop obvious nonsense before a signed URL is handed out.
export const uploadSlotSchema = z.object({
  kind: documentKindSchema,
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive(),
  paymentId: z.string().optional(),
  userProfileId: z.string().optional(),
});

export const documentListQuerySchema = z.object({
  kind: documentKindSchema.optional(),
  paymentId: z.string().optional(),
});

// `.nullable()` so a client can clear a date it set by mistake; the service
// distinguishes "absent" (leave alone) from "null" (clear).
export const documentMetadataSchema = z.object({
  documentNumber: z.string().max(100).nullable().optional(),
  issuedAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

// ── Verification (platform admin) ─────────────────────────────────────────

export const verifyDecisionSchema = z
  .object({
    status: z.enum(['VERIFIED', 'REJECTED']),
    note: z.string().max(1000).optional(),
  })
  .refine((value) => value.status !== 'REJECTED' || (value.note && value.note.trim().length > 0), {
    // A rejection the org cannot act on is worse than no rejection at all.
    message: 'A note is required when rejecting',
    path: ['note'],
  });

export const verificationQueueSchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
  organisationId: z.string().optional(),
});

// ── Verified-payments statement ───────────────────────────────────────────

export const statementQuerySchema = z
  .object({
    customerId: z.string().optional(),
    // Date-only, because a funder statement covers whole days in local terms.
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
    format: z.enum(['json', 'csv']).default('json'),
  })
  .refine((value) => value.from <= value.to, {
    message: '`from` must not be after `to`',
    path: ['from'],
  });
