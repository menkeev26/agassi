(() => {
  const root = document.documentElement;

  if (root.dataset.agassiGroupHeaderReady === "true") return;
  root.dataset.agassiGroupHeaderReady = "true";

  const selector = ".agassi-group-header";

  const setMenuOpen = (header, open, restoreFocus = false) => {
    const menu = header.querySelector(".agassi-group-header__mobile-menu");
    const openButton = header.querySelector(".agassi-group-header__menu-open");
    const closeButton = header.querySelector(".agassi-group-header__menu-close");

    if (!menu || !openButton || !closeButton) return;

    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    menu.toggleAttribute("inert", !open);

    openButton.setAttribute("aria-expanded", String(open));

    if (open) {
      closeButton.focus({ preventScroll: true });
    } else if (restoreFocus) {
      openButton.focus({ preventScroll: true });
    }
  };

  const closeAllMenus = () => {
    document.querySelectorAll(selector).forEach((header) => {
      const menu = header.querySelector(".agassi-group-header__mobile-menu");

      if (menu?.classList.contains("is-open")) {
        setMenuOpen(header, false);
      }
    });
  };

  // Мобильное меню
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const target = event.target;
    const header = target.closest(selector);

    if (!header) {
      closeAllMenus();
      return;
    }

    const openButton = target.closest(".agassi-group-header__menu-open");
    const closeButton = target.closest(".agassi-group-header__menu-close");

    if (openButton) {
      const menu = header.querySelector(".agassi-group-header__mobile-menu");
      const isOpen = menu?.classList.contains("is-open");

      setMenuOpen(header, !isOpen, isOpen);
      return;
    }

    if (closeButton) {
      setMenuOpen(header, false, true);
      return;
    }

    if (target.closest(".agassi-group-header__mobile-menu a")) {
      setMenuOpen(header, false);
    }
  });

  // Закрытие по Escape
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    document.querySelectorAll(selector).forEach((header) => {
      const menu = header.querySelector(".agassi-group-header__mobile-menu");

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
})()
