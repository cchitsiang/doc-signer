const MARKER = "#pdf=";

/**
 * Reads a base64-encoded PDF passed in the URL fragment (e.g. from an iOS
 * Shortcut: `https://.../#pdf=<base64>`). The fragment is never sent to the
 * server, so the PDF stays on the device. Returns the decoded bytes, or null if
 * no `#pdf=` fragment is present. Clears the fragment after reading.
 */
export function readUrlPdf(): ArrayBuffer | null {
  const hash = window.location.hash;
  if (!hash.startsWith(MARKER)) return null;
  try {
    let b64 = hash.slice(MARKER.length);
    // The Shortcut may percent-encode the base64; tolerate both forms.
    try {
      b64 = decodeURIComponent(b64);
    } catch {
      // already raw base64
    }
    b64 = b64.replace(/\s/g, "");
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    // Drop the (large) fragment so a refresh doesn't reload and the URL stays clean.
    window.history.replaceState({}, "", window.location.pathname + window.location.search);
    return bytes.buffer;
  } catch {
    return null;
  }
}
