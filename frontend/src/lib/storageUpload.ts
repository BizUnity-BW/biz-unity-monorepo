import { supabase } from '../store/authStore';
import type { UploadSlot } from '../api/documents';

export interface UploadTransportOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

/**
 * Leg 2 of the upload: browser straight to Supabase Storage.
 *
 * Prefers a raw `PUT` to the signed URL over XHR, because that is the only way to get
 * upload progress and cancellation — `uploadToSignedUrl` is fetch-based and exposes
 * neither. This is not reverse engineering: the library's own non-Blob branch already
 * PUTs a raw body with an explicit content-type to exactly this endpoint.
 *
 * Falls back to `uploadToSignedUrl` if the API ever stops returning `signedUrl`, in
 * which case the caller simply shows an indeterminate progress bar.
 */
export async function uploadToSlot(
  slot: UploadSlot,
  file: File,
  { onProgress, signal }: UploadTransportOptions = {},
): Promise<void> {
  if (slot.signedUrl) {
    await putWithProgress(slot.signedUrl, file, onProgress, signal);
    return;
  }

  const { error } = await supabase.storage
    .from(slot.bucket)
    .uploadToSignedUrl(slot.path, slot.token, file, {
      contentType: file.type || 'application/octet-stream',
    });
  if (error) throw new Error(error.message);
}

function putWithProgress(
  url: string,
  file: File,
  onProgress: ((percent: number) => void) | undefined,
  signal: AbortSignal | undefined,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('content-type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('cache-control', 'max-age=3600');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(uploadErrorMessage(xhr.status)));
    };
    xhr.onerror = () =>
      reject(new Error('Network error while uploading. Check your connection and retry.'));
    xhr.onabort = () => reject(new Error('Upload cancelled.'));

    const abort = () => xhr.abort();
    signal?.addEventListener('abort', abort, { once: true });
    xhr.onloadend = () => signal?.removeEventListener('abort', abort);

    xhr.send(file);
  });
}

function uploadErrorMessage(status: number): string {
  // The bucket enforces its own type and size limits, so these two are worth naming.
  if (status === 413) return 'That file is too large for this document type.';
  if (status === 415) return 'That file type is not accepted for this document.';
  if (status === 400) return 'The upload link has expired. Retry to get a new one.';
  return `Upload failed (${status}). Please try again.`;
}
