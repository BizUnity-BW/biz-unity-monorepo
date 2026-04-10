import { prisma } from '../../config/prisma';

export function listPayments(orgId: string) {
  return prisma.payment.findMany({ where: { orgId }, orderBy: { paidAt: 'desc' }, include: { invoice: true } });
}

export function createPayment(orgId: string, data: { invoiceId: string; amount: number; method: string; reference?: string; paidAt?: string }) {
  return prisma.payment.create({
    data: {
      orgId,
      invoiceId: data.invoiceId,
      amount: data.amount,
      method: data.method,
      reference: data.reference ?? null,
      paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
    },
  });
}
