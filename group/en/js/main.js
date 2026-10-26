(() => {
  const header = document.querySelector(".agassi-group-header");

  if (!header || header.dataset.initialized === "true") return;

  const toggle = header.querySelector(".agassi-group-header__menu-toggle");
  const menu = header.querySelector(".agassi-group-header__mobile-menu");

  if (!toggle || !menu) return;

  header.dataset.initialized = "true";

  const setMenuState = (open) => {
    header.classList.toggle("is-menu-open", open);
    document.body.classList.toggle("agassi-group-menu-locked", open);

    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

    menu.setAttribute("aria-hidden", String(!open));
    menu.toggleAttribute("inert", !open);
  };

  // Открытие и закрытие
  toggle.addEventListener("click", () => {
    const open = !header.classList.contains("is-menu-open");
    setMenuState(open);
  });

  // Закрытие по ссылке
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      setMenuState(false);
    }
  });

  // Закрытие по Escape
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!header.classList.contains("is-menu-open")) return;

    setMenuState(false);
    toggle.focus();
  });

  // Сброс при переходе на десктоп
  const desktop = window.matchMedia("(min-width: 1200px)");

  desktop.addEventListener("change", (event) => {
    if (event.matches) {
      setMenuState(false);
    }
  });
})();
