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

/**
 * Whether a platform admin has independently verified a payment against its proof.
 * Separate from the invoice's PAID status, which counts recorded payments: "paid"
 * means recorded, "proven paid" means verified.
 */
export type PaymentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface Payment {
  id: string;
  organisationId: string;
  invoiceId: string;
  amountCents: number;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  createdAt: string;
  verificationStatus: PaymentVerificationStatus;
  verifiedAt: string | null;
  rejectionReason: string | null;
  invoice?: Invoice;
  /** Proof-of-payment files, included on the invoice detail and payments list. */
  documents?: DocumentRecord[];
}

// ── Documents ─────────────────────────────────────────────────────────────

export type DocumentKind =
  | 'PROOF_OF_PAYMENT'
  | 'COMPANY_REGISTRATION'
  | 'TAX_CLEARANCE'
  | 'TRADE_LICENCE'
  | 'VAT_CERTIFICATE'
  | 'BANK_CONFIRMATION'
  | 'DIRECTOR_ID'
  | 'PROOF_OF_ADDRESS'
  | 'ORGANISATION_LOGO'
  | 'USER_AVATAR'
  | 'OTHER';

export type DocumentUploadStatus = 'PENDING_UPLOAD' | 'READY';
export type DocumentReviewStatus = 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

/**
 * Mirrors the backend `Document` model.
 *
 * Named `DocumentRecord` rather than `Document` on purpose: `Document` is a DOM
 * global, and shadowing it in every importing file is a trap — several files in this
 * feature also use `document.createElement`.
 */
export interface DocumentRecord {
  id: string;
  organisationId: string;
  kind: DocumentKind;
  bucket: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadStatus: DocumentUploadStatus;
  reviewStatus: DocumentReviewStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  documentNumber: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  paymentId: string | null;
  userProfileId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Verified-payments statement ───────────────────────────────────────────

export interface StatementRow {
  paymentId: string;
  paidAt: string;
  invoiceNumber: string;
  customerName: string;
  method: PaymentMethod;
  reference: string | null;
  amountCents: number;
  verifiedAt: string | null;
  verifiedBy: string | null;
  proofCount: number;
}

export interface VerifiedPaymentsStatement {
  organisation: { name: string; currency: string };
  customer: { id: string; name: string } | null;
  from: string;
  to: string;
  rows: StatementRow[];
  totalCents: number;
  generatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
