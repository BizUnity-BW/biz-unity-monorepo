export type SystemRole = 'SYSTEM_ADMIN' | 'SYSTEM_USER';
export type OrgRole = 'OWNER' | 'MANAGER' | 'SALES';

export interface UserProfile {
  id: string;
  supabaseId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  systemRole: SystemRole;
  orgRole: OrgRole;
  organisationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  vatNumber: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Customer {
  id: string;
  organisationId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'MOBILE_MONEY' | 'OTHER';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  taxPercent: number;
  totalCents: number;
  sortOrder: number;
}

export interface Quotation {
  id: string;
  organisationId: string;
  customerId: string;
  number: string;
  status: QuotationStatus;
  issueDate: string;
  expiryDate: string | null;
  notes: string | null;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  items?: LineItem[];
}

export interface Invoice {
  id: string;
  organisationId: string;
  customerId: string;
  quotationId: string | null;
  number: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  notes: string | null;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  customer?: Customer;
  items?: LineItem[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  amountCents: number;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  createdAt: string;
  invoice?: Invoice;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  /** Present only on paginated list responses. */
  meta?: PaginationMeta;
}

// ── Admin (cross-tenant) payloads ─────────────────────────────────────────

export interface OrgCounts {
  userProfiles: number;
  customers: number;
  quotations: number;
  invoices: number;
  payments: number;
}

export interface AdminOrganisation extends Organisation {
  _count: OrgCounts;
}

export interface AdminOrgMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  orgRole: OrgRole;
  systemRole: SystemRole;
  createdAt: string;
}

export interface AdminOrganisationDetail extends AdminOrganisation {
  userProfiles: AdminOrgMember[];
}

export interface AdminUser extends UserProfile {
  organisation: { id: string; name: string; slug: string; deletedAt: string | null } | null;
}
