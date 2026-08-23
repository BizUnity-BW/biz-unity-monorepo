-- Adds the document subsystem (Supabase Storage) and the payment verification
-- lifecycle. See docs/plans/2026-08-23-feat-documents-storage-payment-verification-plan.md
--
-- Hand-edited from the generated migration: `payments.organisationId` is a
-- required column on a table that already has rows, so it is added nullable,
-- backfilled from the parent invoice, then tightened to NOT NULL. Prisma's
-- generated single-statement `ADD COLUMN ... NOT NULL` would have failed.

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('PROOF_OF_PAYMENT', 'COMPANY_REGISTRATION', 'TAX_CLEARANCE', 'TRADE_LICENCE', 'VAT_CERTIFICATE', 'BANK_CONFIRMATION', 'DIRECTOR_ID', 'PROOF_OF_ADDRESS', 'ORGANISATION_LOGO', 'USER_AVATAR', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentUploadStatus" AS ENUM ('PENDING_UPLOAD', 'READY');

-- CreateEnum
CREATE TYPE "DocumentReviewStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationEventType" AS ENUM ('PAYMENT_RECORDED', 'POP_ADDED', 'POP_REMOVED', 'PAYMENT_VERIFIED', 'PAYMENT_REJECTED', 'DOCUMENT_UPLOADED', 'DOCUMENT_REMOVED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED');

-- AlterTable
-- Existing payments correctly default to verificationStatus = 'PENDING': nothing
-- has been verified yet.
ALTER TABLE "payments" ADD COLUMN     "organisationId" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT;

-- Backfill the denormalised tenant column from each payment's invoice.
UPDATE "payments" p
SET "organisationId" = i."organisationId"
FROM "invoices" i
WHERE i."id" = p."invoiceId";

ALTER TABLE "payments" ALTER COLUMN "organisationId" SET NOT NULL;

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "bucket" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadStatus" "DocumentUploadStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "reviewStatus" "DocumentReviewStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "documentNumber" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "organisationId" TEXT NOT NULL,
    "paymentId" TEXT,
    "userProfileId" TEXT,
    "uploadedById" TEXT,
    "reviewedById" TEXT,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_events" (
    "id" TEXT NOT NULL,
    "event" "VerificationEventType" NOT NULL,
    "note" TEXT,
    "actorRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "paymentId" TEXT,
    "documentId" TEXT,

    CONSTRAINT "verification_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "documents_storagePath_key" ON "documents"("storagePath");

-- CreateIndex
CREATE INDEX "documents_organisationId_kind_idx" ON "documents"("organisationId", "kind");

-- CreateIndex
CREATE INDEX "documents_paymentId_idx" ON "documents"("paymentId");

-- CreateIndex
CREATE INDEX "documents_reviewStatus_idx" ON "documents"("reviewStatus");

-- CreateIndex
CREATE INDEX "verification_events_paymentId_idx" ON "verification_events"("paymentId");

-- CreateIndex
CREATE INDEX "verification_events_documentId_idx" ON "verification_events"("documentId");

-- CreateIndex
CREATE INDEX "payments_organisationId_verificationStatus_idx" ON "payments"("organisationId", "verificationStatus");

-- CreateIndex
CREATE INDEX "payments_verificationStatus_idx" ON "payments"("verificationStatus");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_events" ADD CONSTRAINT "verification_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_events" ADD CONSTRAINT "verification_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_events" ADD CONSTRAINT "verification_events_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
