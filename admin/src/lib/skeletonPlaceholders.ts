import type {
  AdminOrganisation,
  AdminOrganisationDetail,
  AdminOrgMember,
  AdminUser,
} from '../types';

/**
 * Stand-in objects rendered while an admin page is loading.
 *
 * `SkeletonShimmer` measures the *real* rendered boxes and paints shimmer over them,
 * so `loading ? <Spinner/> : <Content/>` produces an empty skeleton — there is no
 * structure to measure. Every page therefore renders through one of these instead.
 *
 * The strings are chosen for plausible **length**, not realism: their rendered width
 * is the width of the shimmer block. They are never visible.
 */

const ISO = '2026-01-01T00:00:00.000Z';

function counts(users: number, customers: number, quotations: number, invoices: number) {
  return { userProfiles: users, customers, quotations, invoices, payments: invoices };
}

export const PLACEHOLDER_ORGANISATION: AdminOrganisation = {
  id: 'skeleton-org',
  name: 'Kalahari Trading (Pty) Ltd',
  slug: 'kalahari-trading',
  email: 'accounts@kalahari-trading.co.bw',
  phone: '+267 71 234 567',
  address: 'Plot 1234, Extension 12, Gaborone',
  logoUrl: null,
  vatNumber: 'BW1234567890',
  currency: 'BWP',
  createdAt: ISO,
  updatedAt: ISO,
  deletedAt: null,
  _count: counts(4, 18, 23, 15),
};

/** Distinct names so the rows do not all shimmer to identical widths. */
export const PLACEHOLDER_ORGANISATIONS: AdminOrganisation[] = [
  'Kalahari Trading (Pty) Ltd',
  'Okavango Logistics',
  'Gaborone Fresh Produce',
  'Serowe Construction Group',
  'Maun Safari Outfitters',
].map((name, i) => ({
  ...PLACEHOLDER_ORGANISATION,
  id: `skeleton-org-${i}`,
  name,
  slug: name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, ''),
  _count: counts(2 + i, 10 + i * 3, 14 + i * 2, 9 + i),
}));

const PLACEHOLDER_MEMBERS: AdminOrgMember[] = [
  { firstName: 'Kefilwe', lastName: 'Moremi', orgRole: 'OWNER' as const },
  { firstName: 'Tebogo', lastName: 'Ramotswe', orgRole: 'MANAGER' as const },
  { firstName: 'Lesedi', lastName: 'Kgosi', orgRole: 'SALES' as const },
].map((m, i) => ({
  id: `skeleton-member-${i}`,
  email: `${m.firstName.toLowerCase()}.${m.lastName.toLowerCase()}@example.co.bw`,
  firstName: m.firstName,
  lastName: m.lastName,
  orgRole: m.orgRole,
  systemRole: 'SYSTEM_USER' as const,
  createdAt: ISO,
}));

export const PLACEHOLDER_ORGANISATION_DETAIL: AdminOrganisationDetail = {
  ...PLACEHOLDER_ORGANISATION,
  userProfiles: PLACEHOLDER_MEMBERS,
};

export const PLACEHOLDER_USER: AdminUser = {
  id: 'skeleton-user',
  supabaseId: 'skeleton-supabase-id',
  email: 'kefilwe.moremi@example.co.bw',
  firstName: 'Kefilwe',
  lastName: 'Moremi',
  phone: '+267 71 234 567',
  avatarUrl: null,
  systemRole: 'SYSTEM_USER',
  orgRole: 'OWNER',
  organisationId: 'skeleton-org',
  createdAt: ISO,
  updatedAt: ISO,
  organisation: {
    id: 'skeleton-org',
    name: 'Kalahari Trading (Pty) Ltd',
    slug: 'kalahari-trading',
    deletedAt: null,
  },
};

export const PLACEHOLDER_USERS: AdminUser[] = [
  ['Kefilwe', 'Moremi', 'OWNER'],
  ['Tebogo', 'Ramotswe', 'MANAGER'],
  ['Lesedi', 'Kgosi', 'SALES'],
  ['Mpho', 'Seretse', 'MANAGER'],
  ['Naledi', 'Tshekedi', 'SALES'],
].map(([first, last, role], i) => ({
  ...PLACEHOLDER_USER,
  id: `skeleton-user-${i}`,
  firstName: first,
  lastName: last,
  email: `${first.toLowerCase()}.${last.toLowerCase()}@example.co.bw`,
  orgRole: role as AdminUser['orgRole'],
}));
