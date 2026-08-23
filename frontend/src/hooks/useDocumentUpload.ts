import { useCallback, useRef, useState } from 'react';
import { documentsApi } from '../api/documents';
import { uploadToSlot } from '../lib/storageUpload';
import { DOCUMENT_KINDS, validateFile } from '../lib/uploadKinds';
import { errMessage } from '../lib/format';
import type { DocumentKind, DocumentRecord } from '../types';

export type UploadPhase =
  | 'queued' // validated, not started
  | 'requesting' // leg 1: reserving the slot
  | 'uploading' // leg 2: browser to Supabase
  | 'confirming' // leg 3: telling our API
  | 'done'
  | 'error';

export interface UploadItem {
  localId: string;
  file: File;
  phase: UploadPhase;
  /** 0-100 when the transport reports progress, null when indeterminate. */
  progress: number | null;
  error: string | null;
  /** Set once leg 1 succeeds, so a retry can resume rather than restart. */
  documentId: string | null;
  /**
   * Which leg a retry starts from. Once the bytes are in Supabase, retrying must
   * only re-confirm — restarting would upload the file a second time.
   */
  resumeFrom: 'slot' | 'confirm';
  document: DocumentRecord | null;
}

export interface UploadOutcome {
  uploaded: DocumentRecord[];
  failed: number;
}

interface Options {
  kind: DocumentKind;
  paymentId?: string;
  userProfileId?: string;
  /** false when the owning record must be created first — see the payment flow. */
  autoStart?: boolean;
  onUploaded?: (document: DocumentRecord) => void;
}

/**
 * Owns the three-legged upload for every surface: proof of payment, compliance
 * documents, logos and avatars.
 *
 * Deliberately contains no `useEffect`. Every transition is driven by a user event or
 * an awaited promise, which keeps it clear of `react-hooks/set-state-in-effect` (an
 * error in this config) and makes the ordering obvious.
 *
 * The queue lives in a ref and is mirrored into state purely for rendering: draining
 * off the state array would close over a stale copy on every patch.
 */
export function useDocumentUpload(options: Options) {
  const { kind, autoStart = true, onUploaded } = options;
  const config = DOCUMENT_KINDS[kind];

  const queue = useRef<UploadItem[]>([]);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const sequence = useRef(0);
  const draining = useRef(false);
  const links = useRef({ paymentId: options.paymentId, userProfileId: options.userProfileId });

  const sync = useCallback(() => setItems([...queue.current]), []);

  const patch = useCallback(
    (localId: string, next: Partial<UploadItem>) => {
      queue.current = queue.current.map((item) =>
        item.localId === localId ? { ...item, ...next } : item,
      );
      sync();
    },
    [sync],
  );

  /** Run one item through whichever legs it still needs. Never throws. */
  const run = useCallback(
    async (item: UploadItem): Promise<DocumentRecord | null> => {
      let documentId = item.documentId;
      try {
        if (item.resumeFrom === 'slot') {
          patch(item.localId, { phase: 'requesting', error: null, progress: null });

          const { data } = await documentsApi.createUploadSlot({
            kind,
            fileName: item.file.name,
            mimeType: item.file.type || 'application/octet-stream',
            sizeBytes: item.file.size,
            paymentId: links.current.paymentId,
            userProfileId: links.current.userProfileId,
          });
          const slot = data.data;
          documentId = slot.documentId;

          patch(item.localId, {
            phase: 'uploading',
            documentId,
            progress: slot.signedUrl ? 0 : null,
          });
          await uploadToSlot(slot, item.file, {
            onProgress: (percent) => patch(item.localId, { progress: percent }),
          });

          // From here a retry must not mint a second slot.
          patch(item.localId, { resumeFrom: 'confirm' });
        }

        patch(item.localId, { phase: 'confirming', error: null });
        const confirmed = await documentsApi.confirm(documentId as string);
        const record = confirmed.data.data;

        patch(item.localId, { phase: 'done', document: record, progress: 100 });
        onUploaded?.(record);
        return record;
      } catch (err) {
        patch(item.localId, {
          phase: 'error',
          documentId,
          error: err instanceof Error ? err.message : errMessage(err, 'Upload failed.'),
        });
        return null;
      }
    },
    [kind, onUploaded, patch],
  );

  /**
   * Drain the queue one file at a time.
   *
   * Sequential rather than parallel: progress stays legible, it is kinder to the
   * mobile networks this product actually runs on, and one failure cannot cascade.
   */
  const drain = useCallback(async (): Promise<UploadOutcome> => {
    if (draining.current) return { uploaded: [], failed: 0 };
    draining.current = true;
    const uploaded: DocumentRecord[] = [];
    try {
      for (;;) {
        const next = queue.current.find((item) => item.phase === 'queued');
        if (!next) break;
        const record = await run(next);
        if (record) uploaded.push(record);
      }
    } finally {
      draining.current = false;
    }
    return {
      uploaded,
      failed: queue.current.filter((item) => item.phase === 'error').length,
    };
  }, [run]);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const files = Array.from(incoming);
      const problems: string[] = [];
      const accepted: UploadItem[] = [];

      for (const file of config.multiple ? files : files.slice(0, 1)) {
        const problem = validateFile(file, config);
        if (problem) {
          problems.push(problem);
          continue;
        }
        sequence.current += 1;
        accepted.push({
          localId: `upload-${sequence.current}`,
          file,
          phase: 'queued',
          progress: null,
          error: null,
          documentId: null,
          resumeFrom: 'slot',
          document: null,
        });
      }

      setRejected(problems);
      if (accepted.length === 0) return;

      // Single-value surfaces (logo, avatar, one compliance slot) replace rather
      // than accumulate, so the queue never shows a stale previous pick.
      queue.current = config.multiple ? [...queue.current, ...accepted] : accepted;
      sync();
      if (autoStart) void drain();
    },
    [autoStart, config, drain, sync],
  );

  /** Start a queue held back by `autoStart: false`, once the owner record exists. */
  const start = useCallback(
    (overrides?: { paymentId?: string; userProfileId?: string }): Promise<UploadOutcome> => {
      if (overrides) links.current = { ...links.current, ...overrides };
      return drain();
    },
    [drain],
  );

  const retry = useCallback(
    (localId: string) => {
      patch(localId, { phase: 'queued', error: null });
      void drain();
    },
    [drain, patch],
  );

  /** Re-queue every failed item and drain. Each resumes from its own leg. */
  const retryFailed = useCallback((): Promise<UploadOutcome> => {
    queue.current = queue.current.map((item) =>
      item.phase === 'error' ? { ...item, phase: 'queued', error: null } : item,
    );
    sync();
    return drain();
  }, [drain, sync]);

  const remove = useCallback(
    (localId: string) => {
      queue.current = queue.current.filter((item) => item.localId !== localId);
      sync();
    },
    [sync],
  );

  const reset = useCallback(() => {
    queue.current = [];
    setRejected([]);
    sync();
  }, [sync]);

  return {
    config,
    items,
    /** Client-side validation failures, as ready-to-render messages. */
    rejected,
    busy: items.some((item) => ['requesting', 'uploading', 'confirming'].includes(item.phase)),
    pending: items.filter((item) => item.phase === 'queued').length,
    failed: items.filter((item) => item.phase === 'error').length,
    addFiles,
    start,
    retry,
    retryFailed,
    remove,
    reset,
  };
}
