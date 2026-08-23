/**
 * Idempotent Supabase Storage bucket provisioning.
 *
 *   npm run storage:provision
 *
 * Buckets are infrastructure, so they are created from a script that can be re-run
 * and reviewed rather than clicked together in the dashboard.
 *
 * The documents bucket is private and deliberately has **no** `storage.objects` RLS
 * policies: Supabase denies by default, so only the service-role key can reach it.
 * Uploads still work because a signed upload token is itself the authorisation.
 */
import { supabaseAdmin } from '../config/supabase';
import { env } from '../config/env';
import { MAX_DOCUMENT_BYTES, MAX_IMAGE_BYTES } from '../shared/utils/storage';

interface BucketSpec {
  name: string;
  public: boolean;
  allowedMimeTypes: string[];
  /**
   * Bytes, not a "10MB" string. Supabase parses those strings as decimal megabytes,
   * and the API's own size check has to agree with the bucket exactly — otherwise a
   * file passes validation and is then rejected on upload.
   */
  fileSizeLimit: number;
  purpose: string;
}

const BUCKETS: BucketSpec[] = [
  {
    name: env.SUPABASE_BUCKET_DOCUMENTS,
    public: false,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: MAX_DOCUMENT_BYTES,
    purpose: 'Proof of payment, compliance and KYC documents. Private, signed URLs only.',
  },
  {
    name: env.SUPABASE_BUCKET_PUBLIC,
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    fileSizeLimit: MAX_IMAGE_BYTES,
    purpose: 'Organisation logos and user avatars. Public so <img> needs no token.',
  },
];

async function provision(spec: BucketSpec): Promise<void> {
  const options = {
    public: spec.public,
    allowedMimeTypes: spec.allowedMimeTypes,
    fileSizeLimit: spec.fileSizeLimit,
  };

  const visibility = spec.public ? 'public' : 'private';
  const { error: createError } = await supabaseAdmin.storage.createBucket(spec.name, options);

  if (!createError) {
    console.log(`created  ${spec.name}  (${visibility}, ${spec.fileSizeLimit} bytes)`);
    return;
  }

  // Already there: bring its limits back in line with this file rather than
  // assuming whatever it currently has is correct.
  const message = createError.message.toLowerCase();
  const alreadyExists = message.includes('already exists') || message.includes('duplicate');
  if (!alreadyExists) {
    throw new Error(`createBucket(${spec.name}) failed: ${createError.message}`);
  }

  const { error: updateError } = await supabaseAdmin.storage.updateBucket(spec.name, options);
  if (updateError) {
    throw new Error(`updateBucket(${spec.name}) failed: ${updateError.message}`);
  }
  console.log(`exists   ${spec.name}  (${visibility}, ${spec.fileSizeLimit} bytes, reconciled)`);
}

async function main(): Promise<void> {
  console.log(`Supabase project: ${env.SUPABASE_URL}\n`);
  for (const spec of BUCKETS) {
    await provision(spec);
    console.log(`         ${spec.purpose}`);
  }
  console.log('\nDone.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
