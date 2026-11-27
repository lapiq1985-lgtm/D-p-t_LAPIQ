(function () {
  "use strict";
  var cfg = window.LAPIQ_CONFIG;
  var cfgCarte = cfg.carteMembre || {};
  var CLE = "lapiq-profil";
  var CLE_CARTE = "lapiq-carte";

  var ICONES = {
    yapla: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17c.6-2 2-3 3.5-3s2.9 1 3.5 3M14 9h4M14 13h4"/></svg>',
    m365: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>',
    campus: '<svg viewBox="0 0 24 24"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6"/></svg>',
    boutique: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    balado: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg>',
    site: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"/></svg>'
  };

  /* ---------- Stockage local ---------- */
  function lireProfil() {
    try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { return {}; }
  }
  function ecrireProfil(p) {
    try { localStorage.setItem(CLE, JSON.stringify(p)); return true; }
    catch (e) { return false; }
  }
  function lireCarte() {
    try { return JSON.parse(localStorage.getItem(CLE_CARTE)) || null; } catch (e) { return null; }
  }
  function ecrireCarte(c) {
    try { localStorage.setItem(CLE_CARTE, JSON.stringify(c)); return true; }
    catch (e) { return false; }
  }
  function effacerCarte() {
    try { localStorage.removeItem(CLE_CARTE); } catch (e) { /* rien à retirer */ }
  }

  /* ---------- Utilitaires DOM ---------- */
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }
  function texte(tag, attrs, t) { var n = el(tag, attrs); n.textContent = t == null ? "" : t; return n; }
  function lienExterne(url, enfant) {
    var a = el("a", { href: url, target: "_blank", rel: "noopener" });
    if (typeof enfant === "string") a.textContent = enfant; else a.appendChild(enfant);
    return a;
  }
  function ouvrir(dlg) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); }

  /* ---------- Microsoft 365 ---------- */
  function urlM365(base, profil) {
    try {
      var u = new URL(base);
      if (profil.courriel) u.searchParams.set("login_hint", profil.courriel);
      else if (cfg.domaineM365) u.searchParams.set("domain_hint", cfg.domaineM365);
      return u.toString();
    } catch (e) { return base; }
  }

  /* ---------- Carte de membre officielle ---------- */
  function dateLocale(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function formaterDate(iso) {
    var d = dateLocale(iso);
    return d ? d.toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" }) : "—";
  }
  function statut(iso) {
    var fin = dateLocale(iso);
    if (!fin) return null;
    var auj = new Date(); auj.setHours(0, 0, 0, 0);
    var jours = Math.round((fin - auj) / 86400000);
    if (jours < 0) return { classe: "expiree", libelle: "Expirée" };
    if (jours <= (cfgCarte.joursAvertissement || 30))
      return { classe: "bientot", libelle: jours === 0 ? "Expire aujourd'hui" : "Expire dans " + jours + " j" };
    return { classe: "valide", libelle: "Valide" };
  }
  // Le code QR reprend celui de la carte officielle (lien vers lapiq.org),
  // ou une page de vérification si LAPIQ en crée une.
  function contenuQR() {
    return cfgCarte.qr || "https://lapiq.org";
  }
  function svgQR(donnees, couleur) {
    if (!window.qrcode) return "";
    window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs["UTF-8"];
    var qr = window.qrcode(0, "M");
    qr.addData(donnees, "Byte");
    qr.make();
    var svg = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true, alt: "Code QR vers lapiq.org" });
    return svg.replace(/#000000/gi, couleur).replace(/fill="black"/gi, 'fill="' + couleur + '"');
  }
  function logoCarte(theme) {
    if (theme === "or") return cfgCarte.ecussonOr || "icons/ecusson-noir-or.png";
    return cfgCarte.ecusson || "icons/ecusson-rouge-bleu.png";
  }
  function classeNom(nom) {
    if (nom.length > 32) return "cm-nom cm-nom-long";
    if (nom.length > 20) return "cm-nom cm-nom-moyen";
    return "cm-nom";
  }
  function nomAffiche(p) { return p.nomComplet || p.nom || ""; }

  // Recto : même composition que la carte imprimée (écusson, identité, bandeau).
  function recto(p, tag) {
    var c = el(tag, { class: "cm cm-recto" + (p.theme === "or" ? " cm-or" : "") });
    if (tag === "button") {
      c.type = "button";
      c.setAttribute("aria-label", "Agrandir la carte de membre de " + nomAffiche(p));
    }
    c.appendChild(el("img", { class: "cm-logo", src: logoCarte(p.theme), alt: "" }));
    var droite = el("div", { class: "cm-droite" });
    droite.appendChild(texte("p", { class: "cm-surtitre" }, cfgCarte.titre || "Carte de membre"));
    droite.appendChild(texte("p", { class: "cm-org" }, cfg.organisation));
    droite.appendChild(texte("p", { class: "cm-assoc" }, cfgCarte.sousTitre || "Association des pompiers instructeurs du Québec"));
    droite.appendChild(el("hr", { class: "cm-filet" }));
    c.appendChild(droite);
    c.appendChild(texte("p", { class: classeNom(nomAffiche(p)) }, nomAffiche(p)));
    var no = el("p", { class: "cm-no" });
    no.appendChild(texte("span", { class: "cm-no-lib" }, "N°"));
    no.appendChild(document.createTextNode(p.numero));
    c.appendChild(no);
    var bande = el("div", { class: "cm-bande" });
    bande.appendChild(texte("span", { class: "cm-cat" }, p.categorie || ""));
    if (p.theme !== "or") {
      var validite = p.validite || (p.expiration ? "Valide jusqu\u2019au " + formaterDate(p.expiration) : "");
      if (validite) bande.appendChild(texte("span", { class: "cm-valide" }, validite));
    }
    c.appendChild(bande);
    return c;
  }

  // Verso : attestation, coordonnées de LAPIQ et code QR vers lapiq.org.
  function verso(p) {
    var c = el("div", { class: "cm cm-verso" + (p.theme === "or" ? " cm-or" : "") });
    var tete = el("div", { class: "cm-tete" });
    tete.appendChild(el("img", { class: "cm-logo-petit", src: logoCarte(p.theme), alt: "" }));
    var t = el("div");
    t.appendChild(texte("p", { class: "cm-org" }, cfg.organisation));
    t.appendChild(texte("p", { class: "cm-assoc" }, cfgCarte.sousTitre || "Association des pompiers instructeurs du Québec"));
    tete.appendChild(t);
    c.appendChild(tete);
    c.appendChild(el("hr", { class: "cm-filet" }));
    var bas = el("div", { class: "cm-corps" });
    var txt = el("div", { class: "cm-texte" });
    txt.appendChild(texte("p", { class: "cm-atteste" }, cfgCarte.attestation ||
      "Cette carte atteste que son titulaire est membre en règle de LAPIQ. Elle demeure la propriété de l\u2019Association."));
    var adr = (cfgCarte.adresse || []);
    if (adr[0]) {
      var l1 = el("p", { class: "cm-adr1" }), m = /^(.*?\d)(re|er|e)( .*)$/.exec(adr[0]);
      if (m) { l1.appendChild(document.createTextNode(m[1])); l1.appendChild(texte("sup", {}, m[2])); l1.appendChild(document.createTextNode(m[3])); }
      else l1.textContent = adr[0];
      txt.appendChild(l1);
    }
    if (adr[1]) txt.appendChild(texte("p", { class: "cm-adr2" }, adr[1]));
    txt.appendChild(texte("p", { class: "cm-site" }, "lapiq.org"));
    bas.appendChild(txt);
    c.appendChild(bas);
    var qr = svgQR(contenuQR(), p.theme === "or" ? "#1A1714" : "#2D314B");
    if (qr) c.appendChild(el("div", { class: "cm-qr" }, qr));
    c.appendChild(texte("div", { class: "cm-bande cm-devise" }, cfgCarte.devise || "Ceux qui forment les pompiers du Québec · Depuis 1985"));
    return c;
  }

  function ouvrirGrande(p) {
    var grande = document.getElementById("carte-grande");
    grande.innerHTML = "";
    grande.appendChild(recto(p, "div"));
    grande.appendChild(verso(p));
    ouvrir(document.getElementById("carte-plein-ecran"));
  }

  function montrerRecherche(numero, erreur) {
    var zone = document.getElementById("zone-carte");
    zone.innerHTML = "";
    var bloc = el("div", { class: "carte-recherche" });
    bloc.appendChild(texte("h3", {}, "Carte de membre"));
    bloc.appendChild(texte("p", {}, "Retrouvez la carte officielle liée à votre adhésion. Le nom, la catégorie et la date proviennent du dossier : ils ne se saisissent pas ici."));
    var form = el("form", { id: "form-carte" });
    form.appendChild(texte("label", { for: "recherche-numero" }, "Numéro de membre"));
    var champ = el("input", {
      id: "recherche-numero", name: "numero", type: "text", inputmode: "text",
      autocapitalize: "characters", autocomplete: "off", spellcheck: "false",
      placeholder: "LAPIQ-261001", required: "required", "aria-describedby": "aide-numero"
    });
    if (numero) champ.value = numero;
    var bouton = texte("button", { type: "submit" }, "Afficher ma carte");
    var ligne = el("div", { class: "recherche-ligne" });
    ligne.appendChild(champ);
    ligne.appendChild(bouton);
    form.appendChild(ligne);
    var err = texte("p", { id: "erreur-numero", class: "erreur", role: "alert" }, erreur || "");
    err.hidden = !erreur;
    form.appendChild(err);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = champ.value.trim();
      if (!v) {
        err.textContent = "Indiquez votre numéro de membre.";
        err.hidden = false;
        champ.focus();
        return;
      }
      bouton.disabled = true;
      chercherNumero(v).then(function () { bouton.disabled = false; });
    });
    bloc.appendChild(form);
    bloc.appendChild(texte("p", { id: "aide-numero", class: "note" }, "Format LAPIQ-AASNNN, indiqué sur votre reçu d'adhésion ou dans l'espace membres Yapla."));
    bloc.appendChild(el("div", { id: "exemples-carte" }));
    zone.appendChild(bloc);
    proposerExemples();
  }

  function proposerExemples() {
    var dest = document.getElementById("exemples-carte");
    if (!dest || dest.childNodes.length) return;
    fetch("api/membre", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!dest.isConnected || !data || data.source !== "exemple" || !data.exemples) return;
        dest.appendChild(texte("p", { class: "note" }, "Aperçu : ces personnes sont fictives, le temps que l'export Yapla soit configuré."));
        var rangee = el("div", { class: "exemples-demo" });
        data.exemples.forEach(function (ex) {
          var b = texte("button", { type: "button" }, ex.nomComplet + " · " + ex.numero);
          b.addEventListener("click", function () { chercherNumero(ex.numero); });
          rangee.appendChild(b);
        });
        dest.appendChild(rangee);
      })
      .catch(function () { /* hors ligne : la recherche reste disponible */ });
  }

  function chercherNumero(numero, silencieux) {
    return fetch("api/membre?numero=" + encodeURIComponent(numero), { headers: { Accept: "application/json" } })
      .then(function (r) {
        return r.json().then(function (data) { return { ok: r.ok, status: r.status, data: data }; }, function () {
          return { ok: false, status: r.status, data: {} };
        });
      })
      .then(function (rep) {
        if (rep.ok && rep.data && rep.data.membre) {
          var m = rep.data.membre;
          m.source = rep.data.source;
          if (!ecrireCarte(m)) message("La carte s'affiche, mais cet appareil ne peut pas la conserver (navigation privée?).");
          saluer();
          rendreCarte(m);
          return;
        }
        if (silencieux && rep.status !== 404 && lireCarte()) return;
        if (rep.status === 404) effacerCarte();
        montrerRecherche(numero, (rep.data && rep.data.erreur) || "Aucune carte ne correspond à ce numéro.");
      })
      .catch(function () {
        if (silencieux && lireCarte()) return;
        montrerRecherche(numero, "Impossible de joindre le dossier des membres. Réessayez lorsque vous serez en ligne. Une carte déjà affichée reste disponible hors ligne.");
      });
  }

  function rendreCarte(p) {
    var zone = document.getElementById("zone-carte");
    if (!p || !p.numero || (!p.nomComplet && !p.nom)) {
      montrerRecherche();
      return;
    }
    zone.innerHTML = "";
    var carte = recto(p, "button");
    carte.addEventListener("click", function () { ouvrirGrande(p); });
    zone.appendChild(carte);
    var etat = el("div", { class: "cm-etat" });
    if (p.theme === "or") {
      etat.appendChild(texte("span", { class: "statut vie" }, "Membre à vie"));
    } else {
      var st = statut(p.expiration);
      if (st) etat.appendChild(texte("span", { class: "statut " + st.classe }, st.libelle));
      if (st && st.classe !== "valide" && cfg.yapla && cfg.yapla.adhesion) {
        var r = lienExterne(cfg.yapla.adhesion, st.classe === "expiree" ? "Renouveler mon adhésion" : "Renouveler maintenant");
        r.className = "btn-renouveler";
        etat.appendChild(r);
      }
    }
    etat.appendChild(texte("span", { class: "cm-aide" }, "Touchez la carte pour l\u2019agrandir et voir le verso."));
    zone.appendChild(etat);
    if (p.source === "exemple") {
      zone.appendChild(texte("p", { class: "note-exemple" }, "Aperçu de démonstration avec des personnes fictives. La carte réelle s'affichera lorsque l'export Yapla sera configuré."));
    }
    var retirer = texte("button", { type: "button", class: "btn-retirer" }, "Retirer cette carte de l'appareil");
    retirer.addEventListener("click", function () {
      effacerCarte();
      rendre();
      message("La carte a été retirée de cet appareil. Le dossier d'adhésion n'a pas été modifié.");
    });
    zone.appendChild(retirer);
  }

  function saluer() {
    var profil = lireProfil();
    var carte = lireCarte();
    var prenom = profil.prenom || (carte && carte.prenom) || "";
    document.getElementById("salutation").textContent = prenom ? "Bonjour " + prenom + "!" : "Bonjour!";
  }

  /* ---------- Services ---------- */
  function rendreServices(profil) {
    var grille = document.getElementById("services");
    grille.innerHTML = "";
    cfg.services.forEach(function (s) {
      var carte = el("article", { class: "carte", style: "--couleur:" + s.couleur });
      var url = s.m365 ? urlM365(s.url, profil) : s.url;

      var wrap = el("span"); wrap.style.display = "contents";
      if (s.logo) wrap.appendChild(el("img", { class: "pastille-logo", src: s.logo, alt: "" }));
      else wrap.appendChild(el("span", { class: "pastille", "aria-hidden": "true" }, ICONES[s.icone] || ICONES.site));
      var corps = el("div");
      corps.appendChild(texte("h3", { class: "carte-nom" }, s.nom));
      corps.appendChild(texte("p", { class: "carte-desc" }, s.description));
      wrap.appendChild(corps);
      var principal = lienExterne(url, wrap);
      principal.className = "carte-principal";
      principal.setAttribute("aria-label", s.nom + " — " + s.description);
      carte.appendChild(principal);

      if (s.liens && s.liens.length) {
        var ul = el("ul", { class: "sous-liens", "aria-label": "Raccourcis " + s.nom });
        s.liens.forEach(function (l) {
          var li = el("li");
          li.appendChild(lienExterne(l.m365 ? urlM365(l.url, profil) : l.url, l.nom));
          ul.appendChild(li);
        });
        carte.appendChild(ul);
      }
      grille.appendChild(carte);
    });
  }

  function rendre() {
    var profil = lireProfil();
    document.getElementById("titre").textContent = cfg.organisation;
    document.getElementById("sous-titre").textContent = cfg.sousTitre;
    if (cfg.logo) document.getElementById("logo").src = cfg.logo;
    document.getElementById("nom-complet").textContent = cfg.nomComplet || "";
    saluer();
    rendreCarte(lireCarte());
    rendreServices(profil);

    // Pied de page et liens d'aide
    document.getElementById("adresse").textContent = cfg.adresse || "";
    var lc = document.getElementById("lien-confidentialite");
    if (cfg.confidentialite) { lc.href = cfg.confidentialite; lc.target = "_blank"; lc.rel = "noopener"; } else lc.parentNode.hidden = true;
    var lcamp = document.getElementById("lien-campus"), ladh = document.getElementById("lien-adhesion");
    if (cfg.courrielCampus) lcamp.href = cfg.courrielCampus; else lcamp.hidden = true;
    if (cfg.courrielAdhesion) ladh.href = cfg.courrielAdhesion; else ladh.hidden = true;
    var res = document.getElementById("reseaux");
    res.innerHTML = "";
    (cfg.reseaux || []).forEach(function (r) { res.appendChild(lienExterne(r.url, r.nom)); });

    var soutien = document.getElementById("soutien");
    soutien.innerHTML = "";
    if (cfg.courrielSoutien) {
      soutien.appendChild(document.createTextNode("Soutien : "));
      soutien.appendChild(texte("a", { href: "mailto:" + cfg.courrielSoutien }, cfg.courrielSoutien));
    }
  }

  /* ---------- Dialogue profil ---------- */
  var dlg = document.getElementById("profil");
  var CHAMPS = ["prenom", "courriel"];
  function ouvrirProfil() {
    var p = lireProfil();
    CHAMPS.forEach(function (c) { document.getElementById(c).value = p[c] || ""; });
    erreurCourriel.hidden = true;
    ouvrir(dlg);
  }

  document.getElementById("btn-profil").addEventListener("click", ouvrirProfil);

  // L'adresse doit appartenir au domaine Microsoft de LAPIQ.
  var erreurCourriel = document.getElementById("erreur-courriel");
  document.getElementById("enregistrer").addEventListener("click", function (e) {
    var v = document.getElementById("courriel").value.trim().toLowerCase();
    var ok = !v || !cfg.domaineM365 || v.slice(-(cfg.domaineM365.length + 1)) === "@" + cfg.domaineM365;
    erreurCourriel.hidden = ok;
    if (!ok) { e.preventDefault(); document.getElementById("courriel").focus(); }
  });
  dlg.addEventListener("close", function () {
    if (dlg.returnValue !== "ok") return;
    var p = {};
    CHAMPS.forEach(function (c) { p[c] = document.getElementById(c).value.trim(); });
    p.courriel = p.courriel.toLowerCase();
    if (!ecrireProfil(p)) alert("Impossible d'enregistrer sur cet appareil (navigation privée?).");
    rendre();
  });

  /* ---------- Message bref ---------- */
  var toast = document.getElementById("toast"), minuterie;
  function message(t) {
    toast.textContent = t; toast.hidden = false;
    clearTimeout(minuterie);
    minuterie = setTimeout(function () { toast.hidden = true; }, 3000);
  }

  /* ---------- Effacer les informations ---------- */
  document.getElementById("btn-effacer").addEventListener("click", function () {
    if (!confirm("Effacer le prénom, l'adresse et la carte enregistrés sur cet appareil?")) return;
    try { localStorage.removeItem(CLE); } catch (e) { /* rien à effacer */ }
    effacerCarte();
    dlg.close("annuler");
    rendre();
    message("Vos informations ont été effacées de cet appareil.");
  });

  /* ---------- Installation ---------- */
  var autonome = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var invite = null;
  var btnInstaller = document.getElementById("btn-installer");
  if (!autonome && ios) btnInstaller.hidden = false; // iPhone : guide pas à pas
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); invite = e; btnInstaller.hidden = false;
  });
  btnInstaller.addEventListener("click", function () {
    if (invite) {
      invite.prompt();
      invite.userChoice.then(function () { invite = null; btnInstaller.hidden = true; });
    } else {
      ouvrir(document.getElementById("guide-ios"));
    }
  });
  window.addEventListener("appinstalled", function () {
    btnInstaller.hidden = true;
    message("Le portail LAPIQ est installé.");
  });

  /* ---------- Partager ---------- */
  var adresse = location.origin + location.pathname.replace(/index\.html$/, "");
  document.getElementById("btn-partager").addEventListener("click", function () {
    var donnees = { title: "Portail LAPIQ", text: "Le portail des membres de LAPIQ", url: adresse };
    if (navigator.share) {
      navigator.share(donnees).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(adresse).then(function () { message("Lien copié : " + adresse); },
        function () { message(adresse); });
    } else {
      message(adresse);
    }
  });

  /* ---------- Hors ligne ---------- */
  var bandeauHL = document.getElementById("bandeau-hors-ligne");
  function etatReseau() { bandeauHL.hidden = navigator.onLine; }
  window.addEventListener("online", etatReseau);
  window.addEventListener("offline", etatReseau);
  etatReseau();

  /* ---------- Mises à jour ---------- */
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    var avaitControleur = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register("sw.js").then(function (reg) {
      // Vérifie les mises à jour quand on revient dans l'application.
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") reg.update().catch(function () {});
      });
    }).catch(function () {});
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (avaitControleur) document.getElementById("bandeau-maj").hidden = false;
    });
    document.getElementById("btn-maj").addEventListener("click", function () { location.reload(); });
  }

  rendre();

  // Une carte déjà retrouvée est rafraîchie. Sinon, un ancien numéro saisi
  // à la main sert seulement de piste de recherche : le nom affiché vient du dossier.
  var deja = lireCarte();
  if (deja && deja.numero && navigator.onLine) {
    chercherNumero(deja.numero, true);
  } else if (!deja && navigator.onLine && /^LAPIQ-\d{6}$/i.test(String((lireProfil().numero || "")).replace(/\s/g, ""))) {
    chercherNumero(String(lireProfil().numero).trim(), false);
  }
})();
