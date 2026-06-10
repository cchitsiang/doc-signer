const MARKER = "#pdf=";

/**
 * Normalize whatever the iOS Shortcut / Safari produced into standard base64:
 * - MIME line breaks (the default "Every 76 characters" option) are removed.
 * - A `+` decoded to a space by a form-style URL layer is restored.
 * - base64url (`-`/`_`) is converted to standard (`+`/`/`).
 * - Padding is repaired.
 */
export function normalizeBase64(input: string): string {
  let b64 = input.replace(/[\r\n\t]/g, ""); // strip MIME line breaks
  b64 = b64.replace(/ /g, "+"); // a layer may have turned '+' into ' '
  b64 = b64.replace(/-/g, "+").replace(/_/g, "/"); // base64url -> base64
  b64 = b64.replace(/[^A-Za-z0-9+/=]/g, ""); // drop any stray characters
  while (b64.length % 4 !== 0) b64 += "=";
  return b64;
}

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
    b64 = normalizeBase64(b64);
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
