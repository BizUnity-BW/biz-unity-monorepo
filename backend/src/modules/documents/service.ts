import {
  Prisma,
  DocumentKind,
  DocumentReviewStatus,
  DocumentUploadStatus,
  VerificationStatus,
  VerificationEventType,
} from '@prisma/client';
import { prisma } from '../../config/prisma';
import { supabaseAdmin } from '../../config/supabase';
import { env } from '../../config/env';
import {
  KIND_RULES,
  bucketFor,
  buildStoragePath,
  isPublicKind,
  newPathToken,
  splitStoragePath,
} from '../../shared/utils/storage';

/**
 * The only documents a client may ever see: bytes confirmed, not deleted.
 *
 * PENDING_UPLOAD rows exist between minting a signed upload URL and confirming the
 * upload, so a browser that dies mid-flow leaves one behind. Filtering here means an
 * abandoned upload is invisible rather than a ghost row with no file behind it.
 */
export const liveDocumentFilter = {
  uploadStatus: DocumentUploadStatus.READY,
  deletedAt: null,
} satisfies Prisma.DocumentWhereInput;

export interface UploadSlotInput {
  kind: DocumentKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  paymentId?: string;
  userProfileId?: string;
}

export type DocumentError =
  | 'NOT_FOUND'
  | 'UNSUPPORTED_TYPE'
  | 'FILE_TOO_LARGE'
  | 'PAYMENT_NOT_FOUND'
  | 'PAYMENT_REQUIRED'
  | 'PROFILE_NOT_FOUND'
  | 'UPLOAD_NOT_FOUND'
  | 'STORAGE_FAILED';

const err = (error: DocumentError) => ({ error }) as const;

// ── Reads ──────────────────────────────────────────────────────────────────

