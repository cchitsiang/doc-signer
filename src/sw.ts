/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

// Activate a new service worker immediately and take control of open clients, so
// shipped updates apply on the next load instead of waiting for every tab to close.
self.addEventListener("install", () => {
  void self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

precacheAndRoute(self.__WB_MANIFEST);

const SHARED_PDF_CACHE = "shared-pdf";

self.addEventListener("fetch", (event: FetchEvent) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.pathname === "/share-target") {
    event.respondWith(
      (async () => {
        const form = await event.request.formData();
        const file = form.get("file");
        if (file instanceof File) {
          const cache = await caches.open(SHARED_PDF_CACHE);
          await cache.put("/__shared.pdf", new Response(file));
        }
        return Response.redirect("/?share-target=1", 303);
      })(),
    );
  }
});
