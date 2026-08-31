-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "deletedAt" TIMESTAMP(3);
