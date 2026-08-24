import { prisma } from '../../config/prisma';
import { Prisma, InvoiceStatus, QuotationStatus } from '@prisma/client';
import { liveDocumentFilter } from '../documents/service';

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
    where: { id: quotationId, organisationId },
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
