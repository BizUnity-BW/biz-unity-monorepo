import { Prisma, DocumentKind, VerificationStatus, VerificationEventType } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { liveDocumentFilter } from '../../documents/service';
import { livePaymentFilter } from '../../payments/service';

export type AdminPaymentError = 'NOT_FOUND' | 'NO_PROOF_ATTACHED';

/**
 * The cross-org verification queue.
 *
 * Deliberately not scoped by organisation — that is the whole point of these routes,
 * and the reason `requireSystemAdmin` guards the parent router rather than each
 * handler. Paginated because it is unbounded by construction.
 */
export async function listPayments(filter: {
  status?: VerificationStatus;
  organisationId?: string;
  page: number;
  limit: number;
}) {
  const where: Prisma.PaymentWhereInput = {
    // A reversed payment leaves the queue: there is nothing left to verify.
    ...livePaymentFilter,
    ...(filter.status ? { verificationStatus: filter.status } : {}),
    ...(filter.organisationId ? { organisationId: filter.organisationId } : {}),
  };

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      // Oldest first: a verification queue is worked front to back.
      orderBy: { createdAt: 'asc' },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
      include: {
        organisation: { select: { id: true, name: true, slug: true, currency: true } },
        invoice: {
          select: {
            id: true,
            number: true,
            totalCents: true,
            customer: { select: { firstName: true, lastName: true, company: true } },
          },
        },
        recordedBy: { select: { firstName: true, lastName: true, email: true } },
        verifiedBy: { select: { firstName: true, lastName: true, email: true } },
        documents: {
          where: { kind: DocumentKind.PROOF_OF_PAYMENT, ...liveDocumentFilter },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
  ]);

  return { total, payments };
}

/**
 * Single-payment detail for platform staff. Deliberately *not* filtered by
 * `livePaymentFilter`: a reversed payment is exactly what an admin investigating a
 * dispute needs to be able to open, together with its documents and audit trail. It is
 * excluded from the queue and from `decide`, so it cannot be acted on — only read.
 */
export function getPayment(id: string) {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      organisation: { select: { id: true, name: true, slug: true, currency: true } },
      invoice: { include: { customer: true } },
      documents: { where: liveDocumentFilter, orderBy: { createdAt: 'asc' } },
      verificationEvents: {
        orderBy: { createdAt: 'asc' },
        include: { actor: { select: { firstName: true, lastName: true, email: true } } },
      },
    },
  });
}

/**
 * Record a platform admin's verdict on a payment.
 *
 * A payment cannot be verified without at least one live proof-of-payment document —
 * that gate is the substance of the whole feature, so it lives here rather than in a
 * controller where a future caller could bypass it.
 *
 * Note this does not touch the invoice's paidCents or status: those already reflect
 * the recorded payment and are deliberately independent of verification.
 */
export async function decide(
  id: string,
  decision: { status: 'VERIFIED' | 'REJECTED'; note?: string },
  actorId: string,
  actorRole: string,
) {
  // findFirst, not findUnique, so `livePaymentFilter` can apply: a reversed payment has
  // nothing left to verify, and verifying one would stamp VERIFIED on money that was
  // taken back. Reads as NOT_FOUND, which is what it is as far as the queue is concerned.
  const payment = await prisma.payment.findFirst({
    where: { id, ...livePaymentFilter },
    select: { id: true, verificationStatus: true },
  });
  if (!payment) return { error: 'NOT_FOUND' as const };

  if (decision.status === 'VERIFIED') {
    const proofs = await prisma.document.count({
      where: { paymentId: id, kind: DocumentKind.PROOF_OF_PAYMENT, ...liveDocumentFilter },
    });
    if (proofs === 0) return { error: 'NO_PROOF_ATTACHED' as const };
  }

  const target =
    decision.status === 'VERIFIED' ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED;

  // Already in the target state: return it rather than appending a duplicate audit
  // event, so a replayed or double-clicked request is a no-op.
  if (payment.verificationStatus === target) {
    return { payment: await getPayment(id) };
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.payment.update({
      where: { id },
      data: {
        verificationStatus: target,
        verifiedById: actorId,
        verifiedAt: new Date(),
        rejectionReason: target === VerificationStatus.REJECTED ? (decision.note ?? null) : null,
      },
    });

    await tx.verificationEvent.create({
      data: {
        event:
          target === VerificationStatus.VERIFIED
            ? VerificationEventType.PAYMENT_VERIFIED
            : VerificationEventType.PAYMENT_REJECTED,
        paymentId: id,
        actorUserId: actorId,
        actorRole,
        note: decision.note ?? null,
      },
    });
  });

  return { payment: await getPayment(id) };
}
