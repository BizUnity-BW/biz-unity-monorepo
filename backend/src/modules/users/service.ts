import { prisma } from '../../config/prisma';

export function getUserBySupabaseId(supabaseId: string) {
  return prisma.userProfile.findUnique({
    where: { supabaseId },
    include: { organisation: true },
  });
}

// avatarUrl is deliberately absent: it is written only by the document upload flow.
export function updateUser(
  supabaseId: string,
  data: Partial<{ firstName: string; lastName: string; phone: string }>,
) {
  return prisma.userProfile.update({ where: { supabaseId }, data });
}
