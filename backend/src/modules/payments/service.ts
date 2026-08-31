import { prisma } from '../../config/prisma';
import { Prisma, PaymentMethod, InvoiceStatus, VerificationEventType } from '@prisma/client';
import { liveDocumentFilter } from '../documents/service';

/**
 * Every read of a payment must go through this, the same way document reads go through
 * `liveDocumentFilter`. A reversed payment stays in the table so its proof-of-payment
 * documents and its append-only `verificationEvents` survive, which means anything that
 * forgets this filter silently counts money that was taken back — including, worst case,
 * the funder statement.
 */
export const livePaymentFilter = {
  deletedAt: null,
} satisfies Prisma.PaymentWhereInput;

/**
 * The invoice's paid/partially-paid derivation, shared by record and reverse so the two
 * directions cannot drift apart.
 *
 * `zeroStatus` is what a fully-reversed invoice becomes. `createPayment` passes nothing
 * and so leaves the status alone at zero (recording a payment cannot zero an invoice),
 * preserving its existing behaviour exactly; `deletePayment` passes SENT.
 */
function deriveInvoiceStatus(
  current: InvoiceStatus,
  paidCents: number,
  totalCents: number,
  zeroStatus?: InvoiceStatus,
): InvoiceStatus {
  // CANCELLED is terminal — never derived out of, in either direction.
  if (current === InvoiceStatus.CANCELLED) return current;
  if (paidCents >= totalCents) return InvoiceStatus.PAID;
  if (paidCents > 0) return InvoiceStatus.PARTIALLY_PAID;
  return zeroStatus ?? current;
}

export function listPayments(organisationId: string) {
  return prisma.payment.findMany({
    where: { organisationId, ...livePaymentFilter },
    orderBy: { paidAt: 'desc' },
    include: {
      invoice: { include: { customer: true } },
      // Drives the proof-of-payment count and the attachment list in the UI.
      documents: { where: liveDocumentFilter, orderBy: { createdAt: 'asc' } },
    },
  });
}

/**
 * Record a payment against an invoice, then recompute the invoice's paidCents and status.
 * Returns null if the invoice doesn't belong to this org (tenant guard).
 *
 * The invoice's PAID/PARTIALLY_PAID logic counts every recorded payment regardless of
 * verification — "paid" means recorded, "proven paid" means verified, and only the
 * funder statement filters on the latter.
 */
export async function createPayment(
  organisationId: string,
  recordedById: string,
  actorRole: string,
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
        organisationId,
        invoiceId: data.invoiceId,
        amountCents: data.amountCents,
        method: data.method,
        reference: data.reference ?? null,
        notes: data.notes ?? null,
        paidAt: new Date(data.paidAt),
        recordedById,
      },
    });

    // Opens the audit trail for this payment. Every later transition appends here.
    await tx.verificationEvent.create({
      data: {
        event: VerificationEventType.PAYMENT_RECORDED,
        paymentId: payment.id,
        actorUserId: recordedById,
        actorRole,
      },
    });

    // Recompute paid total from all live payments so it stays correct regardless of
    // ordering, and so a previously reversed payment is not counted back in.
    const agg = await tx.payment.aggregate({
      where: { invoiceId: data.invoiceId, ...livePaymentFilter },
      _sum: { amountCents: true },
    });
    const paidCents = agg._sum.amountCents ?? 0;

    const status = deriveInvoiceStatus(invoice.status, paidCents, invoice.totalCents);

    await tx.invoice.update({
      where: { id: data.invoiceId },
      data: { paidCents, status },
    });

    return payment;
  });
}

/**
 * Reverse a payment recorded by mistake, then recompute the invoice's paid total.
 * Returns null if the payment isn't in this org, or is already reversed (tenant guard).
 *
 * Soft delete, deliberately. A hard delete would cascade away the proof-of-payment
 * `documents` — orphaning their Supabase Storage objects — and NULL the `paymentId` on
 * this payment's `verificationEvents`, mutating rows the audit trail forbids touching.
 * Reversal is a bookkeeping correction, not an erasure: the evidence stays.
 *
 * The recompute is in the same transaction as the reversal, so a mid-way failure can
 * never leave `paidCents` disagreeing with the payment rows.
 */
export async function deletePayment(id: string, organisationId: string, actorRole: string) {
  // Scoped through the invoice's org as well as the payment's own denormalised copy —
  // they cannot disagree (payments are never reparented), and requiring both means a
  // future reparenting bug fails closed rather than leaking across tenants.
  const existing = await prisma.payment.findFirst({
    where: { id, organisationId, invoice: { organisationId }, ...livePaymentFilter },
    include: { invoice: { select: { id: true, status: true, totalCents: true } } },
  });
  if (!existing) return null;

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.payment.update({ where: { id }, data: { deletedAt: new Date() } });

    // Appends rather than rewrites: the trail keeps PAYMENT_RECORDED and gains the
    // reversal, so the correction is itself auditable.
    await tx.verificationEvent.create({
      data: {
        event: VerificationEventType.PAYMENT_REVERSED,
        paymentId: id,
        actorRole,
      },
    });

    const agg = await tx.payment.aggregate({
      where: { invoiceId: existing.invoice.id, ...livePaymentFilter },
      _sum: { amountCents: true },
    });
    const paidCents = agg._sum.amountCents ?? 0;

    // Zero goes to SENT, never back to DRAFT: an invoice must have been sent to have
    // been paid, and DRAFT would re-open it to editing and deletion after the fact.
    const status = deriveInvoiceStatus(
      existing.invoice.status,
      paidCents,
      existing.invoice.totalCents,
      InvoiceStatus.SENT,
    );

    await tx.invoice.update({
      where: { id: existing.invoice.id },
      data: { paidCents, status },
    });

    return { ok: true as const };
  });
}
