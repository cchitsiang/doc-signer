const SHARED_PDF_CACHE = "shared-pdf";

/** Returns shared PDF bytes if the app was launched via a share target, else null. */
export async function readSharedPdf(): Promise<ArrayBuffer | null> {
  const params = new URLSearchParams(window.location.search);
  if (params.get("share-target") !== "1") return null;
  try {
    const cache = await caches.open(SHARED_PDF_CACHE);
    const res = await cache.match("/__shared.pdf");
    if (!res) return null;
    const buf = await res.arrayBuffer();
    await cache.delete("/__shared.pdf");
    // Clean the URL so a refresh doesn't re-trigger.
    window.history.replaceState({}, "", "/");
    return buf;
  } catch {
    return null;
  }
}
