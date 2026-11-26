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
- **Carte de membre** : nom, photo, numéro, catégorie, date d'expiration, statut (Valide / Expire bientôt / Expirée) et code QR. Toucher la carte l'agrandit pour la présenter. Elle reste disponible hors ligne, avec un lien vers la carte officielle dans Yapla.
- Installable sur téléphone (Android : bouton « Installer » ; iPhone : Partager → « Sur l'écran d'accueil ») et sur ordinateur.
- Fonctionne hors ligne pour l'interface (les services eux-mêmes demandent Internet).
- Profil local (prénom + courriel) : le courriel préremplit la connexion Microsoft 365 (`login_hint`). Sinon, `domain_hint` dirige vers la page de connexion de l'organisation.
- Aucun mot de passe n'est stocké : chaque service garde sa propre connexion sécurisée.
- Mode sombre automatique, accessible au clavier.

## Configuration — à faire avant la mise en ligne
Toutes les adresses sont dans **`config.js`**. Les valeurs marquées `À CONFIRMER` sont des suppositions :
- l'adresse du portail membre Yapla de LAPIQ ;
- l'adresse du Campus Moodle (ex. `https://campus.lapiq.org`) ;
- l'adresse du site de LAPIQ ;
- le domaine Microsoft 365 et le courriel de soutien ;
- `carteMembre.urlOfficielle` (carte dans Yapla) et, si possible, `carteMembre.urlVerification`.

### À propos de la carte de membre
Pour l'instant, le membre recopie lui-même les informations de sa carte Yapla dans « Mon profil ». Elles restent sur son appareil.
Cette carte n'est donc **pas une preuve d'adhésion vérifiée**. Pour la rendre vérifiable, il y a deux options :
1. une page de vérification publique (ex. `https://www.lapiq.org/verifier?no=`) indiquée dans `urlVerification` : le code QR y mène directement ;
2. une synchronisation automatique avec Yapla (nécessite un accès API ou un export fourni par Yapla, et un petit serveur).

## Connexion unique (recommandé)
Pour qu'une seule connexion Microsoft donne accès au Campus, activer dans Moodle :
*Administration du site → Serveur → Services OAuth 2 → Microsoft*, puis le plugin d'authentification **OAuth 2**.
Yapla utilise son propre compte membre.

## Composants tiers
- `vendor/qrcode.js` : [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 1.4.4 (licence MIT), inclus localement pour fonctionner hors ligne.

## Tester localement
```bash
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

## Mise en ligne
Ce sont des fichiers statiques : GitHub Pages, Vercel, Netlify ou l'hébergement du site de LAPIQ (ex. `portail.lapiq.org`). HTTPS est requis pour l'installation en PWA.