export function listDocuments(
  organisationId: string,
  filter: { kind?: DocumentKind; paymentId?: string },
) {
  return prisma.document.findMany({
    where: {
      organisationId,
      ...liveDocumentFilter,
      ...(filter.kind ? { kind: filter.kind } : {}),
      ...(filter.paymentId ? { paymentId: filter.paymentId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { uploadedBy: { select: { firstName: true, lastName: true, email: true } } },
  });
}

export function getDocument(id: string, organisationId: string) {
  return prisma.document.findFirst({ where: { id, organisationId, ...liveDocumentFilter } });
}

// ── Leg 1: mint an upload slot ─────────────────────────────────────────────

/**
 * Validate the request, create the row as PENDING_UPLOAD, and mint a signed upload
 * URL the browser can PUT straight to.
 *
 * The row has to exist first so its id can go into the storage path, which is what
 * makes every path unique. Nothing is visible to any read until `confirmUpload`.
 */
export async function createUploadSlot(
  organisationId: string,
  uploadedById: string,
  input: UploadSlotInput,
) {
  const rule = KIND_RULES[input.kind];

  if (!rule.mimeTypes.includes(input.mimeType)) return err('UNSUPPORTED_TYPE');
  if (input.sizeBytes > rule.maxBytes) return err('FILE_TOO_LARGE');

  // A proof of payment is meaningless without its payment, and the payment must
  // belong to this org — otherwise a caller could staple evidence to someone else's.
  if (input.kind === DocumentKind.PROOF_OF_PAYMENT) {
    if (!input.paymentId) return err('PAYMENT_REQUIRED');
    const payment = await prisma.payment.findFirst({
      where: { id: input.paymentId, organisationId },
      select: { id: true },
    });
    if (!payment) return err('PAYMENT_NOT_FOUND');
  }

  // An avatar belongs to a profile in this org, not to any profile.
  if (input.kind === DocumentKind.USER_AVATAR && input.userProfileId) {
    const profile = await prisma.userProfile.findFirst({
      where: { id: input.userProfileId, organisationId },
      select: { id: true },
    });
    if (!profile) return err('PROFILE_NOT_FOUND');
  }

  const bucket = bucketFor(input.kind);
  const storagePath = buildStoragePath({
    organisationId,
    kind: input.kind,
    token: newPathToken(),
    fileName: input.fileName,
    paymentId: input.paymentId,
    userProfileId: input.userProfileId,
  });

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUploadUrl(storagePath);

  if (error || !data) return err('STORAGE_FAILED');

  const document = await prisma.document.create({
    data: {
      kind: input.kind,
      bucket,
      storagePath,
      fileName: input.fileName,
      mimeType: input.mimeType,
      // Provisional: replaced with the real size read back from storage on confirm.
      sizeBytes: input.sizeBytes,
      uploadStatus: DocumentUploadStatus.PENDING_UPLOAD,
      organisationId,
      uploadedById,
      paymentId: input.paymentId ?? null,
      userProfileId: input.userProfileId ?? null,
    },
  });

  return {
    documentId: document.id,
    bucket,
    path: storagePath,
    token: data.token,
    // Lets the browser PUT over XHR, which is the only way to get upload progress
    // and cancellation — `uploadToSignedUrl` exposes neither.
    signedUrl: data.signedUrl,
  };
}

// ── Leg 3: confirm the bytes landed ────────────────────────────────────────

/**
 * Verify the object really exists, then publish the document.
 *
 * Idempotent by design: confirming an already-READY document returns it unchanged.
 * A confirm that succeeds server-side but fails in transit would otherwise dead-end
 * the client's retry.
 *
 * Size and mime are taken from the storage metadata, never from the client — leg 1's
 * numbers were only ever a claim.
 */
export async function confirmUpload(id: string, organisationId: string, actorRole: string) {
  const document = await prisma.document.findFirst({
    where: { id, organisationId, deletedAt: null },
  });
  if (!document) return err('NOT_FOUND');
  if (document.uploadStatus === DocumentUploadStatus.READY) return { document };

  const { dir, name } = splitStoragePath(document.storagePath);
  const { data, error } = await supabaseAdmin.storage
    .from(document.bucket)
    .list(dir, { search: name, limit: 1 });

  if (error) return err('STORAGE_FAILED');

  const object = data?.find((entry) => entry.name === name);
  if (!object) return err('UPLOAD_NOT_FOUND');

  const rule = KIND_RULES[document.kind];
  const sizeBytes = object.metadata?.size ?? document.sizeBytes;
  const mimeType = object.metadata?.mimetype ?? document.mimeType;

  const publicUrl = isPublicKind(document.kind)
    ? supabaseAdmin.storage.from(document.bucket).getPublicUrl(document.storagePath).data.publicUrl
    : null;

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const ready = await tx.document.update({
      where: { id: document.id },
      data: {
        uploadStatus: DocumentUploadStatus.READY,
        reviewStatus: rule.reviewOnReady,
        sizeBytes,
        mimeType,
      },
    });

    await tx.verificationEvent.create({
      data: {
        event: VerificationEventType.DOCUMENT_UPLOADED,
        documentId: ready.id,
        paymentId: ready.paymentId,
        actorUserId: ready.uploadedById,
        actorRole,
      },
    });

    if (rule.singleton) {
      await supersedePrevious(tx, ready, rule.retainSuperseded, actorRole);
    }

    // Logos and avatars are surfaced through the columns the app already reads,
    // so the shell picks up a new image without a second endpoint.
    if (ready.kind === DocumentKind.ORGANISATION_LOGO && publicUrl) {
      await tx.organisation.update({
        where: { id: organisationId },
        data: { logoUrl: publicUrl },
      });
    }
    if (ready.kind === DocumentKind.USER_AVATAR && publicUrl && ready.userProfileId) {
      await tx.userProfile.update({
        where: { id: ready.userProfileId },
        data: { avatarUrl: publicUrl },
      });
    }

    // A fresh proof of payment on a rejected payment puts it back in the queue.
    // This transition has to live here: no tenant-facing endpoint may set a
    // verification status directly.
    if (ready.kind === DocumentKind.PROOF_OF_PAYMENT && ready.paymentId) {
      const payment = await tx.payment.findUnique({
        where: { id: ready.paymentId },
        select: { verificationStatus: true },
      });

      if (payment?.verificationStatus === VerificationStatus.REJECTED) {
        await tx.payment.update({
          where: { id: ready.paymentId },
          data: {
            verificationStatus: VerificationStatus.PENDING,
            rejectionReason: null,
            verifiedAt: null,
            verifiedById: null,
          },
        });
      }

      await tx.verificationEvent.create({
        data: {
          event: VerificationEventType.POP_ADDED,
          paymentId: ready.paymentId,
          documentId: ready.id,
          actorUserId: ready.uploadedById,
          actorRole,
        },
      });
    }

    return { document: ready };
  });
}

/**
 * Retire the document this one replaces.
 *
 * Compliance documents keep their stored object — a funder may need to see the
 * certificate that was current at the time — while a replaced logo or avatar is
 * removed outright, because nobody audits those.
 */
async function supersedePrevious(
  tx: Prisma.TransactionClient,
  current: { id: string; kind: DocumentKind; organisationId: string; userProfileId: string | null },
  retainObject: boolean,
  actorRole: string,
): Promise<void> {
  const previous = await tx.document.findMany({
    where: {
      organisationId: current.organisationId,
      kind: current.kind,
      id: { not: current.id },
      // An avatar supersedes only that user's, not the whole org's.
      ...(current.kind === DocumentKind.USER_AVATAR
        ? { userProfileId: current.userProfileId }
        : {}),
      ...liveDocumentFilter,
    },
    select: { id: true, bucket: true, storagePath: true },
  });

  if (previous.length === 0) return;

  await tx.document.updateMany({
    where: { id: { in: previous.map((doc) => doc.id) } },
    data: { deletedAt: new Date() },
  });

  await tx.verificationEvent.createMany({
    data: previous.map((doc) => ({
      event: VerificationEventType.DOCUMENT_REMOVED,
      documentId: doc.id,
      actorRole,
      note: 'Superseded by a newer upload',
    })),
  });

  if (!retainObject) {
    // Best-effort: the row is already retired, and an orphaned object is a storage
    // cost rather than a correctness problem. Failing the transaction over it would
    // lose the user's new upload.
    for (const doc of previous) {
      const { error } = await supabaseAdmin.storage.from(doc.bucket).remove([doc.storagePath]);
      if (error) console.error(`Failed to remove superseded object ${doc.storagePath}:`, error);
    }
  }
}

// ── Download, update, delete ───────────────────────────────────────────────

/**
 * Mint a short-lived download URL.
 *
 * Minted per click and never cached, so a URL that leaks into a log or a referrer
 * header is dead within minutes. `download` sets Content-Disposition so the browser
 * saves the file under its original name instead of rendering it inline.
 */
export async function createDownloadUrl(id: string, organisationId: string) {
  const document = await getDocument(id, organisationId);
  if (!document) return err('NOT_FOUND');

  const { data, error } = await supabaseAdmin.storage
    .from(document.bucket)
    .createSignedUrl(document.storagePath, env.SIGNED_URL_TTL_SECONDS, {
      download: document.fileName,
    });

  if (error || !data) return err('STORAGE_FAILED');

  return {
    url: data.signedUrl,
    expiresIn: env.SIGNED_URL_TTL_SECONDS,
    fileName: document.fileName,
  };
}

export async function updateDocument(
  id: string,
  organisationId: string,
  data: { documentNumber?: string | null; issuedAt?: string | null; expiresAt?: string | null },
) {
  const document = await getDocument(id, organisationId);
  if (!document) return err('NOT_FOUND');

  const updated = await prisma.document.update({
    where: { id: document.id },
    data: {
      ...(data.documentNumber !== undefined ? { documentNumber: data.documentNumber } : {}),
      ...(data.issuedAt !== undefined
        ? { issuedAt: data.issuedAt ? new Date(data.issuedAt) : null }
        : {}),
      ...(data.expiresAt !== undefined
        ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }
        : {}),
    },
  });

  return { document: updated };
}

