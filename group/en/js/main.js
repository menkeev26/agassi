(() => {
  const root = document.documentElement;

  if (root.dataset.aggHeaderBound === "true") return;
  root.dataset.aggHeaderBound = "true";

  const setMenuOpen = (header, open, restoreFocus = false) => {
    const menu = header.querySelector(".agg-header__mobile-menu");
    const openButton = header.querySelector(".agg-header__menu-open");
    const closeButton = header.querySelector(".agg-header__menu-close");

    if (!menu || !openButton || !closeButton) return;

    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    menu.toggleAttribute("inert", !open);

    openButton.setAttribute("aria-expanded", String(open));
    openButton.setAttribute(
      "aria-label",
      open ? "Close menu" : "Open menu"
    );

    if (open) {
      closeButton.focus({ preventScroll: true });
    } else if (restoreFocus) {
      openButton.focus({ preventScroll: true });
    }
  };

  const closeAllMenus = () => {
    document.querySelectorAll(".agg-header").forEach((header) => {
      const menu = header.querySelector(".agg-header__mobile-menu");

      if (menu?.classList.contains("is-open")) {
        setMenuOpen(header, false);
      }
    });
  };

  // Управление мобильным меню
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const target = event.target;
    const header = target.closest(".agg-header");

    if (!header) {
      closeAllMenus();
      return;
    }

    if (target.closest(".agg-header__menu-open")) {
      const menu = header.querySelector(".agg-header__mobile-menu");
      const isOpen = menu?.classList.contains("is-open");

      setMenuOpen(header, !isOpen, isOpen);
      return;
    }

    if (target.closest(".agg-header__menu-close")) {
      setMenuOpen(header, false, true);
      return;
    }

    if (target.closest(".agg-header__mobile-menu a")) {
      setMenuOpen(header, false);
    }
  });

  // Закрытие по Escape
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    document.querySelectorAll(".agg-header").forEach((header) => {
      const menu = header.querySelector(".agg-header__mobile-menu");

      if (menu?.classList.contains("is-open")) {
        setMenuOpen(header, false, true);
      }
    });
  });

  // Сброс при переходе на десктоп
  const desktop = window.matchMedia("(min-width: 1200px)");

  desktop.addEventListener("change", (event) => {
    if (event.matches) {
      closeAllMenus();
    }
  });
})();
