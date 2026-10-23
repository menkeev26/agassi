
/* AGASSI Group — Header */

(() => {
  "use strict";

  function initHeader() {
    const headers = document.querySelectorAll(".agg-header");

    headers.forEach((header) => {
      if (header.dataset.aggInitialized === "true") return;

      const toggle = header.querySelector(".agg-header__mobile-toggle");
      const menu = header.querySelector(".agg-header__mobile-menu");

      if (!toggle || !menu) return;

      header.dataset.aggInitialized = "true";

      const links = menu.querySelectorAll("a");
      const desktopQuery = window.matchMedia("(min-width: 1024px)");

      function closeMenu() {
        menu.classList.remove("is-open");
        menu.hidden = true;
        menu.inert = true;
        menu.setAttribute("aria-hidden", "true");

        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation menu");
      }

      function openMenu() {
        menu.hidden = false;
        menu.inert = false;
        menu.classList.add("is-open");
        menu.setAttribute("aria-hidden", "false");

        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Close navigation menu");
      }

      function toggleMenu() {
        if (menu.classList.contains("is-open")) {
          closeMenu();
        } else {
          openMenu();
        }
      }

      closeMenu();

      toggle.addEventListener("click", toggleMenu);

      links.forEach((link) => {
        link.addEventListener("click", closeMenu);
      });

      document.addEventListener("click", (event) => {
        if (!header.contains(event.target)) {
          closeMenu();
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        if (menu.classList.contains("is-open")) {
          closeMenu();
          toggle.focus();
        }
      });

      function handleBreakpoint(event) {
        if (event.matches) {
          closeMenu();
        }
      }

      if (desktopQuery.addEventListener) {
        desktopQuery.addEventListener("change", handleBreakpoint);
      } else {
        window.addEventListener("resize", () => {
          if (window.innerWidth >= 1024) {
            closeMenu();
          }
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeader);
  } else {
    initHeader();
  }
})();
