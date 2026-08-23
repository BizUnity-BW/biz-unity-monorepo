import { DocumentKind, VerificationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { liveDocumentFilter } from '../documents/service';

export interface StatementQuery {
  customerId?: string;
  /** YYYY-MM-DD, inclusive at both ends. */
  from: string;
  to: string;
}

export interface StatementRow {
  paymentId: string;
  paidAt: Date;
  invoiceNumber: string;
  customerName: string;
  method: string;
  reference: string | null;
  amountCents: number;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  proofCount: number;
}

export interface Statement {
  organisation: { name: string; currency: string };
  customer: { id: string; name: string } | null;
  from: string;
  to: string;
  rows: StatementRow[];
  totalCents: number;
  generatedAt: Date;
}

function displayName(person: {
  firstName: string | null;
  lastName: string | null;
  email?: string;
}): string {
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return name || person.email || '—';
}

/**
 * The funder-facing statement: only VERIFIED payments, with the verifier and date
 * that make each line defensible.
 *
 * This is the one query in the app that filters on `verificationStatus`. Everywhere
 * else — including the invoice's own PAID status — counts recorded payments, which is
 * the distinction the whole feature rests on: "paid" is recorded, "proven paid" is
 * verified.
 */
export async function getStatement(
  organisationId: string,
  query: StatementQuery,
): Promise<Statement | null> {
  const organisation = await prisma.organisation.findFirst({
    where: { id: organisationId, deletedAt: null },
    select: { name: true, currency: true },
  });
  if (!organisation) return null;

  const customer = query.customerId
    ? await prisma.customer.findFirst({
        where: { id: query.customerId, organisationId },
        select: { id: true, firstName: true, lastName: true, company: true },
      })
    : null;

  // A customerId that isn't ours must not silently widen the statement to every
  // customer, which is what dropping the filter would do.
  if (query.customerId && !customer) return null;

  // Inclusive of the whole `to` day: the client sends dates, not instants.
  const from = new Date(`${query.from}T00:00:00.000Z`);
  const to = new Date(`${query.to}T23:59:59.999Z`);

  const payments = await prisma.payment.findMany({
    where: {
      organisationId,
      verificationStatus: VerificationStatus.VERIFIED,
      paidAt: { gte: from, lte: to },
      ...(query.customerId ? { invoice: { customerId: query.customerId } } : {}),
    },
    orderBy: { paidAt: 'asc' },
    include: {
      invoice: {
        select: {
          number: true,
          customer: { select: { firstName: true, lastName: true, company: true } },
        },
      },
      verifiedBy: { select: { firstName: true, lastName: true, email: true } },
      _count: {
        select: {
          documents: { where: { kind: DocumentKind.PROOF_OF_PAYMENT, ...liveDocumentFilter } },
        },
      },
    },
  });

  const rows: StatementRow[] = payments.map((payment) => ({
    paymentId: payment.id,
    paidAt: payment.paidAt,
    invoiceNumber: payment.invoice.number,
    customerName: payment.invoice.customer.company || displayName(payment.invoice.customer),
    method: payment.method,
    reference: payment.reference,
    amountCents: payment.amountCents,
    verifiedAt: payment.verifiedAt,
    verifiedBy: payment.verifiedBy ? displayName(payment.verifiedBy) : null,
    proofCount: payment._count.documents,
  }));

  return {
    organisation,
    customer: customer
      ? { id: customer.id, name: customer.company || displayName(customer) }
      : null,
    from: query.from,
    to: query.to,
    rows,
    totalCents: rows.reduce((sum, row) => sum + row.amountCents, 0),
    generatedAt: new Date(),
  };
}
