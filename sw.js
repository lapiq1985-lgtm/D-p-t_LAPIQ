// Service worker : garde le portail (et la carte de membre) disponible hors ligne.
var CACHE = "lapiq-portail-v12";
var QR = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js";
var FICHIERS = ["./", "index.html", "styles.css", "app.js", "config.js",
  "manifest.webmanifest", "icons/logo-lapiq.png", "icons/logo-campus.png", "icons/favicon.png",
  "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-maskable-192.png",
  "icons/ecusson-rouge-bleu.png", "icons/ecusson-noir-or.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(FICHIERS).then(function () {
      return fetch(QR, { mode: "cors" }).then(function (r) { if (r.ok) return c.put(QR, r); }).catch(function () {});
    });
  }));
  self.skipWaiting();
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (cles) {
    return Promise.all(cles.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  // Bibliothèque QR (version fixe) : cache d'abord.
  if (e.request.url === QR) {
    e.respondWith(caches.match(QR).then(function (r) {
      return r || fetch(e.request).then(function (rep) {
        var copie = rep.clone();
        caches.open(CACHE).then(function (c) { c.put(QR, copie); });
        return rep;
      });
    }));
    return;
  }
  var chemin = new URL(e.request.url);
  if (chemin.origin !== location.origin) return;
  // Carte officielle : réseau d'abord, et seulement une réponse réussie est mise en cache.
  if (chemin.pathname.indexOf("/api/") === 0) {
    e.respondWith(fetch(e.request).then(function (r) {
      if (r.ok) {
        var copie = r.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copie); });
      }
      return r;
    }).catch(function () { return caches.match(e.request); }));
    return;
  }
  // Fichiers du portail : réseau d'abord (mises à jour de config.js), cache en secours.
  e.respondWith(fetch(e.request).then(function (r) {
    var copie = r.clone();
    caches.open(CACHE).then(function (c) { c.put(e.request, copie); });
    return r;
  }).catch(function () { return caches.match(e.request); }));
});
