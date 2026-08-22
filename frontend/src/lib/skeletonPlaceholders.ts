import type { Customer, Invoice, LineItem, Quotation } from '../types';

/**
 * Stand-in objects rendered while a page is loading.
 *
 * `SkeletonShimmer` measures the *real* rendered boxes, so the shimmer blocks end up
 * the size of whatever these values render to. The strings are therefore chosen for
 * plausible length rather than realism — they are never visible.
 */

const ISO = '2026-01-01T00:00:00.000Z';

export const PLACEHOLDER_CUSTOMER: Customer = {
  id: 'skeleton-customer',
  organisationId: 'skeleton-org',
  firstName: 'Kefilwe',
  lastName: 'Moremi',
  email: 'kefilwe.moremi@example.co.bw',
  phone: '+267 71 234 567',
  company: 'Kalahari Trading (Pty) Ltd',
  address: 'Plot 1234, Extension 12, Gaborone',
  notes: null,
  createdAt: ISO,
  updatedAt: ISO,
  deletedAt: null,
};

function placeholderItem(id: string, description: string): LineItem {
  return {
    id,
    description,
    quantity: 1,
    unitPriceCents: 250000,
    taxPercent: 14,
    totalCents: 250000,
    sortOrder: 0,
  };
}

export const PLACEHOLDER_INVOICE: Invoice = {
  id: 'skeleton-invoice',
  organisationId: 'skeleton-org',
  customerId: 'skeleton-customer',
  quotationId: null,
  number: 'INV-2026-0000',
  status: 'SENT',
  issueDate: ISO,
  dueDate: ISO,
  notes: null,
  subtotalCents: 750000,
  taxCents: 105000,
  totalCents: 855000,
  paidCents: 0,
  createdAt: ISO,
  updatedAt: ISO,
  deletedAt: null,
  customer: PLACEHOLDER_CUSTOMER,
  items: [
    placeholderItem('skeleton-item-1', 'Consulting services rendered'),
    placeholderItem('skeleton-item-2', 'Implementation and setup'),
    placeholderItem('skeleton-item-3', 'Support retainer'),
  ],
  // Rendered as the "no payments recorded yet" empty state, which is a small,
  // stable box to shimmer over.
  payments: [],
};

export const PLACEHOLDER_QUOTATIONS: Quotation[] = Array.from({ length: 4 }, (_, i) => ({
  id: `skeleton-quotation-${i}`,
  organisationId: 'skeleton-org',
  customerId: 'skeleton-customer',
  number: 'QUO-2026-0000',
  status: 'DRAFT' as const,
  issueDate: ISO,
  expiryDate: null,
  notes: null,
  subtotalCents: 500000,
  taxCents: 70000,
  totalCents: 570000,
  convertedAt: null,
  createdAt: ISO,
  updatedAt: ISO,
  customer: PLACEHOLDER_CUSTOMER,
  items: [],
}));
