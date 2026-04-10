import { prisma } from '../../config/prisma';
import { slugify } from '../../shared/utils';

export async function createOrganisation(
  name: string,
  supabaseUserId: string,
  userEmail: string,
  userName: string,
) {
  const slug = slugify(name);
  return prisma.$transaction(async (tx) => {
    const org = await tx.organisation.create({
      data: { name, slug },
    });
    await tx.user.create({
      data: {
        supabaseId: supabaseUserId,
        email: userEmail,
        name: userName,
        role: 'owner',
        orgId: org.id,
      },
    });
    return org;
  });
}

export function getOrganisation(id: string) {
  return prisma.organisation.findUnique({ where: { id } });
}

export function updateOrganisation(id: string, data: { name?: string }) {
  return prisma.organisation.update({ where: { id }, data });
}
