import { prisma } from '../../config/prisma';
import { Prisma, PaymentMethod, InvoiceStatus } from '@prisma/client';

export function listPayments(organisationId: string) {
  return prisma.payment.findMany({
    where: { invoice: { organisationId } },
    orderBy: { paidAt: 'desc' },
    include: { invoice: { include: { customer: true } } },
  });
}

/**
 * Record a payment against an invoice, then recompute the invoice's paidCents and status.
 * Returns null if the invoice doesn't belong to this org (tenant guard).
 */
export async function createPayment(
  organisationId: string,
  data: {
    invoiceId: string;
    amountCents: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
    paidAt: string;
  },
) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: data.invoiceId, organisationId, deletedAt: null },
  });
  if (!invoice) return null;

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const payment = await tx.payment.create({
      data: {
        invoiceId: data.invoiceId,
        amountCents: data.amountCents,
        method: data.method,
        reference: data.reference ?? null,
        notes: data.notes ?? null,
        paidAt: new Date(data.paidAt),
      },
    });

    // Recompute paid total from all payments so it stays correct regardless of ordering.
    const agg = await tx.payment.aggregate({
      where: { invoiceId: data.invoiceId },
      _sum: { amountCents: true },
    });
    const paidCents = agg._sum.amountCents ?? 0;

    // Don't override terminal states (CANCELLED); otherwise derive from paid vs total.
    let status: InvoiceStatus = invoice.status;
    if (invoice.status !== InvoiceStatus.CANCELLED) {
      if (paidCents >= invoice.totalCents) status = InvoiceStatus.PAID;
      else if (paidCents > 0) status = InvoiceStatus.PARTIALLY_PAID;
    }

    await tx.invoice.update({
      where: { id: data.invoiceId },
      data: { paidCents, status },
    });

    return payment;
  });
}
