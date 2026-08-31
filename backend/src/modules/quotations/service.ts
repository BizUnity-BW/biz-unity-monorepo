import { prisma } from '../../config/prisma';
import { Prisma, QuotationStatus } from '@prisma/client';

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

export function listQuotations(organisationId: string) {
  return prisma.quotation.findMany({
    where: { organisationId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { customer: true, items: true },
  });
}

export function getQuotation(id: string, organisationId: string) {
  return prisma.quotation.findFirst({
    where: { id, organisationId, deletedAt: null },
    include: { customer: true, items: true },
  });
}

export async function createQuotation(
  organisationId: string,
  data: { customerId: string; items: LineItem[]; expiryDate?: string; notes?: string },
) {
  const totals = calcTotals(data.items);

  const count = await prisma.quotation.count({ where: { organisationId } });
  const number = `QUO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  return prisma.quotation.create({
    data: {
      organisationId,
      customerId: data.customerId,
      number,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
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

export function updateQuotationStatus(id: string, organisationId: string, status: QuotationStatus) {
  return prisma.quotation.updateMany({
    where: { id, organisationId, deletedAt: null },
    data: { status },
  });
}

export async function updateQuotation(
  id: string,
  organisationId: string,
  data: { customerId: string; items: LineItem[]; expiryDate?: string; notes?: string },
) {
  // Tenant guard: only touch a live quotation that belongs to this org.
  const existing = await prisma.quotation.findFirst({
    where: { id, organisationId, deletedAt: null },
  });
  if (!existing) return { error: 'NOT_FOUND' as const };

  // DRAFT is the only editable status, per the MVP1 spec. Everything past it has been
  // shown to the customer or acted on: rewriting a CONVERTED quotation's totals would
  // leave it disagreeing with the invoice generated from it, with no audit trail of the
  // change. The status transition is the deliberate one-way door — reverting to DRAFT is
  // a `PATCH /:id/status` call, which is itself restricted and recorded.
  if (existing.status !== QuotationStatus.DRAFT) return { error: 'NOT_DRAFT' as const };

  const totals = calcTotals(data.items);

  // Replace line items wholesale, then recalc + persist totals, in one transaction.
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.quotationItem.deleteMany({ where: { quotationId: id } });
    return tx.quotation.update({
      where: { id },
      data: {
        customerId: data.customerId,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
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
 * Soft-delete a DRAFT quotation. Never a hard `prisma.quotation.delete` — a CONVERTED
 * quotation is referenced by its invoice, and hard deletion would orphan it.
 *
 * DRAFT-only for the same reason `updateQuotation` is: past DRAFT the customer has seen
 * it. There is no un-delete endpoint; the row simply stops being returned.
 */
export async function deleteQuotation(id: string, organisationId: string) {
  const existing = await prisma.quotation.findFirst({
    where: { id, organisationId, deletedAt: null },
  });
  if (!existing) return { error: 'NOT_FOUND' as const };
  if (existing.status !== QuotationStatus.DRAFT) return { error: 'NOT_DRAFT' as const };

  await prisma.quotation.update({ where: { id }, data: { deletedAt: new Date() } });
  return { ok: true as const };
}