/**
 * Soft delete. The stored object is deliberately retained: a document that was once
 * part of a funder submission should not become unretrievable because someone tidied
 * up, and `storagePath` is unique so nothing can reuse the key.
 */
export async function deleteDocument(
  id: string,
  organisationId: string,
  actorId: string,
  actorRole: string,
) {
  const document = await getDocument(id, organisationId);
  if (!document) return err('NOT_FOUND');

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.document.update({
      where: { id: document.id },
      data: { deletedAt: new Date() },
    });

    await tx.verificationEvent.create({
      data: {
        event:
          document.kind === DocumentKind.PROOF_OF_PAYMENT
            ? VerificationEventType.POP_REMOVED
            : VerificationEventType.DOCUMENT_REMOVED,
        documentId: document.id,
        paymentId: document.paymentId,
        actorUserId: actorId,
        actorRole,
      },
    });
  });

  return { id: document.id };
}

/** Count the proofs backing a payment. The verification gate reads this. */
export function countProofOfPayment(paymentId: string) {
  return prisma.document.count({
    where: { paymentId, kind: DocumentKind.PROOF_OF_PAYMENT, ...liveDocumentFilter },
  });
}

/** Documents awaiting a compliance verdict, used by the review status summary. */
export function pendingReviewCount(organisationId: string) {
  return prisma.document.count({
    where: { organisationId, reviewStatus: DocumentReviewStatus.PENDING, ...liveDocumentFilter },
  });
}
