#!/usr/bin/env node
"use strict";

/**
 * Sert le portail et /api/membre pour les essais locaux.
 *   node scripts/servir-local.js
 *   PORT=8080 node scripts/servir-local.js
 */

var http = require("http");
var fs = require("fs");
var path = require("path");
var handler = require("../api/membre");

var RACINE = path.join(__dirname, "..");
var PORT = Number(process.env.PORT) || 8080;
var TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".csv": "text/csv; charset=utf-8"
};

function enveloppe(res) {
  return {
    code: 200,
    setHeader: function (k, v) { res.setHeader(k, v); return this; },
    status: function (c) { this.code = c; res.statusCode = c; return this; },
    json: function (obj) {
      res.statusCode = this.code || 200;
      if (!res.getHeader("Content-Type")) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
      }
      res.end(JSON.stringify(obj));
    }
  };
}

var serveur = http.createServer(function (req, res) {
  var url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/membre") {
    req.query = Object.fromEntries(url.searchParams);
    handler(req, enveloppe(res));
    return;
  }
  var chemin = decodeURIComponent(url.pathname);
  if (chemin.endsWith("/")) chemin += "index.html";
  var fichier = path.normalize(path.join(RACINE, chemin));
  if (fichier !== RACINE && !fichier.startsWith(RACINE + path.sep)) {
    res.statusCode = 403;
    res.end("Interdit");
    return;
  }
  fs.readFile(fichier, function (err, data) {
    if (err) {
      res.statusCode = 404;
      res.end("Introuvable");
      return;
    }
    res.setHeader("Content-Type", TYPES[path.extname(fichier)] || "application/octet-stream");
    res.end(data);
  });
});

serveur.listen(PORT, function () {
  console.log("Portail local : http://localhost:" + PORT);
});
