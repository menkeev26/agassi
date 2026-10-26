(() => {
  const initializeHeader = () => {
    const header = document.querySelector(".agassi-group-header");

    if (!header || header.dataset.agassiGroupInitialized === "true") {
      return;
    }

    const toggle = header.querySelector(
      ".agassi-group-header__menu-toggle"
    );

    const menu = header.querySelector(
      ".agassi-group-header__mobile-menu"
    );

    if (!toggle || !menu) {
      return;
    }

    header.dataset.agassiGroupInitialized = "true";

    const desktop = window.matchMedia("(min-width: 1200px)");

    const setMenuState = (open) => {
      header.classList.toggle("is-menu-open", open);

      document.body.classList.toggle(
        "agassi-group-menu-locked",
        open
      );

      toggle.setAttribute(
        "aria-expanded",
        String(open)
      );

      toggle.setAttribute(
        "aria-label",
        open ? "Close menu" : "Open menu"
      );

      menu.setAttribute(
        "aria-hidden",
        String(!open)
      );

      menu.toggleAttribute("inert", !open);
    };

    // Переключение меню
    toggle.addEventListener("click", () => {
      const isOpen = header.classList.contains("is-menu-open");

      setMenuState(!isOpen);
    });

    // Закрытие по ссылке
    menu.addEventListener("click", (event) => {
      const link = event.target.closest("a");

      if (!link) {
        return;
      }

      setMenuState(false);
    });

    // Закрытие по Escape
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (!header.classList.contains("is-menu-open")) {
        return;
      }

      setMenuState(false);
      toggle.focus();
    });

    // Закрытие при переходе на десктоп
    desktop.addEventListener("change", (event) => {
      if (event.matches) {
        setMenuState(false);
      }
    });

    setMenuState(false);
  };

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeHeader,
      { once: true }
    );
  } else {
    initializeHeader();
  }
})();
