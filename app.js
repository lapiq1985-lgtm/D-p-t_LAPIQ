(function () {
  "use strict";
  var cfg = window.LAPIQ_CONFIG;
  var cfgCarte = cfg.carteMembre || {};
  var CLE = "lapiq-profil";

  var ICONES = {
    yapla: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17c.6-2 2-3 3.5-3s2.9 1 3.5 3M14 9h4M14 13h4"/></svg>',
    m365: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>',
    campus: '<svg viewBox="0 0 24 24"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6"/></svg>',
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
  function contenuQR(p) {
    if (cfgCarte.urlVerification) return cfgCarte.urlVerification + encodeURIComponent(p.numero);
    return [cfg.organisation, "Membre : " + p.nom, "No : " + p.numero,
      p.categorie ? "Catégorie : " + p.categorie : "",
      p.expiration ? "Valide jusqu'au : " + p.expiration : ""].filter(Boolean).join("\n");
  }
  function svgQR(donnees) {
    if (!window.qrcode) return "";
    window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs["UTF-8"];
    var qr = window.qrcode(0, "M");
    qr.addData(donnees, "Byte");
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true, alt: "Code QR de la carte de membre" });
  }
  function initiales(nom) {
    return nom.split(/\s+/).filter(Boolean).slice(0, 2).map(function (m) { return m[0].toUpperCase(); }).join("");
  }

  function construireCarte(p, tag) {
    var c = el(tag, { class: "carte-membre" });
    if (tag === "button") {
      c.type = "button";
      c.setAttribute("aria-label", "Agrandir la carte de membre de " + p.nom);
    }

    var haut = el("div", { class: "cm-haut" });
    var org = el("div", { class: "cm-org" });
    org.appendChild(el("img", { src: "icons/icon.svg", alt: "" }));
    org.appendChild(texte("span", {}, cfg.organisation));
    haut.appendChild(org);
    var st = statut(p.expiration);
    haut.appendChild(st ? texte("span", { class: "statut " + st.classe }, st.libelle)
                        : texte("span", { class: "cm-titre" }, cfgCarte.titre || "Carte de membre"));
    c.appendChild(haut);

    var ident = el("div", { class: "cm-identite" });
    if (p.photo) ident.appendChild(el("img", { class: "cm-photo", src: p.photo, alt: "Photo de " + p.nom }));
    else ident.appendChild(texte("span", { class: "cm-photo", "aria-hidden": "true" }, initiales(p.nom)));
    var noms = el("div");
    noms.appendChild(texte("p", { class: "cm-nom" }, p.nom));
    if (p.categorie) noms.appendChild(texte("p", { class: "cm-cat" }, p.categorie));
    ident.appendChild(noms);
    c.appendChild(ident);

    var dl = el("dl", { class: "cm-champs" });
    [["N° de membre", p.numero], ["Valide jusqu'au", formaterDate(p.expiration)]].forEach(function (x) {
      var d = el("div");
      d.appendChild(texte("dt", {}, x[0]));
      d.appendChild(texte("dd", {}, x[1]));
      dl.appendChild(d);
    });
    c.appendChild(dl);

    var qr = svgQR(contenuQR(p));
    if (qr) c.appendChild(el("div", { class: "cm-qr" }, qr));

    var pied = el("div", { class: "cm-pied" });
    pied.appendChild(texte("span", {}, cfgCarte.titre || "Carte de membre"));
    if (tag === "button") pied.appendChild(texte("span", { "aria-hidden": "true" }, "Toucher pour agrandir"));
    c.appendChild(pied);
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
      var carte = construireCarte(p, "button");
      carte.addEventListener("click", function () {
        var grande = document.getElementById("carte-grande");
        grande.innerHTML = "";
        grande.appendChild(construireCarte(p, "div"));
        ouvrir(document.getElementById("carte-plein-ecran"));
      });
      zone.appendChild(carte);
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
      wrap.appendChild(el("span", { class: "pastille", "aria-hidden": "true" }, ICONES[s.icone] || ICONES.site));
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
    var prenom = profil.prenom || (profil.nom || "").split(/\s+/)[0];
    document.getElementById("salutation").textContent = prenom ? "Bonjour " + prenom + "!" : "Bonjour!";
    rendreCarte(profil);
    rendreServices(profil);

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
  var photoTemp = null;
  var apercu = document.getElementById("apercu-photo");
  var btnRetirer = document.getElementById("retirer-photo");

  function afficherPhoto(src) {
    photoTemp = src || null;
    apercu.hidden = btnRetirer.hidden = !photoTemp;
    if (photoTemp) apercu.src = photoTemp; else apercu.removeAttribute("src");
  }
  function ouvrirProfil() {
    var p = lireProfil();
    CHAMPS.forEach(function (c) { document.getElementById(c).value = p[c] || ""; });
    erreurCourriel.hidden = true;
    document.getElementById("photo").value = "";
    afficherPhoto(p.photo);
    ouvrir(dlg);
  }

  // Réduit la photo (carré 240 px) pour qu'elle tienne dans le stockage local.
  document.getElementById("photo").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var img = new Image();
    var url = URL.createObjectURL(f);
    img.onload = function () {
      var t = 240, cote = Math.min(img.width, img.height);
      var cv = document.createElement("canvas"); cv.width = cv.height = t;
      cv.getContext("2d").drawImage(img, (img.width - cote) / 2, (img.height - cote) / 2, cote, cote, 0, 0, t, t);
      URL.revokeObjectURL(url);
      afficherPhoto(cv.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = function () { URL.revokeObjectURL(url); alert("Cette image n'a pas pu être lue."); };
    img.src = url;
  });
  btnRetirer.addEventListener("click", function () {
    document.getElementById("photo").value = "";
    afficherPhoto(null);
  });

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
    if (photoTemp) p.photo = photoTemp;
    if (!ecrireProfil(p)) alert("Impossible d'enregistrer sur cet appareil (navigation privée?).");
    rendre();
  });

  /* ---------- Installation (PWA) ---------- */
  var invite = null;
  var btnInstaller = document.getElementById("btn-installer");
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); invite = e; btnInstaller.hidden = false;
  });
  btnInstaller.addEventListener("click", function () {
    if (!invite) return;
    invite.prompt(); invite = null; btnInstaller.hidden = true;
  });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  rendre();
})();
