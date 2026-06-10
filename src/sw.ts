/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

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
