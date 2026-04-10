import { prisma } from '../../config/prisma';

export type LineItem = { description: string; quantity: number; unitPrice: number };

function calcTotal(lineItems: LineItem[]) {
  return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function listQuotations(orgId: string) {
  return prisma.quotation.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    include: { customer: true },
  });
}

export function getQuotation(id: string, orgId: string) {
  return prisma.quotation.findFirst({ where: { id, orgId }, include: { customer: true } });
}

export function createQuotation(
  orgId: string,
  data: { customerId: string; lineItems: LineItem[]; validUntil?: string; notes?: string },
) {
  return prisma.quotation.create({
    data: {
      orgId,
      customerId: data.customerId,
      lineItems: data.lineItems,
      total: calcTotal(data.lineItems),
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      status: 'draft',
    },
  });
}

export function updateQuotationStatus(id: string, orgId: string, status: string) {
  return prisma.quotation.updateMany({ where: { id, orgId }, data: { status } });
}
