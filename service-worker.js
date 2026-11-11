var CACHE_NAME = "student-registration-shell-v1";
var APP_SHELL = [
  "./", "./index.html", "./main.js", "./app/config.js", "./app/config.properties", "./app/services/Properties.js",
  "./app/styles/app.css", "./app/App.js"
];
self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(APP_SHELL);
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE_NAME; })
      .map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (event) {
  var request = event.request;
  var url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin ||
      url.pathname.indexOf("/api/") >= 0) return;
  event.respondWith(caches.match(request).then(function (cached) {
    return cached || fetch(request).then(function (response) {
      if (response.ok) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
      }
      return response;
    });
  }));
});
