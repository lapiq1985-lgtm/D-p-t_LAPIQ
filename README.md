# Portail LAPIQ

Application web installable (PWA) qui regroupe en un seul endroit les accès des membres de LAPIQ :

En haut de l'écran d'accueil : la **carte de membre** du membre.

| Service | Contenu |
|---|---|
| **Mon dossier Yapla** | Adhésion, inscriptions, factures, profil |
| **Microsoft 365** | Outlook, Teams, OneDrive |
| **Campus LAPIQ** (Moodle) | Mes cours, calendrier, notes |
| **Site de LAPIQ** | Site public |

## Fonctionnalités
- **Carte de membre** : reproduit le modèle officiel de la carte Yapla (recto : logo, nom, numéro, catégorie, validité ; verso : attestation, adresse, code QR vers lapiq.org). Statut (Valide / Expire bientôt / Expirée) affiché sous la carte. Toucher la carte l'agrandit (recto et verso). Disponible hors ligne, avec un lien vers la carte officielle dans Yapla.
- Installable sur téléphone (Android : bouton « Installer » ; iPhone : bouton « Installer » qui affiche le guide Partager → « Sur l'écran d'accueil ») et sur ordinateur.
- Bouton « Renouveler » qui apparaît 30 jours avant l'expiration de la carte (lien vers l'adhésion Yapla) ; date d'expiration suggérée selon la catégorie.
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

Reste à préciser :
- l'adresse exacte de la page de la **carte de membre** dans Yapla (`carteMembre.urlOfficielle` pointe pour l'instant vers la connexion à l'espace membres) ;
- si possible, `carteMembre.urlVerification` (page publique de vérification d'un numéro de membre).

### À propos de la carte de membre
Pour l'instant, le membre recopie lui-même les informations de sa carte Yapla dans « Mon profil ». Elles restent sur son appareil.
Cette carte n'est donc **pas une preuve d'adhésion vérifiée**. Pour la rendre vérifiable, il y a deux options :
1. une page de vérification publique (ex. `https://www.lapiq.org/verifier?no=`) indiquée dans `urlVerification` : le code QR y mène directement ;
2. une synchronisation automatique avec Yapla (nécessite un accès API ou un export fourni par Yapla, et un petit serveur).

## Connexion
- **Microsoft 365 :** adresse `@lapiq.org` (Instructeur, Enseignant, Étudiant). L'adresse saisie dans le profil est transmise à Microsoft (`login_hint`) pour éviter de la retaper.
- **Campus :** `campus.lapiq.org` redirige vers `lapiq.moodlecloud.com` (MoodleCloud). La page de connexion demande un nom d'utilisateur ou courriel et un mot de passe ; elle n'offre pas de bouton Microsoft. Les liens directs du portail visent donc `lapiq.moodlecloud.com`.
- **Yapla :** compte membre Yapla distinct. La carte de membre officielle est une page HTML personnalisée dans Yapla ; l'application y renvoie par le bouton « Afficher ma carte officielle (Yapla) ».

## Identité visuelle
Couleurs tirées du logo : marine `#0b1c48`, rouge `#d21f30`, blanc (définies en tête de `styles.css`).
Logos dans `icons/` : `logo-lapiq.png` (association) et `logo-campus.png` (Campus). Les icônes d'application (`icon-*.png`, `apple-touch-icon.png`, `favicon.png`) sont générées à partir du logo de l'association.

## Composants tiers
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 1.4.4 (licence MIT), chargé depuis jsDelivr avec vérification d'intégrité (SRI) et mis en cache par l'application pour fonctionner hors ligne.

## Tester localement
```bash
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

## Mise en ligne
Ce sont des fichiers statiques : GitHub Pages, Vercel, Netlify ou l'hébergement du site de LAPIQ (ex. `portail.lapiq.org`). HTTPS est requis pour l'installation en PWA.

## Carte Apple Wallet (à activer)
Le bouton « Ajouter à Apple Wallet » apparaît sur iPhone, iPad et Mac **uniquement quand la fonction serveur est configurée**. Sans configuration, il reste caché et le portail fonctionne comme avant.

- Fonction : `api/wallet.js` (Vercel, Node) — génère et **signe** une carte `.pkpass` (même contenu que la carte de membre : nom, numéro, catégorie, validité, code QR vers lapiq.org). La carte devient grisée dans Wallet après sa date d'expiration.
- Images de la carte : `api/_wallet/` (logo LAPIQ).
- Dépendance : `passkit-generator` (voir `package.json`).

### Prérequis (une seule fois)
1. Compte **Apple Developer** au nom de LAPIQ (99 $ US/an ; numéro D-U-N-S requis pour un organisme).
2. Dans Certificates, Identifiers & Profiles : créer un **Pass Type ID** (ex. `pass.org.lapiq.carte`) et son **certificat**, puis l'exporter depuis le Trousseau en `.p12`.
3. Télécharger le certificat intermédiaire **Apple WWDR G4** (`AppleWWDRCAG4.cer`).
4. Convertir en PEM :
   ```bash
   openssl pkcs12 -in certificat.p12 -clcerts -nokeys -out signer.pem -legacy
   openssl pkcs12 -in certificat.p12 -nocerts -out signer.key -legacy   # choisir un mot de passe
   openssl x509 -inform DER -in AppleWWDRCAG4.cer -out wwdr.pem
   ```
5. Dans Vercel (projet du portail → Settings → Environment Variables), ajouter :
   `WALLET_PASS_TYPE_ID`, `WALLET_TEAM_ID`, `WALLET_SIGNER_CERT` (contenu de signer.pem), `WALLET_SIGNER_KEY` (contenu de signer.key), `WALLET_SIGNER_KEY_PASSPHRASE`, `WALLET_WWDR` (contenu de wwdr.pem). Le contenu PEM peut aussi être collé encodé en base64.
6. Redéployer. Le bouton apparaît alors automatiquement.

**Important :** les informations de la carte sont saisies par le membre ; la carte Wallet le mentionne au verso. Pour une carte réellement vérifiée, il faudrait que la fonction lise les données dans Yapla.
