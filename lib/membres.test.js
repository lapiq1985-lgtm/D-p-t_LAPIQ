"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var zlib = require("zlib");
var lib = require("./membres");
var handler = require("../api/membre");

test("normalise le numéro LAPIQ-AASNNN", function () {
  assert.equal(lib.normaliserNumero("lapiq-261001"), "LAPIQ-261001");
  assert.equal(lib.normaliserNumero("261001"), "LAPIQ-261001");
  assert.equal(lib.normaliserNumero("LAPIQ261001"), "LAPIQ-261001");
  assert.equal(lib.normaliserNumero("  lapiq - 261001 "), "LAPIQ-261001");
  assert.equal(lib.normaliserNumero("LAPIQ-26100"), "");
  assert.equal(lib.normaliserNumero("ABC-261001"), "");
});

test("le statut 0 donne le thème or, les autres le thème standard", function () {
  assert.equal(lib.themeDe("LAPIQ-260001", "Retraité – membre à vie"), "or");
  assert.equal(lib.themeDe("LAPIQ-261001", "Instructeur ENPQ"), "standard");
  assert.equal(lib.themeDe("LAPIQ-262015", "Enseignant"), "standard");
  assert.equal(lib.themeDe("LAPIQ-263008", "Membre associé"), "standard");
  assert.equal(lib.themeDe("LAPIQ-264004", "Étudiant"), "standard");
  assert.equal(lib.themeDe("LAPIQ-269999", "membre à vie"), "or");
});

test("catégorie déduite du chiffre de statut si l'export ne la donne pas", function () {
  var m = lib.normaliserMembre({ prenom: "Alex", nom: "Roy", numero: "LAPIQ-264004" });
  assert.equal(m.categorie, "Étudiant");
  assert.equal(m.theme, "standard");
  assert.equal(m.nomComplet, "Alex Roy");
});

test("forme la mention de validité en français", function () {
  assert.equal(lib.versIso("31/12/2027"), "2027-12-31");
  assert.equal(lib.versIso("2027-12-31 00:00:00"), "2027-12-31");
  assert.equal(lib.versIso("Valide jusqu’au 31 décembre 2027"), "2027-12-31");
  assert.equal(lib.phraseValidite("2027-12-31"), "Valide jusqu\u2019au 31 décembre 2027");
});

test("le courriel de l'export n'entre pas dans la fiche", function () {
  var m = lib.normaliserMembre({
    prenom: "Jean",
    nom: "Dupont",
    numero: "LAPIQ-262015",
    categorie: "Enseignant",
    expiration: "2027-12-31",
    courriel: "jean.dupont@example.com"
  });
  assert.equal(m.courriel, undefined);
  assert.equal(JSON.stringify(m).indexOf("example.com"), -1);
});

test("lit le CSV modèle (noms fictifs)", function () {
  var csv = fs.readFileSync(path.join(__dirname, "..", "data", "modele_membres.csv"), "utf8");
  var resultat = lib.analyserCsv(csv);
  assert.equal(resultat.membres.length, 4);
  assert.equal(resultat.membres[0].prenom, "Prénom");
  assert.equal(resultat.membres[0].nom, "Nom");
  assert.equal(resultat.membres[0].numero, "LAPIQ-261001");
  assert.equal(resultat.membres[0].expiration, "2027-12-31");
  assert.equal(resultat.membres[1].prenom, "Marie-Christine");
  assert.equal(resultat.membres[1].nom, "Tremblay-Desjardins");
  assert.equal(resultat.membres[1].categorie, "Retraité – membre à vie");
  var idx = lib.indexer(resultat.membres);
  assert.equal(lib.chercher(idx.index, "260001").membre.theme, "or");
  assert.equal(lib.chercher(idx.index, "LAPIQ-999999").erreur, "introuvable");
});

