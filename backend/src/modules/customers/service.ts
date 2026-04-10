import { prisma } from '../../config/prisma';

export function listCustomers(orgId: string) {
  return prisma.customer.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
}

export function getCustomer(id: string, orgId: string) {
  return prisma.customer.findFirst({ where: { id, orgId } });
}

export function createCustomer(
  orgId: string,
  data: { name: string; email?: string; phone?: string; address?: string },
) {
  return prisma.customer.create({ data: { ...data, orgId } });
}

export function updateCustomer(
  id: string,
  orgId: string,
  data: Partial<{ name: string; email: string; phone: string; address: string }>,
) {
  return prisma.customer.updateMany({ where: { id, orgId }, data });
}

export function deleteCustomer(id: string, orgId: string) {
  return prisma.customer.deleteMany({ where: { id, orgId } });
}
