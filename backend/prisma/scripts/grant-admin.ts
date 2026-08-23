/**
 * Grant or revoke platform-admin access on an existing profile.
 *
 *   npm run admin:grant -- someone@bizunity.co
 *   npm run admin:grant -- someone@bizunity.co --revoke
 *
 * Idempotent, and the only sanctioned way in. Chosen over a manual UPDATE (which is
 * unrepeatable and undocumented) and over an env allowlist (which would drift from
 * the database and recreate the two-sources-of-truth defect this feature fixed).
 *
 * The profile must already exist — sign up through the app first.
 */
import { SystemRole } from '@prisma/client';
import { prisma } from '../../src/config/prisma';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const revoke = args.includes('--revoke');
  const email = args
    .find((arg) => !arg.startsWith('--'))
    ?.toLowerCase()
    .trim();

  if (!email) {
    console.error('Usage: npm run admin:grant -- <email> [--revoke]');
    process.exit(1);
  }

  const profile = await prisma.userProfile.findUnique({ where: { email } });
  if (!profile) {
    console.error(`No profile found for ${email}. They need to sign up first.`);
    process.exit(1);
  }

  const target = revoke ? SystemRole.SYSTEM_USER : SystemRole.SYSTEM_ADMIN;

  if (profile.systemRole === target) {
    console.log(`No change: ${email} is already ${target}.`);
    return;
  }

  // Refuse to remove the last admin — that locks everyone out of the console with
  // no way back in through the application.
  if (revoke) {
    const remaining = await prisma.userProfile.count({
      where: { systemRole: SystemRole.SYSTEM_ADMIN, id: { not: profile.id } },
    });
    if (remaining === 0) {
      console.error(`Refusing to revoke: ${email} is the only SYSTEM_ADMIN.`);
      process.exit(1);
    }
  }

  const updated = await prisma.userProfile.update({
    where: { id: profile.id },
    data: { systemRole: target },
  });

  console.log(`${email}: ${profile.systemRole} -> ${updated.systemRole}`);
  console.log(`profileId=${updated.id} organisationId=${updated.organisationId ?? 'null'}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
