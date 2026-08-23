import { prisma } from '../../config/prisma';

export function getOrganisation(id: string) {
  return prisma.organisation.findUnique({ where: { id } });
}

// logoUrl is deliberately absent: it was never reachable anyway (the controller's Zod
// schema stripped it) and it is now written only by the document upload flow.
export function updateOrganisation(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    vatNumber: string;
    currency: string;
  }>,
) {
  return prisma.organisation.update({ where: { id }, data });
}
