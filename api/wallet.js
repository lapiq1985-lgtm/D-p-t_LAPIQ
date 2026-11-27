/*
 * Carte de membre LAPIQ pour Apple Wallet (.pkpass)
 * ------------------------------------------------------------
 * Fonction serveur Vercel : génère et SIGNE une carte Apple Wallet à partir
 * des informations de la carte de membre (même contenu que la carte Yapla).
 *
 *   GET  /api/wallet?etat=1   -> { pret: true|false }  (le portail affiche le bouton si pret)
 *   POST /api/wallet          -> fichier .pkpass (champs : nom, numero, categorie, expiration)
 *
 * Variables d'environnement à définir dans Vercel (voir README, section Apple Wallet) :
 *   WALLET_PASS_TYPE_ID            ex. pass.org.lapiq.carte
 *   WALLET_TEAM_ID                 identifiant d'équipe Apple Developer (10 caractères)
 *   WALLET_SIGNER_CERT             certificat du Pass Type ID (PEM, ou PEM encodé en base64)
 *   WALLET_SIGNER_KEY              clé privée du certificat (PEM, ou base64)
 *   WALLET_SIGNER_KEY_PASSPHRASE   mot de passe de la clé (facultatif)
 *   WALLET_WWDR                    certificat intermédiaire Apple WWDR G4 (PEM, ou base64)
 */
const fs = require("fs");
const path = require("path");
const { PKPass } = require("passkit-generator");

const IMAGES = [
  "icon.png", "icon@2x.png", "icon@3x.png",
  "logo.png", "logo@2x.png", "logo@3x.png",
  "thumbnail.png", "thumbnail@2x.png", "thumbnail@3x.png"
];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
  "août", "septembre", "octobre", "novembre", "décembre"];

// Accepte un PEM collé tel quel ou encodé en base64 (plus simple dans Vercel).
function pem(nom) {
  const v = (process.env[nom] || "").trim();
  if (!v) return "";
  if (v.includes("-----BEGIN")) return v.replace(/\\n/g, "\n");
  return Buffer.from(v, "base64").toString("utf8");
}

function configuration() {
  const c = {
    passTypeIdentifier: (process.env.WALLET_PASS_TYPE_ID || "").trim(),
    teamIdentifier: (process.env.WALLET_TEAM_ID || "").trim(),
    signerCert: pem("WALLET_SIGNER_CERT"),
    signerKey: pem("WALLET_SIGNER_KEY"),
    signerKeyPassphrase: process.env.WALLET_SIGNER_KEY_PASSPHRASE || undefined,
    wwdr: pem("WALLET_WWDR")
  };
  c.pret = !!(c.passTypeIdentifier && c.teamIdentifier && c.signerCert && c.signerKey && c.wwdr);
  return c;
}

