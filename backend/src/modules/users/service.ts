import { prisma } from '../../config/prisma';

export function getUserBySupabaseId(supabaseId: string) {
  return prisma.userProfile.findUnique({
    where: { supabaseId },
    include: { organisation: true },
  });
}

export function updateUser(
  supabaseId: string,
  data: Partial<{ firstName: string; lastName: string; phone: string; avatarUrl: string }>,
) {
  return prisma.userProfile.update({ where: { supabaseId }, data });
}
