/*
 * Configuration du portail LAPIQ
 * ------------------------------------------------------------
 * Modifiez uniquement ce fichier pour adapter les liens et les textes.
 * Source des liens : https://lapiq.org (novembre 2026).
 */
window.LAPIQ_CONFIG = {
  organisation: "LAPIQ",
  nomComplet: "L'Association des pompiers instructeurs du Québec",
  sousTitre: "Portail des membres",
  logo: "icons/logo-lapiq.png",

  // Les membres Instructeur, Enseignant et Étudiant reçoivent une adresse @lapiq.org
  // (Microsoft 365). La même adresse sert d'identifiant sur le Campus (Moodle).
  domaineM365: "lapiq.org",

  courrielSoutien: "info@lapiq.org",
  // Lien « Signaler un problème » du Campus (repris de lapiq.org/contact)
  courrielCampus: "mailto:info@lapiq.org?subject=Acc%C3%A8s%20au%20Campus%20LAPIQ",
  courrielAdhesion: "mailto:info@lapiq.org?subject=Question%20sur%20mon%20adh%C3%A9sion",
  confidentialite: "https://lapiq.org/confidentialite/",
  adresse: "6, 1re Avenue Ouest, Sainte-Anne-des-Monts (Québec) G4V 1B5",

  // Espace membres Yapla
  yapla: {
    connexion: "https://lapiq.s1.yapla.com/fr/espace-membres/authentication/",
    adhesion: "https://lapiq.s1.yapla.com/fr/espace-membres/adhesion/"
  },

  // Carte de membre officielle, produite à partir de l'export Yapla.
  // Le membre ne saisit pas ces textes : ils sont fixes, comme sur la carte imprimée.
  // Le code postal G4V 1B5 est celui de LAPIQ (à conserver).
  carteMembre: {
    titre: "Carte de membre",
    joursAvertissement: 30, // affiche « expire bientôt » sous ce seuil
    sousTitre: "Association des pompiers instructeurs du Québec",
    attestation: "Cette carte atteste que son titulaire est membre en règle de LAPIQ. Elle demeure la propriété de l\u2019Association.",
    adresse: ["6, 1re Avenue Ouest", "Sainte-Anne-des-Monts (Québec) G4V 1B5"],
    devise: "Ceux qui forment les pompiers du Québec · Depuis 1985",
    qr: "https://lapiq.org",
    ecusson: "icons/ecusson-rouge-bleu.png",
    ecussonOr: "icons/ecusson-noir-or.png"
  },

  services: [
    {
      id: "yapla",
      nom: "Mon dossier de membre",
      description: "Adhésion, renouvellement, paiements et profil (espace membres Yapla).",
      couleur: "#d21f30",
      icone: "yapla",
      url: "https://lapiq.s1.yapla.com/fr/espace-membres/authentication/",
      liens: [
        { nom: "Se connecter", url: "https://lapiq.s1.yapla.com/fr/espace-membres/authentication/" },
        { nom: "Adhérer ou renouveler", url: "https://lapiq.s1.yapla.com/fr/espace-membres/adhesion/" },
        { nom: "Catégories et tarifs", url: "https://lapiq.org/devenir-membre/" }
      ]
    },
    {
      id: "m365",
      nom: "Microsoft 365",
      description: "Courriel, Teams, OneDrive — avec votre adresse @lapiq.org.",
      couleur: "#0b1c48",
      icone: "m365",
      url: "https://www.office.com/?auth=2",
      m365: true, // ajoute automatiquement domain_hint / login_hint
      liens: [
        { nom: "Outlook", url: "https://outlook.office.com/mail/", m365: true },
        { nom: "Teams", url: "https://teams.microsoft.com/", m365: true },
        { nom: "OneDrive", url: "https://www.office.com/launch/onedrive", m365: true }
      ]
    },
    {
      id: "campus",
      nom: "Campus LAPIQ",
      description: "Vos formations en ligne (connexion avec votre adresse @lapiq.org).",
      couleur: "#0b1c48",
      icone: "campus",
      logo: "icons/logo-campus.png",
      // campus.lapiq.org redirige vers lapiq.moodlecloud.com (Moodle hébergé par MoodleCloud) ;
      // les liens directs doivent donc viser lapiq.moodlecloud.com.
      url: "https://lapiq.moodlecloud.com/my/courses.php",
      liens: [
        { nom: "Mes cours", url: "https://lapiq.moodlecloud.com/my/courses.php" },
        { nom: "Calendrier", url: "https://lapiq.moodlecloud.com/calendar/view.php" },
        { nom: "Mes notes", url: "https://lapiq.moodlecloud.com/grade/report/overview/index.php" },
        { nom: "Appli Moodle", url: "https://download.moodle.org/mobile/" },
        { nom: "Signaler un problème", url: "mailto:info@lapiq.org?subject=Acc%C3%A8s%20au%20Campus%20LAPIQ" }
      ]
    },
    {
      id: "site",
      nom: "Site de LAPIQ",
      description: "Actualités, ressources pédagogiques et formations.",
      couleur: "#d21f30",
      icone: "site",
      logo: "icons/logo-lapiq.png",
      url: "https://lapiq.org/",
      liens: [
        { nom: "Actualités", url: "https://lapiq.org/actualites/" },
        { nom: "Ressources", url: "https://lapiq.org/actualites/#ressources" },
        { nom: "Formation", url: "https://lapiq.org/formation/" },
        { nom: "Contact", url: "https://lapiq.org/contact/" }
      ]
    },
    {
      id: "boutique",
      nom: "Boutique LAPIQ",
      description: "Articles et produits de l'association.",
      couleur: "#0b1c48",
      icone: "boutique",
      url: "https://store.lapiq.org/",
      liens: []
    }
  ],


  // Les deux balados ont chacun leur jaquette et leur page Spotify.
  // Le Fall-in (analyses de fond) et Caserne 85 — Astuces (trucs courts pour la caserne).
  podcasts: {
    titre: "Podcasts LAPIQ",
    intro: "Deux séries pour approfondir la formation et glaner des trucs d’instructeurs.",
    emissions: [
      {
        id: "fall-in",
        nom: "Le Fall-in",
        sousTitre: "Podcast LAPIQ · Élever la formation",
        description: "Podcast de L’Association des pompiers instructeurs du Québec. Des instructeurs parlent formation, terrain, normes et jugement.",
        image: "images/caserne85-fall-in.webp",
        imageRepli: "images/caserne85-fall-in.jpg",
        url: "https://open.spotify.com/show/0FVQP3AETS2w5Bj4pL5IGN",
        embed: "https://open.spotify.com/embed/show/0FVQP3AETS2w5Bj4pL5IGN",
        liens: [
          { nom: "Spotify", url: "https://open.spotify.com/show/0FVQP3AETS2w5Bj4pL5IGN" },
          { nom: "Apple Podcasts", url: "https://podcasts.apple.com/us/podcast/le-fall-in/id6809077124" }
        ]
      },
      {
        id: "astuces",
        nom: "Caserne 85 — Astuces pour instructeurs",
        sousTitre: "Trucs pour instructeurs · LAPIQ",
        description: "Des petits vidéos et des animations pour agrémenter vos formations et pratiques en caserne.",
        image: "images/caserne85-astuces.webp",
        imageRepli: "images/caserne85-astuces.jpg",
        url: "https://open.spotify.com/show/3OOHBVdseJBelg9FoF28Ta",
        embed: "https://open.spotify.com/embed/show/3OOHBVdseJBelg9FoF28Ta",
        liens: [
          { nom: "Spotify", url: "https://open.spotify.com/show/3OOHBVdseJBelg9FoF28Ta" }
        ]
      }
    ]
  },

  // Lien d’invitation fourni par Simon (27 nov. 2026). Le groupe est privé ;
  // Facebook n’en affiche pas le nom sans connexion. Bouton volontairement explicite.
  groupeFacebook: {
    nom: "Groupe Facebook",
    description: "Groupe privé de discussion pour échanger sur la formation, réservé aux membres et Followers de LAPIQ.",
    bouton: "Rejoindre le groupe Facebook",
    url: "https://www.facebook.com/share/g/1EBSbuKUXz/?mibextid=wwXIfr"
  },

  reseaux: [
    { nom: "Facebook", url: "https://www.facebook.com/LAPIQ" },
    { nom: "LinkedIn", url: "https://www.linkedin.com/company/lapiq" },
    { nom: "X", url: "https://x.com/LAPIQ_1985" }
  ]
};