function texte(v, max) {
  return String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

// Valide et nettoie les informations reçues du portail.
function lireMembre(src) {
  const m = {
    nom: texte(src.nom, 60),
    numero: texte(src.numero, 24).toUpperCase(),
    categorie: texte(src.categorie, 40),
    expiration: texte(src.expiration, 10)
  };
  const erreurs = [];
  if (!m.nom) erreurs.push("nom manquant");
  if (!/^[A-Z0-9][A-Z0-9-]{2,23}$/.test(m.numero)) erreurs.push("numéro de membre invalide");
  if (m.expiration && !/^\d{4}-\d{2}-\d{2}$/.test(m.expiration)) erreurs.push("date d'expiration invalide");
  return { m, erreurs };
}

function dateFr(iso) {
  const [a, mo, j] = iso.split("-").map(Number);
  return j + " " + MOIS[mo - 1] + " " + a;
}

function passJson(c, m) {
  const p = {
    formatVersion: 1,
    passTypeIdentifier: c.passTypeIdentifier,
    teamIdentifier: c.teamIdentifier,
    serialNumber: m.numero,
    organizationName: "LAPIQ",
    description: "Carte de membre LAPIQ",
    logoText: "LAPIQ",
    // Couleurs du modèle officiel de la carte (#2d314b, #da3441)
    backgroundColor: "rgb(45, 49, 75)",
    foregroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(218, 52, 65)",
    sharingProhibited: true,
    barcodes: [{
      format: "PKBarcodeFormatQR",
      message: "https://lapiq.org",
      messageEncoding: "iso-8859-1",
      altText: "N° " + m.numero
    }],
    generic: {
      headerFields: [{ key: "type", label: "CARTE DE MEMBRE", value: "LAPIQ" }],
      primaryFields: [{ key: "nom", label: "MEMBRE", value: m.nom }],
      secondaryFields: [
        { key: "numero", label: "N°", value: m.numero },
        { key: "categorie", label: "CATÉGORIE", value: m.categorie || "—" }
      ],
      auxiliaryFields: m.expiration
        ? [{ key: "valide", label: "VALIDE JUSQU’AU", value: dateFr(m.expiration) }]
        : [],
      backFields: [
        { key: "attestation", label: "LAPIQ — Association des pompiers instructeurs du Québec",
          value: "Cette carte atteste que son titulaire est membre en règle de LAPIQ. Elle demeure la propriété de l’Association." },
        { key: "source", label: "Information",
          value: "Carte générée à partir des informations saisies dans le portail des membres. La carte officielle se trouve dans l’espace membres Yapla." },
        { key: "adresse", label: "Adresse",
          value: "6, 1re Avenue Ouest\nSainte-Anne-des-Monts (Québec) G4V 1B5" },
        { key: "site", label: "Site Web", value: "https://lapiq.org" },
        { key: "portail", label: "Portail des membres", value: "https://portail.lapiq.org" },
        { key: "courriel", label: "Courriel", value: "info@lapiq.org" }
      ]
    }
  };
  // La carte devient grisée dans Wallet après la date d'expiration (fin de journée, heure de l'Est).
  if (m.expiration) p.expirationDate = m.expiration + "T23:59:59-05:00";
  return p;
}

function genererCarte(c, m) {
  const fichiers = { "pass.json": Buffer.from(JSON.stringify(passJson(c, m))) };
  for (const f of IMAGES) fichiers[f] = fs.readFileSync(path.join(__dirname, "_wallet", f));
  const pass = new PKPass(fichiers, {
    wwdr: c.wwdr,
    signerCert: c.signerCert,
    signerKey: c.signerKey,
    signerKeyPassphrase: c.signerKeyPassphrase
  });
  return pass.getAsBuffer();
}

module.exports = async function handler(req, res) {
  const c = configuration();
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET" && req.query && req.query.etat !== undefined) {
    return res.status(200).json({ pret: c.pret });
  }
  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ erreur: "Méthode non permise" });
  }
  if (!c.pret) {
    return res.status(503).json({ erreur: "Apple Wallet n'est pas encore configuré pour le portail LAPIQ." });
  }

  const source = req.method === "POST" ? (req.body || {}) : (req.query || {});
  const { m, erreurs } = lireMembre(typeof source === "string" ? Object.fromEntries(new URLSearchParams(source)) : source);
  if (erreurs.length) return res.status(400).json({ erreur: erreurs.join(", ") });

  try {
    const fichier = genererCarte(c, m);
    res.setHeader("Content-Type", "application/vnd.apple.pkpass");
    res.setHeader("Content-Disposition", 'attachment; filename="carte-lapiq.pkpass"');
    return res.status(200).send(fichier);
  } catch (e) {
    console.error("wallet: échec de la génération", e && e.message);
    return res.status(500).json({ erreur: "La carte Wallet n'a pas pu être générée." });
  }
};

// Exposé pour les tests locaux
module.exports._interne = { lireMembre, passJson, genererCarte, configuration };
