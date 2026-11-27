"use strict";

/**
 * Recherche d'une carte de membre officielle.
 *
 * Ordre des sources :
 *   1. LAPIQ_MEMBRES_GZ  — JSON gzippé, encodé en base64 (listes plus longues)
 *   2. LAPIQ_MEMBRES     — JSON brut
 *   3. data/membres.json — fichier local, ignoré par git (ne part pas avec un déploiement Git)
 *   4. data/membres.exemple.json — fiches fictives, pour l'aperçu
 *
 * La réponse ne contient que les champs imprimés sur la carte.
 */

var fs = require("fs");
var path = require("path");
var zlib = require("zlib");
var lib = require("../lib/membres");

var cache = null;

function lireTableau(valeur, origine) {
  var data = typeof valeur === "string" ? JSON.parse(valeur) : valeur;
  if (!Array.isArray(data)) {
    throw new Error(origine + " n'est pas une liste.");
  }
  return data;
}

function lireFichier(chemin) {
  return lireTableau(fs.readFileSync(chemin, "utf8"), chemin);
}

function charger() {
  if (cache) return cache;
  var brut = null;
  var source = "exemple";
  try {
    if (process.env.LAPIQ_MEMBRES_GZ) {
      var json = zlib.gunzipSync(Buffer.from(process.env.LAPIQ_MEMBRES_GZ, "base64")).toString("utf8");
      brut = lireTableau(json, "LAPIQ_MEMBRES_GZ");
      source = "environnement";
    } else if (process.env.LAPIQ_MEMBRES) {
      brut = lireTableau(process.env.LAPIQ_MEMBRES, "LAPIQ_MEMBRES");
      source = "environnement";
    }
  } catch (e) {
    console.error("Export des membres illisible (variable d'environnement).");
    cache = { erreur: "config" };
    return cache;
  }
  if (!brut) {
    var local = path.join(__dirname, "..", "data", "membres.json");
    try {
      if (fs.existsSync(local)) {
        brut = lireFichier(local);
        source = "fichier";
      }
    } catch (e) {
      console.error("data/membres.json illisible.");
      cache = { erreur: "config" };
      return cache;
    }
  }
  if (!brut) {
    try {
      brut = lireFichier(path.join(__dirname, "..", "data", "membres.exemple.json"));
      source = "exemple";
    } catch (e) {
      console.error("Fiches d'exemple introuvables.");
      cache = { erreur: "config" };
      return cache;
    }
  }
  var idx = lib.indexer(brut);
  var exemples = null;
  if (source === "exemple") {
    exemples = Array.from(idx.index.values()).map(function (m) {
      return {
        numero: m.numero,
        nomComplet: m.nomComplet,
        categorie: m.categorie,
        theme: m.theme
      };
    });
  }
  cache = { source: source, index: idx.index, exemples: exemples };
  return cache;
}

function fiche(m) {
  return {
    prenom: m.prenom,
    nom: m.nom,
    nomComplet: m.nomComplet,
    numero: m.numero,
    categorie: m.categorie,
    expiration: m.expiration,
    validite: m.validite,
    theme: m.theme
  };
}

function numeroDemande(req) {
  if (req.query && req.query.numero) return String(req.query.numero);
  try {
    var url = new URL(req.url || "", "http://localhost");
    return url.searchParams.get("numero") || "";
  } catch (e) {
    return "";
  }
}

function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ erreur: "Méthode non permise." });
    return;
  }
  var donnees = charger();
  if (donnees.erreur) {
    res.status(500).json({ erreur: "Le dossier des membres est illisible. Vérifiez la configuration." });
    return;
  }
  var numero = String(numeroDemande(req) || "").trim();
  if (!numero) {
    if (donnees.source === "exemple") {
      res.status(200).json({ source: "exemple", exemples: donnees.exemples });
      return;
    }
    res.status(400).json({ erreur: "Indiquez un numéro de membre." });
    return;
  }
  var resultat = lib.chercher(donnees.index, numero);
  if (resultat.erreur === "format") {
    res.status(400).json({ erreur: "Le numéro doit avoir la forme LAPIQ-AASNNN." });
    return;
  }
  if (resultat.erreur) {
    res.status(404).json({ erreur: "Aucune carte ne correspond à ce numéro." });
    return;
  }
  res.status(200).json({ source: donnees.source, membre: fiche(resultat.membre) });
}

function reinitialiser() {
  cache = null;
}

module.exports = handler;
module.exports.reinitialiser = reinitialiser;
