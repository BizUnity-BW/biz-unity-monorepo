import { prisma } from '../../config/prisma';

export function getUserBySupabaseId(supabaseId: string) {
  return prisma.user.findUnique({ where: { supabaseId }, include: { organisation: true } });
}

export function updateUser(supabaseId: string, data: Partial<{ name: string; email: string }>) {
  return prisma.user.update({ where: { supabaseId }, data });
}
