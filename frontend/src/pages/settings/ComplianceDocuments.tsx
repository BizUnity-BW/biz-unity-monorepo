import { useCallback, useEffect, useMemo, useState } from 'react';
import { documentsApi } from '../../api/documents';
import { useAuth } from '../../hooks/useAuth';
import { COMPLIANCE_KINDS } from '../../lib/uploadKinds';
import { daysUntil, errMessage } from '../../lib/format';
import { PLACEHOLDER_DOCUMENTS } from '../../lib/skeletonPlaceholders';
import SkeletonShimmer from '../../components/ui/SkeletonShimmer';
import ConfirmDialog from '../customers/ConfirmDialog';
import DocumentSlot from './DocumentSlot';
import DocumentMetaModal from './DocumentMetaModal';
import type { DocumentKind, DocumentRecord } from '../../types';

/**
 * The compliance pack.
 *
 * Slot-driven rather than list-driven: the kinds are a fixed checklist, so the page
 * renders every slot and looks each one up in the fetched documents. That way the user
 * sees what is *missing*, which is the entire point of a KYC pack — a list of what
 * happens to exist would hide the gaps.
 */
export default function ComplianceDocuments() {
  const { profile } = useAuth();
  const canManage = profile?.orgRole === 'OWNER' || profile?.orgRole === 'MANAGER';

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<DocumentRecord | null>(null);
  const [deleting, setDeleting] = useState<DocumentRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await documentsApi.list();
      setDocuments(res.data.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load documents.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Shimmer measures the rendered children, so the slots render with stand-in
  // documents while loading — at "filled" width rather than "Not uploaded" width.
  const model = loading ? PLACEHOLDER_DOCUMENTS : documents;

  const byKind = useMemo(() => {
    const map = new Map<DocumentKind, DocumentRecord>();
    for (const document of model) {
      if (!map.has(document.kind)) map.set(document.kind, document);
    }
    return map;
  }, [model]);

  // Expired and expiring slots sort to the top: they are the ones needing action.
  const orderedKinds = useMemo(() => {
    const weight = (kind: DocumentKind): number => {
      const document = byKind.get(kind);
      if (!document) return 2;
      const days = daysUntil(document.expiresAt);
      if (days !== null && days < 0) return 0;
      if (days !== null && days <= 30) return 1;
      if (document.reviewStatus === 'REJECTED') return 1;
      return 3;
    };
    return [...COMPLIANCE_KINDS].sort((a, b) => weight(a) - weight(b));
  }, [byKind]);

  const complete = COMPLIANCE_KINDS.filter((kind) => byKind.has(kind)).length;
  const total = COMPLIANCE_KINDS.length;
  const needsAttention = COMPLIANCE_KINDS.filter((kind) => {
    const document = byKind.get(kind);
    if (!document) return false;
    const days = daysUntil(document.expiresAt);
    return (days !== null && days <= 30) || document.reviewStatus === 'REJECTED';
  }).length;

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await documentsApi.remove(deleting.id);
      setDeleting(null);
      await load();
    } catch (err) {
      setError(errMessage(err, 'Could not delete that document.'));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Static chrome: excluded from the shimmer so only the data shimmers. */}
      <div
        data-shimmer-ignore
        className="mb-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Your compliance pack is {loading ? '—' : complete} of {total} complete
          </h2>
          {!loading && needsAttention > 0 && (
            <span className="text-xs font-medium text-amber-500">
              {needsAttention} {needsAttention === 1 ? 'document needs' : 'documents need'}{' '}
              attention
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Funders and lenders ask for these documents. Upload them once and they stay on file, ready
          to share.
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-border-subtle)]">
          <div
            className="h-full bg-amber-500 transition-[width] duration-300"
            style={{ width: `${loading ? 0 : (complete / total) * 100}%` }}
          />
        </div>
      </div>

      {!canManage && (
        <div className="mb-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
          You can view the compliance pack, but only an owner or manager can change it.
        </div>
      )}

      <SkeletonShimmer loading={loading}>
        <ul className="divide-y divide-[var(--color-border-subtle)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          {orderedKinds.map((kind) => (
            <DocumentSlot
              key={kind}
              kind={kind}
              document={byKind.get(kind)}
              readOnly={!canManage}
              onChanged={load}
              onEditDetails={setEditing}
              onDelete={setDeleting}
            />
          ))}
        </ul>
      </SkeletonShimmer>

      {/* Overlays stay outside the measured subtree. */}
      {editing && (
        <DocumentMetaModal
          document={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          open
          title="Delete this document?"
          message={`“${deleting.fileName}” will be removed from your compliance pack.`}
          confirmLabel="Delete"
          danger
          busy={deleteBusy}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
