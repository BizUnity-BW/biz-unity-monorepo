import type { DocumentKind } from '../types';
import { formatFileSize } from './format';

// Decimal megabytes, matching the backend's `shared/utils/storage.ts` and the bucket
// configuration. Using 1024*1024 here would let a file pass this check and then be
// rejected by Supabase.
const MB = 1000 * 1000;

export interface KindConfig {
  /** Label used in headings, buttons and error copy. */
  label: string;
  /** One-line hint under the drop zone. */
  hint: string;
  /** `accept` attribute for the file input. */
  accept: string;
  /**
   * Extension fallback. `file.type` is genuinely empty for many real picks from
   * Android's document provider, so an accept-list-only check would reject
   * legitimate PDFs on a phone.
   */
  extensions: string[];
  maxBytes: number;
  multiple: boolean;
  /** Collects documentNumber / issuedAt / expiresAt and appears in the KYC pack. */
  compliance: boolean;
}

const DOC_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp';
const DOC_EXTS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
const IMG_ACCEPT = 'image/png,image/jpeg,image/webp';
const IMG_EXTS = ['png', 'jpg', 'jpeg', 'webp'];

function doc(label: string, hint: string, compliance: boolean, multiple = false): KindConfig {
  return {
    label,
    hint,
    accept: DOC_ACCEPT,
    extensions: DOC_EXTS,
    maxBytes: 10 * MB,
    multiple,
    compliance,
  };
}

function image(label: string, hint: string): KindConfig {
  return {
    label,
    hint,
    accept: IMG_ACCEPT,
    extensions: IMG_EXTS,
    maxBytes: 2 * MB,
    multiple: false,
    compliance: false,
  };
}

export const DOCUMENT_KINDS: Record<DocumentKind, KindConfig> = {
  PROOF_OF_PAYMENT: doc(
    'Proof of payment',
    'Bank confirmation, EFT receipt or deposit slip. PDF, JPG or PNG, up to 10 MB.',
    false,
    true,
  ),
  COMPANY_REGISTRATION: doc(
    'Company registration',
    'Certificate of incorporation from CIPA or CIPC.',
    true,
  ),
  TAX_CLEARANCE: doc('Tax clearance certificate', 'Current tax clearance from BURS or SARS.', true),
  TRADE_LICENCE: doc('Trade licence', 'Your council or ministry trading licence.', true),
  VAT_CERTIFICATE: doc('VAT registration certificate', 'Proof of VAT registration.', true),
  BANK_CONFIRMATION: doc(
    'Bank confirmation letter',
    'A bank-stamped letter confirming the account.',
    true,
  ),
  DIRECTOR_ID: doc('Director ID or passport', 'Identity document for a listed director.', true),
  PROOF_OF_ADDRESS: doc(
    'Proof of address',
    'A utility bill or lease no older than three months.',
    true,
  ),
  ORGANISATION_LOGO: image('Organisation logo', 'PNG, JPG or WEBP, up to 2 MB. Square works best.'),
  USER_AVATAR: image('Profile photo', 'PNG, JPG or WEBP, up to 2 MB.'),
  OTHER: doc('Other document', 'PDF, JPG or PNG, up to 10 MB.', false, true),
};

/** The compliance pack, in the order the settings page renders its slots. */
export const COMPLIANCE_KINDS: DocumentKind[] = (
  Object.keys(DOCUMENT_KINDS) as DocumentKind[]
).filter((kind) => DOCUMENT_KINDS[kind].compliance);

function extensionOf(name: string): string {
  const index = name.lastIndexOf('.');
  return index === -1 ? '' : name.slice(index + 1).toLowerCase();
}

/** Returns a message describing why the file is unacceptable, or null if it is fine. */
export function validateFile(file: File, config: KindConfig): string | null {
  const typeOk = file.type !== '' && config.accept.split(',').includes(file.type);
  const extensionOk = config.extensions.includes(extensionOf(file.name));
  if (!typeOk && !extensionOk) {
    const allowed = config.extensions.map((e) => e.toUpperCase()).join(', ');
    return `“${file.name}” is not an accepted file type. Allowed: ${allowed}.`;
  }
  if (file.size === 0) return `“${file.name}” is empty.`;
  if (file.size > config.maxBytes) {
    return `“${file.name}” is ${formatFileSize(file.size)}. The limit is ${formatFileSize(config.maxBytes)}.`;
  }
  return null;
}
