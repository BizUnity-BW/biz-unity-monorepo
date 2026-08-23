/**
 * Browser download helpers.
 *
 * Kept out of `format.ts`, which is pure string formatting — these touch the DOM.
 */

/**
 * Trigger a download for a URL via a hidden anchor.
 *
 * An anchor rather than `window.open`, because the URL is usually fetched
 * asynchronously first and Safari blocks `window.open` outside the tick of the user
 * gesture. Note the `download` attribute is ignored for cross-origin URLs, which is
 * why the backend sets `Content-Disposition: attachment` on signed storage URLs.
 */
export function downloadFromUrl(url: string, fileName?: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  if (fileName) anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** Download an in-memory blob, cleaning up the object URL afterwards. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  downloadFromUrl(url, fileName);
  // Deferred a tick: revoking synchronously after .click() cancels the download in
  // Firefox and Safari, which have not read the URL yet.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
