// Service worker : garde l'interface du portail disponible hors ligne.
var CACHE = "lapiq-portail-v3";
var FICHIERS = ["./", "index.html", "styles.css", "app.js", "config.js",
  "manifest.webmanifest", "vendor/qrcode.js", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FICHIERS); }));
  self.skipWaiting();
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (cles) {
    return Promise.all(cles.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});
// Réseau d'abord (pour recevoir les mises à jour de config.js), cache en secours.
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) {
    var copie = r.clone();
    caches.open(CACHE).then(function (c) { c.put(e.request, copie); });
    return r;
  }).catch(function () { return caches.match(e.request); }));
});
