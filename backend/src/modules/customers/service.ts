import { prisma } from '../../config/prisma';

export function listCustomers(organisationId: string) {
  return prisma.customer.findMany({
    where: { organisationId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

export function getCustomer(id: string, organisationId: string) {
  return prisma.customer.findFirst({ where: { id, organisationId, deletedAt: null } });
}

export function createCustomer(
  organisationId: string,
  data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    notes?: string;
  },
) {
  return prisma.customer.create({ data: { ...data, organisationId } });
}

export function updateCustomer(
  id: string,
  organisationId: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    address: string;
    notes: string;
  }>,
) {
  return prisma.customer.updateMany({ where: { id, organisationId }, data });
}

export function deleteCustomer(id: string, organisationId: string) {
  return prisma.customer.updateMany({
    where: { id, organisationId },
    data: { deletedAt: new Date() },
  });
}