test("accepte les colonnes séparées d'un export Yapla", function () {
  var csv = [
    "Prénom,Nom,Courriel,Numéro de membre,Type d'adhésion,Date de fin",
    "Sam,Bélanger,sam@example.com,LAPIQ-264002,Étudiant,31/08/2027"
  ].join("\n");
  var resultat = lib.analyserCsv(csv);
  assert.equal(resultat.membres.length, 1);
  assert.deepEqual(resultat.membres[0], {
    prenom: "Sam",
    nom: "Bélanger",
    numero: "LAPIQ-264002",
    categorie: "Étudiant",
    expiration: "2027-08-31"
  });
});

function fauxRes() {
  return {
    code: 200,
    headers: {},
    corps: null,
    setHeader: function (k, v) { this.headers[k] = v; },
    status: function (c) { this.code = c; return this; },
    json: function (o) { this.corps = o; }
  };
}

test("l'API sert une fiche d'exemple et refuse un numéro inconnu", async function () {
  delete process.env.LAPIQ_MEMBRES;
  delete process.env.LAPIQ_MEMBRES_GZ;
  handler.reinitialiser();
  var res = fauxRes();
  handler({ method: "GET", query: { numero: "LAPIQ-261001" }, url: "/api/membre?numero=LAPIQ-261001" }, res);
  assert.equal(res.code, 200);
  assert.equal(res.corps.source, "exemple");
  assert.equal(res.corps.membre.nomComplet, "Prénom Nom");
  assert.equal(res.corps.membre.categorie, "Instructeur ENPQ");
  assert.equal(res.corps.membre.theme, "standard");
  assert.equal(res.corps.membre.validite, "Valide jusqu\u2019au 31 décembre 2027");

  var or = fauxRes();
  handler({ method: "GET", query: { numero: "LAPIQ-260001" }, url: "/api/membre?numero=LAPIQ-260001" }, or);
  assert.equal(or.corps.membre.theme, "or");

  var inconnu = fauxRes();
  handler({ method: "GET", query: { numero: "LAPIQ-261999" }, url: "/api/membre?numero=LAPIQ-261999" }, inconnu);
  assert.equal(inconnu.code, 404);

  var liste = fauxRes();
  handler({ method: "GET", query: {}, url: "/api/membre" }, liste);
  assert.equal(liste.code, 200);
  assert.equal(liste.corps.exemples.length, 4);
  handler.reinitialiser();
});

test("l'API préfère la variable d'environnement et n'énumère pas les vrais membres", function () {
  process.env.LAPIQ_MEMBRES = JSON.stringify([
    { prenom: "Camille", nom: "Test", numero: "LAPIQ-263001", categorie: "Membre associé", expiration: "2027-04-30", courriel: "camille@example.com" }
  ]);
  handler.reinitialiser();
  var res = fauxRes();
  handler({ method: "GET", query: { numero: "LAPIQ-263001" }, url: "/api/membre?numero=LAPIQ-263001" }, res);
  assert.equal(res.corps.source, "environnement");
  assert.equal(res.corps.membre.nomComplet, "Camille Test");
  assert.equal(JSON.stringify(res.corps).indexOf("example.com"), -1);
  var liste = fauxRes();
  handler({ method: "GET", query: {}, url: "/api/membre" }, liste);
  assert.equal(liste.code, 400);
  delete process.env.LAPIQ_MEMBRES;
  handler.reinitialiser();
});

test("l'API lit aussi le JSON gzippé", function () {
  var json = JSON.stringify([
    { prenom: "Camille", nom: "Test", numero: "LAPIQ-261002", expiration: "2027-12-31" }
  ]);
  process.env.LAPIQ_MEMBRES_GZ = zlib.gzipSync(Buffer.from(json)).toString("base64");
  handler.reinitialiser();
  var res = fauxRes();
  handler({ method: "GET", query: { numero: "261002" }, url: "/api/membre?numero=261002" }, res);
  assert.equal(res.code, 200);
  assert.equal(res.corps.membre.categorie, "Instructeur ENPQ");
  delete process.env.LAPIQ_MEMBRES_GZ;
  handler.reinitialiser();
});
