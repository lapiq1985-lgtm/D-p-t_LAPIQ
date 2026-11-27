#!/usr/bin/env node
"use strict";

/**
 * Transforme un export Yapla (CSV) en data/membres.json.
 * Ce fichier est ignoré par git : il ne doit pas être commité.
 *
 *   node scripts/importer-yapla.js export.csv
 *   node scripts/importer-yapla.js export.csv --gzip
 *
 * --gzip écrit aussi data/membres.json.gz.b64, à coller dans la variable
 * Vercel LAPIQ_MEMBRES_GZ (les déploiements Git n'embarquent pas le fichier ignoré).
 */

var fs = require("fs");
var path = require("path");
var zlib = require("zlib");
var lib = require("../lib/membres");

var RACINE = path.join(__dirname, "..");

function aide() {
  console.log("Usage : node scripts/importer-yapla.js <export.csv> [--gzip]");
  console.log("Écrit data/membres.json (ignoré par git).");
  console.log("--gzip écrit aussi data/membres.json.gz.b64 pour la variable LAPIQ_MEMBRES_GZ.");
}

function main() {
  var args = process.argv.slice(2).filter(function (a) { return a !== "--"; });
  if (args.indexOf("--help") !== -1 || args.indexOf("-h") !== -1 || !args.length) {
    aide();
    process.exit(args.length ? 0 : 2);
  }
  var gzip = args.indexOf("--gzip") !== -1;
  var csvPath = args.filter(function (a) { return a !== "--gzip"; })[0];
  if (!csvPath) {
    aide();
    process.exit(2);
  }
  var texte = fs.readFileSync(csvPath, "utf8");
  var resultat = lib.analyserCsv(texte);
  if (!resultat.membres.length) {
    console.error("Aucun membre reconnu dans " + csvPath);
    resultat.avertissements.forEach(function (a) { console.error("  " + a); });
    process.exit(1);
  }
  var dest = path.join(RACINE, "data", "membres.json");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(resultat.membres, null, 2) + "\n", "utf8");
  console.log(resultat.membres.length + " membre(s) écrit(s) dans " + dest);
  resultat.avertissements.forEach(function (a) { console.warn("  " + a); });
  var brut = JSON.stringify(resultat.membres);
  console.log("JSON compact : " + brut.length + " octets.");
  if (gzip) {
    var b64 = zlib.gzipSync(Buffer.from(brut), { level: 9 }).toString("base64");
    var destGz = path.join(RACINE, "data", "membres.json.gz.b64");
    fs.writeFileSync(destGz, b64, "utf8");
    console.log("Variable LAPIQ_MEMBRES_GZ : " + b64.length + " octets, écrite dans " + destGz);
    if (b64.length > 48000) {
      console.warn("Cette valeur risque de dépasser le plafond Vercel (64 Ko pour toutes les variables d'un déploiement).");
    }
  }
}

main();
