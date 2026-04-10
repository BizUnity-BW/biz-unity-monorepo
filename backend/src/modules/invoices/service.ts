import { prisma } from '../../config/prisma';

export type LineItem = { description: string; quantity: number; unitPrice: number };

function calcTotal(lineItems: LineItem[]) {
  return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function listInvoices(orgId: string) {
  return prisma.invoice.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, include: { customer: true } });
}

export function getInvoice(id: string, orgId: string) {
  return prisma.invoice.findFirst({ where: { id, orgId }, include: { customer: true, payments: true } });
}

export function createInvoice(orgId: string, data: { customerId: string; quotationId?: string; lineItems: LineItem[]; dueDate: string; notes?: string }) {
  return prisma.invoice.create({
    data: {
      orgId,
      customerId: data.customerId,
      quotationId: data.quotationId ?? null,
      lineItems: data.lineItems,
      total: calcTotal(data.lineItems),
      dueDate: new Date(data.dueDate),
      status: 'draft',
    },
  });
}

export function updateInvoiceStatus(id: string, orgId: string, status: string) {
  return prisma.invoice.updateMany({ where: { id, orgId }, data: { status } });
}
