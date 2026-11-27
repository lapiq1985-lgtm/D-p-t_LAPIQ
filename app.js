(function () {
  "use strict";
  var cfg = window.LAPIQ_CONFIG;
  var cfgCarte = cfg.carteMembre || {};
  var CLE = "lapiq-profil";

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

  /* ---------- Carte de membre ---------- */
  function aCarte(p) { return !!(p.nom && p.numero); }

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
  function contenuQR(p) {
    if (cfgCarte.urlVerification) return cfgCarte.urlVerification + encodeURIComponent(p.numero);
    return cfgCarte.qr || "https://lapiq.org";
  }
  function svgQR(donnees) {
    if (!window.qrcode) return "";
    window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs["UTF-8"];
    var qr = window.qrcode(0, "M");
    qr.addData(donnees, "Byte");
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true, alt: "Code QR : " + donnees });
  }

  // Recto : reproduit le modèle officiel de la carte de membre LAPIQ.
  function recto(p, tag) {
    var c = el(tag, { class: "cm cm-recto" });
    if (tag === "button") {
      c.type = "button";
      c.setAttribute("aria-label", "Agrandir la carte de membre de " + p.nom);
    }
    c.appendChild(el("img", { class: "cm-logo", src: cfg.logo, alt: "" }));
    var droite = el("div", { class: "cm-droite" });
    droite.appendChild(texte("p", { class: "cm-surtitre" }, cfgCarte.titre || "Carte de membre"));
    droite.appendChild(texte("p", { class: "cm-org" }, cfg.organisation));
    droite.appendChild(texte("p", { class: "cm-assoc" }, cfgCarte.sousTitre || "Association des pompiers instructeurs du Québec"));
    droite.appendChild(el("hr", { class: "cm-filet" }));
    droite.appendChild(texte("p", { class: "cm-nom" }, p.nom));
    var no = el("p", { class: "cm-no" });
    no.appendChild(texte("span", { class: "cm-no-lib" }, "N°"));
    no.appendChild(document.createTextNode(" " + p.numero));
    droite.appendChild(no);
    c.appendChild(droite);
    var bande = el("div", { class: "cm-bande" });
    bande.appendChild(texte("span", { class: "cm-cat" }, p.categorie || ""));
    bande.appendChild(texte("span", { class: "cm-valide" }, p.expiration ? "Valide jusqu\u2019au " + formaterDate(p.expiration) : ""));
    c.appendChild(bande);
    return c;
  }

  // Verso : attestation, coordonnées et code QR.
  function verso(p) {
    var c = el("div", { class: "cm cm-verso" });
    var tete = el("div", { class: "cm-tete" });
    tete.appendChild(el("img", { class: "cm-logo-petit", src: cfg.logo, alt: "" }));
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
      // « 1re » en exposant, comme sur la carte imprimée
      var l1 = el("p", { class: "cm-adr1" }), m = /^(.*?\d)(re|er|e)( .*)$/.exec(adr[0]);
      if (m) { l1.appendChild(document.createTextNode(m[1])); l1.appendChild(texte("sup", {}, m[2])); l1.appendChild(document.createTextNode(m[3])); }
      else l1.textContent = adr[0];
      txt.appendChild(l1);
    }
    if (adr[1]) txt.appendChild(texte("p", { class: "cm-adr2" }, adr[1]));
    txt.appendChild(texte("p", { class: "cm-site" }, "lapiq.org"));
    bas.appendChild(txt);
    var qr = svgQR(contenuQR(p));
    if (qr) bas.appendChild(el("div", { class: "cm-qr" }, qr));
    c.appendChild(bas);
    c.appendChild(texte("div", { class: "cm-bande cm-devise" }, cfgCarte.devise || "Ceux qui forment les pompiers du Québec · Depuis 1985"));
    return c;
  }

  function rendreCarte(p) {
    var zone = document.getElementById("zone-carte");
    zone.innerHTML = "";
    if (!aCarte(p)) {
      var vide = el("div", { class: "carte-vide" });
      vide.appendChild(texte("p", {}, "Ajoutez votre carte de membre pour l'avoir toujours sous la main, même sans Internet."));
      var b = texte("button", { type: "button" }, "Ajouter ma carte");
      b.addEventListener("click", ouvrirProfil);
      vide.appendChild(b);
      zone.appendChild(vide);
    } else {
      var carte = recto(p, "button");
      carte.addEventListener("click", function () {
        var grande = document.getElementById("carte-grande");
        grande.innerHTML = "";
        grande.appendChild(recto(p, "div"));
        grande.appendChild(verso(p));
        ouvrir(document.getElementById("carte-plein-ecran"));
      });
      zone.appendChild(carte);
      var etat = el("div", { class: "cm-etat" });
      var st = statut(p.expiration);
      if (st) etat.appendChild(texte("span", { class: "statut " + st.classe }, st.libelle));
      etat.appendChild(texte("span", { class: "cm-aide" }, "Touchez la carte pour l\u2019agrandir et voir le verso."));
      zone.appendChild(etat);
      if (st && st.classe !== "valide" && cfg.yapla && cfg.yapla.adhesion) {
        var r = lienExterne(cfg.yapla.adhesion, st.classe === "expiree" ? "Renouveler mon adhésion" : "Renouveler maintenant");
        r.className = "btn-renouveler";
        zone.appendChild(r);
      }
    }
    if (cfgCarte.urlOfficielle) {
      var a = lienExterne(cfgCarte.urlOfficielle, "Afficher ma carte officielle (Yapla)");
      a.className = "btn-carte-officielle";
      zone.appendChild(a);
    }
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
    var prenom = profil.prenom || (profil.nom || "").split(/\s+/)[0];
    document.getElementById("salutation").textContent = prenom ? "Bonjour " + prenom + "!" : "Bonjour!";
    rendreCarte(profil);
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
  var CHAMPS = ["prenom", "courriel", "nom", "numero", "categorie", "expiration"];
  function ouvrirProfil() {
    var p = lireProfil();
    CHAMPS.forEach(function (c) { document.getElementById(c).value = p[c] || ""; });
    erreurCourriel.hidden = true;
    ouvrir(dlg);
  }

  document.getElementById("btn-profil").addEventListener("click", ouvrirProfil);

  // Catégories d'adhésion : liste de choix et date d'expiration suggérée
  var categories = cfgCarte.categories || [];
  var liste = document.getElementById("liste-categories");
  categories.forEach(function (c) { var o = document.createElement("option"); o.value = c.nom; liste.appendChild(o); });
  document.getElementById("categorie").addEventListener("change", function (e) {
    var exp = document.getElementById("expiration");
    var c = categories.filter(function (x) { return x.nom === e.target.value; })[0];
    if (c && c.fin && !exp.value) exp.value = c.fin;
  });

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
    if (!confirm("Effacer votre profil et votre carte de membre de cet appareil?")) return;
    try { localStorage.removeItem(CLE); } catch (e) { /* rien à effacer */ }
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
})();
