import { Prisma, OrgRole, SystemRole } from '@prisma/client';
import { prisma } from '../../../config/prisma';

export type AdminUserError =
  | 'NOT_FOUND'
  | 'SELF_DEMOTION'
  | 'ORG_ROLE_WITHOUT_ORG'
  | 'LAST_OWNER'
  | 'ORG_NOT_FOUND';

const USER_INCLUDE = {
  organisation: { select: { id: true, name: true, slug: true, deletedAt: true } },
} as const;

type UserWithOrg = Prisma.UserProfileGetPayload<{ include: typeof USER_INCLUDE }>;

/**
 * Annotated rather than inferred: with five return sites the inferred union stopped
 * discriminating on `error`, so callers saw `string | undefined` instead of the
 * literal union they switch on.
 */
type WriteResult = { user: UserWithOrg } | { error: AdminUserError };

/** Cross-org user directory. `organisationId: 'none'` finds platform staff and orphans. */
export async function listUsers(filter: {
  search?: string;
  organisationId?: string;
  systemRole?: SystemRole;
  orgRole?: OrgRole;
  page: number;
  limit: number;
}) {
  const where: Prisma.UserProfileWhereInput = {
    ...(filter.organisationId === 'none'
      ? { organisationId: null }
      : filter.organisationId
        ? { organisationId: filter.organisationId }
        : {}),
    ...(filter.systemRole ? { systemRole: filter.systemRole } : {}),
    ...(filter.orgRole ? { orgRole: filter.orgRole } : {}),
    ...(filter.search
      ? {
          OR: [
            { email: { contains: filter.search, mode: 'insensitive' } },
            { firstName: { contains: filter.search, mode: 'insensitive' } },
            { lastName: { contains: filter.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.userProfile.count({ where }),
    prisma.userProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
      include: USER_INCLUDE,
    }),
  ]);

  return { total, users };
}

export function getUser(id: string) {
  return prisma.userProfile.findUnique({ where: { id }, include: USER_INCLUDE });
}

/**
 * Would removing this user from `organisationId` leave that organisation with no
 * OWNER? An org with no owner cannot be administered by anyone inside it, so both
 * write paths below refuse to create one.
 */
async function wouldOrphanOrganisation(
  userId: string,
  organisationId: string | null,
): Promise<boolean> {
  if (!organisationId) return false;
  const owners = await prisma.userProfile.count({
    where: { organisationId, orgRole: OrgRole.OWNER },
  });
  if (owners === 0) return false; // already ownerless; not this change's fault
  const target = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: { orgRole: true },
  });
  return target?.orgRole === OrgRole.OWNER && owners === 1;
}

export async function setRoles(
  id: string,
  data: { systemRole?: SystemRole; orgRole?: OrgRole },
  actorProfileId: string,
): Promise<WriteResult> {
  const target = await prisma.userProfile.findUnique({
    where: { id },
    select: { id: true, orgRole: true, systemRole: true, organisationId: true },
  });
  if (!target) return { error: 'NOT_FOUND' as const };

  // Locking yourself out locks everyone out: there is no UI to grant the role back,
  // only the CLI script, and only an existing admin can reach the admin app at all.
  if (
    data.systemRole &&
    data.systemRole !== SystemRole.SYSTEM_ADMIN &&
    target.id === actorProfileId
  ) {
    return { error: 'SELF_DEMOTION' as const };
  }

  // orgRole is meaningless without an organisation, and silently storing one would
  // take effect later when the user is assigned to an org, which is worse.
  if (data.orgRole && !target.organisationId) {
    return { error: 'ORG_ROLE_WITHOUT_ORG' as const };
  }

  if (
    data.orgRole &&
    data.orgRole !== OrgRole.OWNER &&
    (await wouldOrphanOrganisation(id, target.organisationId))
  ) {
    return { error: 'LAST_OWNER' as const };
  }

  return { user: await prisma.userProfile.update({ where: { id }, data, include: USER_INCLUDE }) };
}

export async function setOrganisation(
  id: string,
  organisationId: string | null,
  actorProfileId: string,
): Promise<WriteResult> {
  const target = await prisma.userProfile.findUnique({
    where: { id },
    select: { id: true, orgRole: true, organisationId: true },
  });
  if (!target) return { error: 'NOT_FOUND' as const };

  // Moving yourself into a tenant is how an admin accidentally stops being able to
  // reach the cross-tenant routes they rely on, so require it to be deliberate.
  if (organisationId && target.id === actorProfileId) {
    return { error: 'SELF_DEMOTION' as const };
  }

  if (organisationId) {
    const org = await prisma.organisation.findFirst({
      where: { id: organisationId, deletedAt: null },
      select: { id: true },
    });
    if (!org) return { error: 'ORG_NOT_FOUND' as const };
  }

  if (
    organisationId !== target.organisationId &&
    (await wouldOrphanOrganisation(id, target.organisationId))
  ) {
    return { error: 'LAST_OWNER' as const };
  }

  // orgRole is left as-is when detaching. It becomes inert rather than wrong, and
  // resetting it would silently demote someone who is later re-attached.
  return {
    user: await prisma.userProfile.update({
      where: { id },
      data: { organisationId },
      include: USER_INCLUDE,
    }),
  };
}
