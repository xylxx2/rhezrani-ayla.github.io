
(() => {
  // Mode strict : aide à repérer les erreurs et interdit certains comportements risqués.
  "use strict";

  // Petite fonction utilitaire : lance fn() quand le DOM est prêt.
  const onReady = (fn) => {
    if (document.readyState === "loading") {
      // Si le document n'est pas encore prêt, on écoute l'événement.
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      // Sinon on l'exécute immédiatement.
      fn();
    }
  };

  onReady(() => {
    // On attrape le header principal. Sans lui, pas de script à exécuter.
    const nav = document.getElementById("mainnav");
    if (!nav) return;

    // Références vers tous les éléments utilisés par les interactions.
    const burger = nav.querySelector(".mainnav__burger");
    const drawer = nav.querySelector("#mainnav-drawer");
    const overlay = nav.querySelector(".mainnav__overlay");
    // Liste des boutons/éléments pouvant déclencher la fermeture du menu.
    const closeButtons = nav.querySelectorAll("[data-mainnav-close]");

    // Fonction appelée au scroll pour ajouter/enlever la classe scrolled (effets visuels).
    const setScrolled = () => {
      const scrolled = window.scrollY > 0;
      nav.classList.toggle("scrolled", scrolled);
    };
    /////////////////////////////////////////////////////////////////////
    // Ouvre le tiroir et prépare tout ce qui va avec (ARIA, focus, blocage scroll).
    /////////////////////////////////////////////////////////////////////

    const openDrawer = () => {
      nav.dataset.open = "true";
      burger?.setAttribute("aria-expanded", "true");

      // rendre visibles overlay/drawer (pour l'accessibilité)
      overlay.hidden = false;
      drawer.hidden = false;
      drawer.setAttribute("aria-hidden", "false");

      // empêcher le scroll du body pendant le menu
      document.documentElement.style.overflow = "hidden";

      // focus sur le bouton fermer (ou premier lien)
      const focusTarget = drawer.querySelector("[data-mainnav-close]") || drawer.querySelector("a");
      focusTarget?.focus();
    };

    /////////////////////////////////////////////////////////////////////
    // Ferme le tiroir en douceur, en attendant les animations si nécessaire.
    /////////////////////////////////////////////////////////////////////

    const closeDrawer = () => {
      nav.dataset.open = "false";
      burger?.setAttribute("aria-expanded", "false");

      // rendre invisibles overlay/drawer après la transition
      // et restaurer le scroll
      const cleanup = () => {
        if (nav.dataset.open === "true") return;
        overlay.hidden = true;
        drawer.hidden = true;
        drawer.setAttribute("aria-hidden", "true");
        document.documentElement.style.overflow = "";
        burger?.focus();
      };

      // attendre la fin de l'animation du drawer
      const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      if (prefersReduced) {
        // Si l'utilisateur a demandé moins d'animations, on nettoie immédiatement.
        cleanup();
      } else {
        // Sinon on attend la fin de la transition CSS pour éviter les flashs.
        const handler = () => {
          drawer.removeEventListener("transitionend", handler);
          cleanup();
        };
        drawer.addEventListener("transitionend", handler);
      }
    };

    // Petit helper pour savoir si le menu est ouvert.
    const isOpen = () => nav.dataset.open === "true";

    // On initialise l'état du header (ombré ou non) puis on surveille le scroll.
    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });

    /////////////////////////////////////////////////////////////////////
    // Clique sur le burger : ouvre si fermé, ferme si déjà ouvert.
    /////////////////////////////////////////////////////////////////////

    burger?.addEventListener("click", () => {
      if (isOpen()) closeDrawer();
      else openDrawer();
    });

    // Tous les éléments portant data-mainnav-close (bouton fermer, overlay) ferment le menu.
    closeButtons.forEach((btn) => btn.addEventListener("click", closeDrawer));

    // Touche Escape (clavier) pour fermer rapidement, pratique pour l'accessibilité.
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) closeDrawer();
    });

    // Fermer automatiquement une fois un lien du menu cliqué.
    drawer?.addEventListener("click", (e) => {
      const target = e.target;
      if (target instanceof HTMLAnchorElement) closeDrawer();
    });

    // Boucle de focus : quand on tabule dans le tiroir, on reste à l'intérieur.
    drawer?.addEventListener("keydown", (e) => {
      if (e.key !== "Tab" || !isOpen()) return;
      // On capture tous les éléments pouvant recevoir le focus à l'intérieur du tiroir.
      const focusables = drawer.querySelectorAll(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      // On récupère le premier et dernier élément focusable.
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        // Maj+Tab sur le premier ramène au dernier élément (boucle).
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        // Tab simple sur le dernier repart sur le premier pour rester emprisonné.
        e.preventDefault();
        first.focus();
      }
    });
  });
})();
