import { prisma } from '../../config/prisma';
import { QuotationStatus } from '@prisma/client';

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
    where: { organisationId },
    orderBy: { createdAt: 'desc' },
    include: { customer: true, items: true },
  });
}

export function getQuotation(id: string, organisationId: string) {
  return prisma.quotation.findFirst({
    where: { id, organisationId },
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
  return prisma.quotation.updateMany({ where: { id, organisationId }, data: { status } });
}
