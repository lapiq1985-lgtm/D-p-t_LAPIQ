# Portail LAPIQ

Application web installable (PWA) qui regroupe en un seul endroit les accès des membres de LAPIQ :

En haut de l'écran d'accueil : la **carte de membre officielle**, retrouvée à partir du dossier d'adhésion Yapla.

| Service | Contenu |
|---|---|
| **Mon dossier Yapla** | Adhésion, inscriptions, factures, profil |
| **Microsoft 365** | Outlook, Teams, OneDrive |
| **Campus LAPIQ** (Moodle) | Mes cours, calendrier, notes |
| **Site de LAPIQ** | Site public |

## Fonctionnalités
- **Carte de membre officielle** : le membre indique son numéro `LAPIQ-AASNNN`. Le portail interroge `/api/membre` et affiche la carte du dossier (recto : écusson, nom, numéro, catégorie, validité ; verso : attestation, adresse, code QR vers lapiq.org). Il ne peut plus composer lui-même le nom, la catégorie ou la date. Écusson rouge et bleu pour les membres réguliers ; écusson noir et or, sans date au bandeau, pour les membres à vie (statut `0`). Toucher la carte l'agrandit. La dernière carte retrouvée reste disponible hors ligne.
- Installable sur téléphone (Android : bouton « Installer » ; iPhone : bouton « Installer » qui affiche le guide Partager → « Sur l'écran d'accueil ») et sur ordinateur.
- Bouton « Renouveler » qui apparaît 30 jours avant l'expiration (lien vers l'adhésion Yapla). Les membres à vie ne voient pas ce bouton.
- Services : dossier de membre Yapla, Microsoft 365, Campus, site de LAPIQ, boutique, balado *Le Fall In*; réseaux sociaux et coordonnées en pied de page.
- Bandeau « hors ligne », avis de nouvelle version, bouton « Partager le portail », effacement des données du profil.
- Fonctionne hors ligne pour l'interface (les services eux-mêmes demandent Internet).
- Profil local (prénom + courriel) : le courriel préremplit la connexion Microsoft 365 (`login_hint`). Sinon, `domain_hint` dirige vers la page de connexion de l'organisation.
- Aucun mot de passe n'est stocké : chaque service garde sa propre connexion sécurisée.
- Mode sombre automatique, accessible au clavier.

## Configuration — à faire avant la mise en ligne
Toutes les adresses sont dans **`config.js`**.

Confirmé : site `https://lapiq.org`, Campus `https://campus.lapiq.org`, domaine Microsoft `lapiq.org`.
Chaque membre se connecte à Microsoft 365 **et** au Campus avec son adresse `@lapiq.org` (authentification Microsoft). L'application refuse toute autre adresse dans le profil.

Les liens Yapla, le courriel de soutien (info@lapiq.org), les catégories d'adhésion, la boutique, le balado et les réseaux sociaux proviennent de lapiq.org.

### Carte de membre — export Yapla

Le numéro a la forme `LAPIQ-AASNNN` : `AA` l'année, `S` le statut, `NNN` la séquence.

| S | Statut sur la carte | Écusson |
|---|---|---|
| 0 | Retraité – membre à vie | noir et or |
| 1 | Instructeur ENPQ | rouge et bleu |
| 2 | Enseignant | rouge et bleu |
| 3 | Membre associé | rouge et bleu |
| 4 | Étudiant | rouge et bleu |

Tant qu'aucun export n'est configuré, `/api/membre` sert les fiches **fictives** de `data/membres.exemple.json` (Prénom Nom, `LAPIQ-261001`, etc.). L'écran le signale. Le code postal imprimé sur la carte reste **G4V 1B5**.

Pour brancher les vrais membres, sans les committer :

```bash
node scripts/importer-yapla.js export-yapla.csv --gzip
```

Le script accepte un CSV avec `nom` complet, ou les colonnes séparées d'un export Yapla (`Prénom`, `Nom`, `Numéro de membre`, `Type d'adhésion`, `Date de fin`, `Courriel`). Il écrit :

- `data/membres.json` — lu en local et par `node scripts/servir-local.js`. Ignoré par git. Un déploiement Git **ne l'embarque pas**.
- `data/membres.json.gz.b64` — à coller dans la variable d'environnement Vercel **`LAPIQ_MEMBRES_GZ`** (Production et Aperçu), puis redéployer.

`LAPIQ_MEMBRES` (JSON brut, non compressé) convient pour une courte liste. Vercel limite l'ensemble des variables d'un déploiement à **64 Ko** : préférer la forme gzippée, et ne pas y mettre d'autre gros secret en même temps.

Le courriel éventuellement présent dans l'export n'est pas conservé. La réponse de l'API ne contient que le prénom, le nom, le numéro, la catégorie, la date et le thème de la carte.

Connaître un numéro suffit à afficher la carte correspondante. Ce n'est pas une connexion : ne pas exposer d'autres champs du dossier Yapla dans cet export.

## Connexion
- **Microsoft 365 :** adresse `@lapiq.org` (Instructeur, Enseignant, Étudiant). L'adresse saisie dans le profil est transmise à Microsoft (`login_hint`) pour éviter de la retaper.
- **Campus :** `campus.lapiq.org` redirige vers `lapiq.moodlecloud.com` (MoodleCloud). La page de connexion demande un nom d'utilisateur ou courriel et un mot de passe ; elle n'offre pas de bouton Microsoft. Les liens directs du portail visent donc `lapiq.moodlecloud.com`.
- **Yapla :** compte membre Yapla distinct. La carte affichée ici est celle du dossier d'adhésion (export), pas une page HTML Yapla.

## Identité visuelle
Couleurs tirées du logo : marine `#0b1c48`, rouge `#d21f30`, blanc (définies en tête de `styles.css`).
Logos dans `icons/` : `logo-lapiq.png` (association) et `logo-campus.png` (Campus). Les icônes d'application (`icon-*.png`, `apple-touch-icon.png`, `favicon.png`) sont générées à partir du logo de l'association.

## Composants tiers
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 1.4.4 (licence MIT), chargé depuis jsDelivr avec vérification d'intégrité (SRI) et mis en cache par l'application pour fonctionner hors ligne.

## Tester localement
```bash
node --test lib/membres.test.js
node scripts/servir-local.js
# puis ouvrir http://localhost:8080
# fiches fictives : LAPIQ-261001 (instructeur), LAPIQ-260001 (à vie)
```

`python3 -m http.server` sert les pages, mais pas `/api/membre`. Utiliser `scripts/servir-local.js` pour la carte.

## Mise en ligne
Ce sont des fichiers statiques : GitHub Pages, Vercel, Netlify ou l'hébergement du site de LAPIQ (ex. `portail.lapiq.org`). HTTPS est requis pour l'installation en PWA.
