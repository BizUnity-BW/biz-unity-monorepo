import type { PaymentMethod } from '../types';

/**
 * The single source of method labels.
 *
 * These were previously duplicated as `METHOD_LABELS` in PaymentHistory and `METHODS`
 * in InvoiceDetail, which had already drifted in shape.
 */
export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'MOBILE_MONEY', label: 'Mobile money' },
  { value: 'OTHER', label: 'Other' },
];

export const PAYMENT_METHOD_LABELS = Object.fromEntries(
  PAYMENT_METHODS.map((method) => [method.value, method.label]),
) as Record<PaymentMethod, string>;

export function paymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
