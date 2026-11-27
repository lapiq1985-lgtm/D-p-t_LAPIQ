"use strict";

/**
 * Lecture et normalisation des membres LAPIQ (export Yapla).
 * Aucune donnée personnelle n'est codée ici : seulement le format.
 *
 * Numéro : LAPIQ-AASNNN
 *   AA année, S statut, NNN séquence
 *   0 retraité / à vie, 1 instructeur ENPQ, 2 enseignant,
 *   3 associé, 4 étudiant
 */

var CATEGORIES = {
  "0": "Retraité – membre à vie",
  "1": "Instructeur ENPQ",
  "2": "Enseignant",
  "3": "Membre associé",
  "4": "Étudiant"
};

var NOMS_MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre"
];

var MOIS = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12
};

function sansAccent(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function texte(v) {
  return String(v == null ? "" : v).replace(/\s+/g, " ").trim();
}

function normaliserNumero(valeur) {
  var s = String(valeur || "").trim().toUpperCase().replace(/[\s_]+/g, "");
  s = s.replace(/^LAPIQ(?!-)/, "LAPIQ-");
  if (/^\d{6}$/.test(s)) s = "LAPIQ-" + s;
  var m = /^LAPIQ-(\d{2})(\d)(\d{3})$/.exec(s);
  return m ? "LAPIQ-" + m[1] + m[2] + m[3] : "";
}

function statutDe(numero) {
  var m = /^LAPIQ-\d{2}(\d)\d{3}$/.exec(numero || "");
  return m ? m[1] : "";
}

function themeDe(numero, categorie) {
  if (statutDe(numero) === "0") return "or";
  var c = sansAccent(categorie);
  if (c.indexOf("a vie") !== -1 || c.indexOf("retrait") !== -1) return "or";
  return "standard";
}

function versIso(valeur) {
  var s = texte(valeur);
  if (!s) return "";
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return m[1] + "-" + m[2] + "-" + m[3];
  m = /^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/.exec(s);
  if (m) {
    return m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
  }
  m = /(\d{1,2})\s+([A-Za-zàâéèêëîïôùûüç]+)\s+(\d{4})/.exec(s);
  if (m) {
    var mois = MOIS[sansAccent(m[2])];
    if (mois) {
      return m[3] + "-" + String(mois).padStart(2, "0") + "-" + String(Number(m[1])).padStart(2, "0");
    }
  }
  return "";
}

function formaterDate(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return "";
  var mois = NOMS_MOIS[Number(m[2]) - 1];
  if (!mois) return "";
  return Number(m[3]) + " " + mois + " " + m[1];
}

function phraseValidite(iso) {
  var d = formaterDate(iso);
  return d ? "Valide jusqu\u2019au " + d : "";
}

function separerNom(complet) {
  var s = texte(complet);
  var i = s.indexOf(" ");
  if (!s) return { prenom: "", nom: "" };
  if (i === -1) return { prenom: "", nom: s };
  return { prenom: s.slice(0, i), nom: s.slice(i + 1) };
}

/**
 * Produit la fiche affichée sur la carte. Le courriel, s'il était dans
 * l'export, n'est jamais repris.
 */
function normaliserMembre(raw) {
  if (!raw || typeof raw !== "object") return null;
  var prenom = texte(raw.prenom);
  var nom = texte(raw.nom);
  if (!prenom && !nom) {
    var parties = separerNom(raw.nomComplet || raw.nom_complet || "");
    prenom = parties.prenom;
    nom = parties.nom;
  }
  var numero = normaliserNumero(raw.numero);
  if (!numero || (!prenom && !nom)) return null;
  var statut = statutDe(numero);
  var categorie = texte(raw.categorie) || CATEGORIES[statut] || "Membre";
  var expiration = versIso(raw.expiration || raw.validite || "");
  var nomComplet = texte([prenom, nom].filter(Boolean).join(" "));
  return {
    prenom: prenom,
    nom: nom,
    nomComplet: nomComplet,
    numero: numero,
    categorie: categorie,
    expiration: expiration,
    validite: phraseValidite(expiration),
    theme: themeDe(numero, categorie)
  };
}

function indexer(liste) {
  var index = new Map();
  var doublons = [];
  (liste || []).forEach(function (raw) {
    var m = normaliserMembre(raw);
    if (!m) return;
    if (index.has(m.numero)) doublons.push(m.numero);
    index.set(m.numero, m);
  });
  return { index: index, doublons: doublons };
}

function chercher(index, numero) {
  var n = normaliserNumero(numero);
  if (!n) return { erreur: "format" };
  var m = index.get(n);
  if (!m) return { erreur: "introuvable" };
  return { membre: m };
}

function cleEntete(entete) {
  var s = sansAccent(entete).replace(/[^a-z0-9]+/g, "");
  var aliases = {
    prenom: "prenom",
    firstname: "prenom",
    givenname: "prenom",
    nom: "nom",
    nomdefamille: "nom",
    lastname: "nom",
    familyname: "nom",
    nomcomplet: "nomComplet",
    fullname: "nomComplet",
    nomprenom: "nomComplet",
    membre: "nomComplet",
    numero: "numero",
    numerodemembre: "numero",
    numeromembre: "numero",
    nodemembre: "numero",
    no: "numero",
    identifiant: "numero",
    categorie: "categorie",
    categoriemembre: "categorie",
    typedadhesion: "categorie",
    typeadhesion: "categorie",
    nomdeladhesion: "categorie",
    adhesiontype: "categorie",
    statut: "categorie",
    expiration: "expiration",
    validite: "expiration",
    validejusquau: "expiration",
    dateexpiration: "expiration",
    datedefin: "expiration",
    datefin: "expiration",
    datefinadhesion: "expiration",
    finadhesion: "expiration",
    echeance: "expiration",
    adhesiondatedefin: "expiration",
    courriel: "courriel",
    email: "courriel",
    mail: "courriel",
    photo: "ignorer",
    photopath: "ignorer",
    portrait: "ignorer"
  };
  return aliases[s] || "";
}

function analyserCsv(texteCsv) {
  var lignes = parseCsv(String(texteCsv || "").replace(/^\uFEFF/, ""));
  if (!lignes.length) return { membres: [], avertissements: ["CSV vide."] };
  var entetes = lignes[0].map(cleEntete);
  var membres = [];
  var avertissements = [];
  for (var i = 1; i < lignes.length; i++) {
    var cellules = lignes[i];
    if (!cellules.some(function (c) { return texte(c); })) continue;
    var brut = {};
    entetes.forEach(function (cle, j) {
      if (!cle || cle === "ignorer") return;
      if (brut[cle] && cle !== "categorie" && cle !== "expiration") return;
      var val = texte(cellules[j]);
      if (val) brut[cle] = val;
    });
    if (brut.nomComplet && !brut.prenom && !brut.nom) {
      var parties = separerNom(brut.nomComplet);
      brut.prenom = parties.prenom;
      brut.nom = parties.nom;
    } else if (!brut.prenom && brut.nom && brut.nom.indexOf(" ") !== -1 && !lignes[0].some(function (h) { return cleEntete(h) === "prenom"; })) {
      var tout = separerNom(brut.nom);
      brut.prenom = tout.prenom;
      brut.nom = tout.nom;
    }
    var m = normaliserMembre(brut);
    if (!m) {
      avertissements.push("Ligne " + (i + 1) + " ignorée : numéro ou nom manquant.");
      continue;
    }
    if (!brut.categorie && !CATEGORIES[statutDe(m.numero)]) {
      avertissements.push("Ligne " + (i + 1) + " : catégorie déduite incomplète pour " + m.numero + ".");
    }
    if (!m.expiration) {
      avertissements.push("Ligne " + (i + 1) + " : pas de date d'expiration pour " + m.numero + ".");
    }
    membres.push({
      prenom: m.prenom,
      nom: m.nom,
      numero: m.numero,
      categorie: m.categorie,
      expiration: m.expiration
    });
  }
  return { membres: membres, avertissements: avertissements };
}

function parseCsv(s) {
  var lignes = [];
  var ligne = [];
  var cellule = "";
  var guillemets = false;
  for (var i = 0; i < s.length; i++) {
    var c = s[i];
    if (guillemets) {
      if (c === '"') {
        if (s[i + 1] === '"') { cellule += '"'; i++; }
        else guillemets = false;
      } else cellule += c;
    } else if (c === '"') {
      guillemets = true;
    } else if (c === ",") {
      ligne.push(cellule);
      cellule = "";
    } else if (c === "\n") {
      ligne.push(cellule);
      lignes.push(ligne);
      ligne = [];
      cellule = "";
    } else if (c !== "\r") {
      cellule += c;
    }
  }
  if (cellule.length || ligne.length) {
    ligne.push(cellule);
    lignes.push(ligne);
  }
  return lignes;
}

module.exports = {
  CATEGORIES: CATEGORIES,
  normaliserNumero: normaliserNumero,
  statutDe: statutDe,
  themeDe: themeDe,
  versIso: versIso,
  formaterDate: formaterDate,
  phraseValidite: phraseValidite,
  normaliserMembre: normaliserMembre,
  indexer: indexer,
  chercher: chercher,
  analyserCsv: analyserCsv
};
