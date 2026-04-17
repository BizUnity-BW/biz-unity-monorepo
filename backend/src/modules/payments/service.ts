import { prisma } from '../../config/prisma';
import { PaymentMethod } from '@prisma/client';

export function listPayments(organisationId: string) {
  return prisma.payment.findMany({
    where: { invoice: { organisationId } },
    orderBy: { paidAt: 'desc' },
    include: { invoice: true },
  });
}

export function createPayment(
  _organisationId: string,
  data: {
    invoiceId: string;
    amountCents: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
    paidAt: string;
  },
) {
  return prisma.payment.create({
    data: {
      invoiceId: data.invoiceId,
      amountCents: data.amountCents,
      method: data.method,
      reference: data.reference ?? null,
      notes: data.notes ?? null,
      paidAt: new Date(data.paidAt),
    },
  });
}
