import { Prisma, DocumentReviewStatus, VerificationEventType } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { supabaseAdmin } from '../../../config/supabase';
import { env } from '../../../config/env';
import { liveDocumentFilter } from '../../documents/service';

export type AdminDocumentError = 'NOT_FOUND' | 'STORAGE_FAILED';

/** Cross-org compliance review queue. Not scoped by organisation, by design. */
export async function listDocuments(filter: {
  reviewStatus?: DocumentReviewStatus;
  organisationId?: string;
  page: number;
  limit: number;
}) {
  const where: Prisma.DocumentWhereInput = {
    ...liveDocumentFilter,
    ...(filter.reviewStatus ? { reviewStatus: filter.reviewStatus } : {}),
    ...(filter.organisationId ? { organisationId: filter.organisationId } : {}),
  };

  const [total, documents] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
      include: {
        organisation: { select: { id: true, name: true, slug: true } },
        uploadedBy: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  return { total, documents };
}

/**
 * Mint a download URL for any document, regardless of organisation.
 *
 * This is the one place a document leaves its tenant boundary, and it is why the
 * admin services live in their own directory: the missing `organisationId` filter is
 * intentional here and a bug everywhere else.
 */
export async function createDownloadUrl(id: string) {
  const document = await prisma.document.findFirst({ where: { id, ...liveDocumentFilter } });
  if (!document) return { error: 'NOT_FOUND' as const };

  const { data, error } = await supabaseAdmin.storage
    .from(document.bucket)
    .createSignedUrl(document.storagePath, env.SIGNED_URL_TTL_SECONDS, {
      download: document.fileName,
    });

  if (error || !data) return { error: 'STORAGE_FAILED' as const };
  return {
    url: data.signedUrl,
    expiresIn: env.SIGNED_URL_TTL_SECONDS,
    fileName: document.fileName,
  };
}

/** Record a compliance verdict on a KYC document. */
export async function review(
  id: string,
  decision: { status: 'VERIFIED' | 'REJECTED'; note?: string },
  actorId: string,
  actorRole: string,
) {
  const document = await prisma.document.findFirst({
    where: { id, ...liveDocumentFilter },
    select: { id: true, reviewStatus: true },
  });
  if (!document) return { error: 'NOT_FOUND' as const };

  const target =
    decision.status === 'VERIFIED' ? DocumentReviewStatus.VERIFIED : DocumentReviewStatus.REJECTED;

  if (document.reviewStatus === target) {
    return { document: await prisma.document.findUnique({ where: { id } }) };
  }

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const next = await tx.document.update({
      where: { id },
      data: {
        reviewStatus: target,
        reviewedById: actorId,
        reviewedAt: new Date(),
        rejectionReason: target === DocumentReviewStatus.REJECTED ? (decision.note ?? null) : null,
      },
    });

    await tx.verificationEvent.create({
      data: {
        event:
          target === DocumentReviewStatus.VERIFIED
            ? VerificationEventType.DOCUMENT_VERIFIED
            : VerificationEventType.DOCUMENT_REJECTED,
        documentId: id,
        actorUserId: actorId,
        actorRole,
        note: decision.note ?? null,
      },
    });

    return next;
  });

  return { document: updated };
}
