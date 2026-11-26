/*
 * Configuration du portail LAPIQ
 * ------------------------------------------------------------
 * Modifiez uniquement ce fichier pour adapter les liens.
 * Les valeurs marquées « À CONFIRMER » doivent être validées
 * par l'administration de LAPIQ avant la mise en ligne.
 */
window.LAPIQ_CONFIG = {
  organisation: "LAPIQ",
  sousTitre: "Votre portail d'accès",

  // Domaine Microsoft 365 de l'organisation (sert à envoyer
  // directement l'utilisateur vers la bonne page de connexion).
  domaineM365: "lapiq.org", // À CONFIRMER

  courrielSoutien: "", // ex. "soutien@lapiq.org" — À CONFIRMER

  // Carte de membre affichée dans l'application
  carteMembre: {
    titre: "Carte de membre",
    // Lien vers la carte officielle dans le portail membre Yapla
    urlOfficielle: "https://lapiq.s1.yapla.com/fr/espace-membre/", // À CONFIRMER
    // Si LAPIQ dispose d'une page de vérification, le code QR pointera vers
    // cette adresse suivie du numéro de membre (ex. "https://www.lapiq.org/verifier?no=").
    // Laisser vide : le code QR contient alors le nom, le numéro et la date d'expiration.
    urlVerification: "",
    joursAvertissement: 30 // affiche « expire bientôt » sous ce seuil
  },

  services: [
    {
      id: "yapla",
      nom: "Mon dossier Yapla",
      description: "Adhésion, inscriptions, factures et profil de membre.",
      couleur: "#2f7d6d",
      icone: "yapla",
      url: "https://lapiq.s1.yapla.com/fr/espace-membre/", // À CONFIRMER
      liens: [
        { nom: "Mon profil", url: "https://lapiq.s1.yapla.com/fr/espace-membre/" },
        { nom: "Mes factures", url: "https://lapiq.s1.yapla.com/fr/espace-membre/" }
      ]
    },
    {
      id: "m365",
      nom: "Microsoft 365",
      description: "Courriel, Teams, OneDrive et documents partagés.",
      couleur: "#2b5fb3",
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
      description: "Vos formations en ligne sur Moodle.",
      couleur: "#b3412b",
      icone: "campus",
      url: "https://campus.lapiq.org/login/index.php", // À CONFIRMER
      liens: [
        { nom: "Mes cours", url: "https://campus.lapiq.org/my/courses.php" },
        { nom: "Calendrier", url: "https://campus.lapiq.org/calendar/view.php" },
        { nom: "Mes notes", url: "https://campus.lapiq.org/grade/report/overview/index.php" }
      ]
    },
    {
      id: "site",
      nom: "Site de LAPIQ",
      description: "Nouvelles, formations offertes et informations.",
      couleur: "#6b4fa3",
      icone: "site",
      url: "https://www.lapiq.org/", // À CONFIRMER
      liens: []
    }
  ]
};
