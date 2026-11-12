// Spike service worker: makes the page installable and serves the generated PDF under a real
// same-origin URL, for the drag test with Chrome's DownloadURL (question 4).
const GENERATED_CACHE = "abendkasse-spike-generated";
const GENERATED_PATH_MARKER = "/generated/";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (!event.request.url.includes(GENERATED_PATH_MARKER)) {
    return;
  }
  event.respondWith(
    caches.open(GENERATED_CACHE)
      .then((cache) => cache.match(event.request))
      .then((cached) => cached ?? new Response("not generated yet", { status: 404 })),
  );
});
