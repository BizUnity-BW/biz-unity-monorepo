export interface Organisation {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

export interface User {
  id: string;
  supabaseId: string;
  email: string;
  name: string;
  role: string;
  organisation: Organisation;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Quotation {
  id: string;
  customerId: string;
  customer: Customer;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  lineItems: LineItem[];
  total: number;
  validUntil?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  customer: Customer;
  quotationId?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  lineItems: LineItem[];
  total: number;
  dueDate: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'cash' | 'card' | 'eft' | 'other';
  reference?: string;
  paidAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
