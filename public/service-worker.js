const FILES_TO_CACHE = [
    "/",
    "/service-worker.js",
    "/routes",
    "/routes/api.js",
    "/public",
    "/public/icons",
    "/public/index.html",
    "/styles.css",
];

const CACHE_NAME = "static-cache-v1";
const DATA_CACHE_NAME = "runtime-cache";

self.addEventListener("install", event => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
    event.waitUntil(
        caches.kets()
            .then(cacheNames => {
                return cacheNames.filter(
                    cacheName => !currentCaches.includes(cacheName)
                );
            })
            .then(cachesToDelete => {
                return Promise.all(
                    cachesToDelete.map(cachesToDelete => {
                        return caches.delete(cachesToDelete);
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    // non GET requests are not cached and requests to other origins are not cached
    if (
        event.request.method !== "GET" ||
        !event.request.url.startWith(self.location.origin)
    ) {
        !event.respondWith(fetch(event.request));
        return;
    }
    console.log(event.request);
    //handle runtime GET equests
    if (event.request.url.includes("/api/images")) {
        event.respondWith(
            caches.open(RUNTIME_CACHE).then(cache => {
                return fetch(event.request)
                    .then(response => {
                        cache.put(event.request, response.clone());
                        return response;
                    })
                    .catch(() => caches.match(event.request));

            })
        );
        return;
    }
    //use cache first for all requests
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            // request is not in cache. make network reuqest and cache information
            return caches.open(RUNTIME_CACHE).then(cache => {
                return fetch(event.request).then(response => {
                    return cache.put(event.request, response.clone()).then(() => {
                        return response;
                    });
                });
            });
        })
    );
});

self.addEventListener("message", function(evt){
    console.log(evt.data);
} )
