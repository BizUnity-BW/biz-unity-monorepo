/**
 * Reap abandoned uploads.
 *
 *   npm run storage:sweep [-- --hours 24] [-- --dry-run]
 *
 * An upload is three legs — mint a slot, PUT to Supabase, confirm — and the row is
 * created on leg 1. A browser that dies between legs therefore leaves a
 * PENDING_UPLOAD row, and possibly an object with no live row pointing at it.
 *
 * Those rows are already invisible to every API read (all of them filter on
 * uploadStatus = READY), so this is housekeeping rather than a correctness fix.
 * There is no scheduler wired up yet; run it by hand or from a cron.
 */
import { DocumentUploadStatus } from '@prisma/client';
import { prisma } from '../../src/config/prisma';
import { supabaseAdmin } from '../../src/config/supabase';

function parseHours(args: string[]): number {
  const index = args.indexOf('--hours');
  if (index === -1) return 24;
  const value = Number(args[index + 1]);
  return Number.isFinite(value) && value > 0 ? value : 24;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const hours = parseHours(args);
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const stale = await prisma.document.findMany({
    where: { uploadStatus: DocumentUploadStatus.PENDING_UPLOAD, createdAt: { lt: cutoff } },
    select: { id: true, bucket: true, storagePath: true, fileName: true, createdAt: true },
  });

  if (stale.length === 0) {
    console.log(`Nothing to sweep: no PENDING_UPLOAD rows older than ${hours}h.`);
    return;
  }

  console.log(
    `${stale.length} abandoned upload(s) older than ${hours}h${dryRun ? ' (dry run)' : ''}:`,
  );

  // Group by bucket so each bucket's objects go in one remove() call.
  const byBucket = new Map<string, string[]>();
  for (const doc of stale) {
    console.log(`  ${doc.id}  ${doc.fileName}  ${doc.createdAt.toISOString()}`);
    byBucket.set(doc.bucket, [...(byBucket.get(doc.bucket) ?? []), doc.storagePath]);
  }

  if (dryRun) return;

  for (const [bucket, paths] of byBucket) {
    // Objects usually do not exist (the upload is what failed). remove() treats a
    // missing key as success, so this needs no existence check.
    const { error } = await supabaseAdmin.storage.from(bucket).remove(paths);
    if (error) console.warn(`  warning: remove from ${bucket} failed: ${error.message}`);
  }

  const { count } = await prisma.document.deleteMany({
    where: { id: { in: stale.map((doc) => doc.id) } },
  });
  console.log(`Removed ${count} row(s).`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
