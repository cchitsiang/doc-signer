/**
 * Reads a PDF source URL passed to the app as `?url=<href>` (query) or
 * `#url=<href>` (fragment). Only absolute http(s) URLs are accepted. Returns the
 * URL string, or null if absent/invalid. The app then fetches it directly from
 * the source on the client — no server involved.
 */
export function readPdfUrlParam(): string | null {
  let raw: string | null = null;

  const params = new URLSearchParams(window.location.search);
  raw = params.get("url");

  if (!raw) {
    const match = /[#&]url=([^&]*)/.exec(window.location.hash);
    if (match && match[1]) {
      try {
        raw = decodeURIComponent(match[1]);
      } catch {
        raw = match[1];
      }
    }
  }

  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Reads the `?id=` handed back by the ephemeral upload flow and returns the
 * same-origin `/api/pdf?id=...` URL to fetch it from (read-once). Returns null if
 * absent or malformed.
 */
export function readUploadIdUrl(): string | null {
  const id = new URLSearchParams(window.location.search).get("id");
  if (id && /^[a-f0-9]{16,64}$/.test(id)) {
    return `${window.location.origin}/api/pdf?id=${id}`;
  }
  return null;
}

/**
 * Fetch a PDF from a remote URL on the client. Throws on network failure, a
 * cross-origin (CORS) block, or a non-OK response.
 */
export async function fetchPdfFromUrl(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.arrayBuffer();
}
