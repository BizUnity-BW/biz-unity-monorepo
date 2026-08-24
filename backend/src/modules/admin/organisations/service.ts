import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/prisma';

/**
 * Counts come from `_count`, never from loading the rows: these queries span every
 * tenant, so a naive include would pull the whole database into memory.
 */
const ORG_COUNTS = {
  _count: {
    select: {
      userProfiles: true,
      customers: true,
      quotations: true,
      invoices: true,
      payments: true,
    },
  },
} as const;

/** Cross-org directory. Deliberately not scoped by organisation — see modules/admin/routes.ts. */
export async function listOrganisations(filter: {
  search?: string;
  includeDeleted: boolean;
  page: number;
  limit: number;
}) {
  const where: Prisma.OrganisationWhereInput = {
    ...(filter.includeDeleted ? {} : { deletedAt: null }),
    ...(filter.search
      ? {
          OR: [
            { name: { contains: filter.search, mode: 'insensitive' } },
            { slug: { contains: filter.search, mode: 'insensitive' } },
            { email: { contains: filter.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, organisations] = await Promise.all([
    prisma.organisation.count({ where }),
    prisma.organisation.findMany({
      where,
      // Newest first: an admin opening this list is usually looking at a recent signup.
      orderBy: { createdAt: 'desc' },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
      include: ORG_COUNTS,
    }),
  ]);

  return { total, organisations };
}

/**
 * No `deletedAt` filter here on purpose: a support case is often *about* an
 * organisation that was suspended, so the detail page must still open it.
 */
export function getOrganisation(id: string) {
  return prisma.organisation.findUnique({
    where: { id },
    include: {
      ...ORG_COUNTS,
      userProfiles: {
        orderBy: [{ orgRole: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          orgRole: true,
          systemRole: true,
          createdAt: true,
        },
      },
    },
  });
}
