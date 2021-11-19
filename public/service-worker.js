console.log("Service worker connected");
const FILES_TO_CACHE = [
  "/",
  "/styles.css",
  "/index.js",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/manifest.json",
  "/db.js"
];

const STATIC_CACHE = "static-cache-v1";
const RUNTIME_CACHE = "runtime-cache";

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => cache.add("/api/transaction"))
  );
  event.waitUntil(
    caches
      .open(RUNTIME_CACHE)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== RUNTIME_CACHE && key !== STATIC_CACHE) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  if (event.request.url.includes("/api/")) {
      console.log("[Service Worker] Fetch (data)", event.request.url);

      event.respondWith(
          caches.open(STATIC_CACHE).then(cache => {
              return fetch(event.request)
                  .then(response => {
                      if (response.status === 200) {
                          cache.put(event.request.url, response.clone());
                      }
                      return response;
                  })
                  .catch(err => {
                      return cache.match(event.request);
                  });
          })
      );
      return;
  }

  event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache => {
          return cache.match(event.request).then(response => {
              return response || fetch(event.request);
          });
      })
  );
});
