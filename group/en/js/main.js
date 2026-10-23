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

      // Управление меню
      function closeMenu() {
        menu.hidden = true;
        menu.inert = true;
        menu.setAttribute("aria-hidden", "true");

        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation menu");
      }

      function openMenu() {
        if (desktopQuery.matches) return;

        menu.hidden = false;
        menu.inert = false;
        menu.setAttribute("aria-hidden", "false");

        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Close navigation menu");
      }

      function toggleMenu() {
        if (toggle.getAttribute("aria-expanded") === "true") {
          closeMenu();
        } else {
          openMenu();
        }
      }

      closeMenu();

      // Кнопка меню
      toggle.addEventListener("click", toggleMenu);

      // Переход по ссылке
      links.forEach((link) => {
        link.addEventListener("click", closeMenu);
      });

      // Клик вне Header
      document.addEventListener("click", (event) => {
        if (
          toggle.getAttribute("aria-expanded") === "true" &&
          !header.contains(event.target)
        ) {
          closeMenu();
        }
      });

      // Закрытие через Escape
      document.addEventListener("keydown", (event) => {
        if (
          event.key === "Escape" &&
          toggle.getAttribute("aria-expanded") === "true"
        ) {
          closeMenu();
          toggle.focus();
        }
      });

      // Переключение на десктоп
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
