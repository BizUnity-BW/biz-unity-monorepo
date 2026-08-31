import { prisma } from '../../config/prisma';
import { Prisma, InvoiceStatus, QuotationStatus } from '@prisma/client';
import { liveDocumentFilter } from '../documents/service';
import { livePaymentFilter } from '../payments/service';

export type LineItem = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  taxPercent?: number;
  sortOrder?: number;
};

function calcTotals(items: LineItem[]) {
  const subtotalCents = items.reduce((sum, i) => sum + i.quantity * i.unitPriceCents, 0);
  const taxCents = items.reduce(
    (sum, i) => sum + Math.round(i.quantity * i.unitPriceCents * ((i.taxPercent ?? 0) / 100)),
    0,
  );
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}

export function listInvoices(organisationId: string) {
  return prisma.invoice.findMany({
    where: { organisationId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { customer: true, items: true },
  });
}

export function getInvoice(id: string, organisationId: string) {
  return prisma.invoice.findFirst({
    where: { id, organisationId, deletedAt: null },
    include: {
      customer: true,
      items: true,
      // Documents come along so the detail page can show each payment's proof count
      // and verification badge without a request per payment.
      payments: {
        where: livePaymentFilter,
        orderBy: { paidAt: 'desc' },
        include: { documents: { where: liveDocumentFilter, orderBy: { createdAt: 'asc' } } },
      },
    },
  });
}

export async function createInvoice(
  organisationId: string,
  data: {
    customerId: string;
    quotationId?: string;
    items: LineItem[];
    dueDate?: string;
    notes?: string;
  },
) {
  const totals = calcTotals(data.items);

  const count = await prisma.invoice.count({ where: { organisationId } });
  const number = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  return prisma.invoice.create({
    data: {
      organisationId,
      customerId: data.customerId,
      quotationId: data.quotationId ?? null,
      number,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes,
      ...totals,
      items: {
        create: data.items.map((item, idx) => ({
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          taxPercent: item.taxPercent ?? 0,
          totalCents: Math.round(item.quantity * item.unitPriceCents),
          sortOrder: item.sortOrder ?? idx,
        })),
      },
    },
    include: { items: true },
  });
}

export function updateInvoiceStatus(id: string, organisationId: string, status: InvoiceStatus) {
  return prisma.invoice.updateMany({ where: { id, organisationId }, data: { status } });
}

/**
 * Create an invoice from an existing quotation: copies its line items, links the quotation,
 * and marks the quotation CONVERTED. Returns a discriminated error for the not-found /
 * already-converted cases (a quotation maps to at most one invoice).
 */
export async function createInvoiceFromQuotation(
  organisationId: string,
  quotationId: string,
  opts?: { dueDate?: string },
) {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, organisationId, deletedAt: null },
    include: { items: true, invoice: true },
  });
  if (!quotation) return { error: 'NOT_FOUND' as const };
  if (quotation.invoice) return { error: 'ALREADY_CONVERTED' as const };

  const items: LineItem[] = [...quotation.items]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((it, idx) => ({
      description: it.description,
      quantity: Number(it.quantity),
      unitPriceCents: it.unitPriceCents,
      taxPercent: Number(it.taxPercent),
      sortOrder: idx,
    }));
  const totals = calcTotals(items);

  const count = await prisma.invoice.count({ where: { organisationId } });
  const number = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const invoice = await tx.invoice.create({
      data: {
        organisationId,
        customerId: quotation.customerId,
        quotationId: quotation.id,
        number,
        dueDate: opts?.dueDate ? new Date(opts.dueDate) : null,
        notes: quotation.notes,
        ...totals,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            taxPercent: item.taxPercent ?? 0,
            totalCents: Math.round(item.quantity * item.unitPriceCents),
            sortOrder: item.sortOrder ?? 0,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    await tx.quotation.update({
      where: { id: quotation.id },
      data: { status: QuotationStatus.CONVERTED, convertedAt: new Date() },
    });

    return invoice;
  });
}

/**
 * Edit a DRAFT invoice, replacing its line items wholesale and recalculating totals —
 * the same shape as `updateQuotation`.
 *
 * Deliberately never writes `paidCents` or `status`: those belong to the payment flow.
 * A live payment is an independent veto on top of the DRAFT check, because rewriting the
 * totals underneath a recorded payment would leave the invoice disagreeing with its own
 * payment rows.
 */
export async function updateInvoice(
  id: string,
  organisationId: string,
  data: { customerId: string; items: LineItem[]; dueDate?: string; notes?: string },
) {
  const existing = await prisma.invoice.findFirst({
    where: { id, organisationId, deletedAt: null },
    include: { payments: { where: livePaymentFilter, select: { id: true } } },
  });
  if (!existing) return { error: 'NOT_FOUND' as const };
  if (existing.status !== InvoiceStatus.DRAFT) return { error: 'NOT_DRAFT' as const };

  // Safety net: a DRAFT invoice should have no payments, but if one exists the totals
  // must not move under it. Same 409 rather than a new code — from the caller's side the
  // reason is identical, this invoice is not in an editable state.
  if (existing.payments.length > 0) return { error: 'NOT_DRAFT' as const };

  const totals = calcTotals(data.items);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
    return tx.invoice.update({
      where: { id },
      data: {
        customerId: data.customerId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes,
        ...totals,
        items: {
          create: data.items.map((item, idx) => ({
            description: item.description,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            taxPercent: item.taxPercent ?? 0,
            totalCents: Math.round(item.quantity * item.unitPriceCents),
            sortOrder: item.sortOrder ?? idx,
          })),
        },
      },
      include: { items: true, customer: true },
    });
  });
}

/**
 * Soft-delete a DRAFT invoice. OWNER only — stricter than the quotation equivalent.
 *
 * DRAFT-only is deliberate: a sent invoice is a financial document. Voiding a live one is
 * what the CANCELLED status is for, via `PATCH /:id/status`, not deletion.
 */
export async function deleteInvoice(id: string, organisationId: string) {
  const existing = await prisma.invoice.findFirst({
    where: { id, organisationId, deletedAt: null },
  });
  if (!existing) return { error: 'NOT_FOUND' as const };
  if (existing.status !== InvoiceStatus.DRAFT) return { error: 'NOT_DRAFT' as const };

  await prisma.invoice.update({ where: { id }, data: { deletedAt: new Date() } });
  return { ok: true as const };
}
