(function () {
  "use strict";
  var cfg = window.LAPIQ_CONFIG;
  var CLE = "lapiq-profil";

  var ICONES = {
    yapla: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17c.6-2 2-3 3.5-3s2.9 1 3.5 3M14 9h4M14 13h4"/></svg>',
    m365: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>',
    campus: '<svg viewBox="0 0 24 24"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6"/></svg>',
    site: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"/></svg>'
  };

  function lireProfil() {
    try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { return {}; }
  }
  function ecrireProfil(p) {
    try { localStorage.setItem(CLE, JSON.stringify(p)); } catch (e) { /* stockage indisponible */ }
  }

  // Ajoute les indices de connexion Microsoft (domaine / courriel)
  function urlM365(base, profil) {
    try {
      var u = new URL(base);
      if (profil.courriel) u.searchParams.set("login_hint", profil.courriel);
      else if (cfg.domaineM365) u.searchParams.set("domain_hint", cfg.domaineM365);
      return u.toString();
    } catch (e) { return base; }
  }

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }
  function texte(tag, attrs, t) { var n = el(tag, attrs); n.textContent = t; return n; }

  function lienExterne(url, enfant) {
    var a = el("a", { href: url, target: "_blank", rel: "noopener" });
    if (typeof enfant === "string") a.textContent = enfant; else a.appendChild(enfant);
    return a;
  }

  function rendre() {
    var profil = lireProfil();
    document.getElementById("titre").textContent = cfg.organisation;
    document.getElementById("sous-titre").textContent = cfg.sousTitre;
    document.getElementById("salutation").textContent =
      profil.prenom ? "Bonjour " + profil.prenom + "!" : "Bonjour!";

    var grille = document.getElementById("services");
    grille.innerHTML = "";
    cfg.services.forEach(function (s) {
      var carte = el("article", { class: "carte", style: "--couleur:" + s.couleur });
      var url = s.m365 ? urlM365(s.url, profil) : s.url;

      var corps = el("div");
      corps.appendChild(texte("h3", { class: "carte-nom" }, s.nom));
      corps.appendChild(texte("p", { class: "carte-desc" }, s.description));
      var contenu = document.createDocumentFragment();
      contenu.appendChild(el("span", { class: "pastille", "aria-hidden": "true" }, ICONES[s.icone] || ICONES.site));
      contenu.appendChild(corps);
      var wrap = el("span"); wrap.style.display = "contents"; wrap.appendChild(contenu);
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

    var soutien = document.getElementById("soutien");
    soutien.innerHTML = "";
    if (cfg.courrielSoutien) {
      soutien.appendChild(document.createTextNode("Soutien : "));
      soutien.appendChild(texte("a", { href: "mailto:" + cfg.courrielSoutien }, cfg.courrielSoutien));
    }
  }

  // Dialogue profil
  var dlg = document.getElementById("profil");
  document.getElementById("btn-profil").addEventListener("click", function () {
    var p = lireProfil();
    document.getElementById("prenom").value = p.prenom || "";
    document.getElementById("courriel").value = p.courriel || "";
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  });
  dlg.addEventListener("close", function () {
    if (dlg.returnValue !== "ok") return;
    ecrireProfil({
      prenom: document.getElementById("prenom").value.trim(),
      courriel: document.getElementById("courriel").value.trim()
    });
    rendre();
  });

  // Installation (PWA)
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
