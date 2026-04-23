import { prisma } from '../../config/prisma';
import { InvoiceStatus } from '@prisma/client';

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
    include: { customer: true, items: true, payments: true },
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
