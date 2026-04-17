import { prisma } from '../../config/prisma';

export function getOrganisation(id: string) {
  return prisma.organisation.findUnique({ where: { id } });
}

export function updateOrganisation(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    logoUrl: string;
    vatNumber: string;
    currency: string;
  }>,
) {
  return prisma.organisation.update({ where: { id }, data });
}
