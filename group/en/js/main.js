(() => {

  /* Header */

  function initHeader() {
    const header = document.querySelector(".agassi-group-header");

    if (!header || header.dataset.initialized === "true") return;

    const toggle = header.querySelector(
      ".agassi-group-header__toggle"
    );

    const menu = header.querySelector(
      ".agassi-group-header__mobile-menu"
    );

    if (!toggle || !menu) return;

    header.dataset.initialized = "true";

    const setMenuState = (open) => {
      header.classList.toggle("is-menu-open", open);

      document.body.classList.toggle(
        "agassi-group-menu-locked",
        open
      );

      toggle.setAttribute("aria-expanded", String(open));

      toggle.setAttribute(
        "aria-label",
        open ? "Close menu" : "Open menu"
      );

      menu.setAttribute("aria-hidden", String(!open));
      menu.toggleAttribute("inert", !open);
    };

    setMenuState(false);

    toggle.addEventListener("click", () => {
      setMenuState(
        !header.classList.contains("is-menu-open")
      );
    });

    menu.addEventListener("click", (event) => {
      if (
        event.target instanceof Element &&
        event.target.closest("a")
      ) {
        setMenuState(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        header.classList.contains("is-menu-open")
      ) {
        setMenuState(false);
        toggle.focus();
      }
    });

    const desktop = window.matchMedia("(min-width: 1200px)");

    desktop.addEventListener("change", (event) => {
      if (
        event.matches &&
        header.classList.contains("is-menu-open")
      ) {
        setMenuState(false);
      }
    });
  }


  /* Partners */

  function initPartners() {
    document
      .querySelectorAll(".agassi-group-partners")
      .forEach((section) => {

        if (section.dataset.initialized === "true") return;

        const viewport = section.querySelector(
          ".agassi-group-partners__viewport"
        );

        const track = section.querySelector(
          ".agassi-group-partners__track"
        );

        const prev = section.querySelector(
          ".agassi-group-partners__arrow--prev"
        );

        const next = section.querySelector(
          ".agassi-group-partners__arrow--next"
        );

        if (!viewport || !track || !prev || !next) return;

        const originals = [
          ...track.querySelectorAll(".agassi-group-partners__card")
        ];

        if (!originals.length) return;

        section.dataset.initialized = "true";

        originals.forEach((card) => {
          const clone = card.cloneNode(true);

          clone.setAttribute("aria-hidden", "true");
          clone.setAttribute("tabindex", "-1");

          clone
            .querySelectorAll("a, button, input, [tabindex]")
            .forEach((node) => {
              node.setAttribute("tabindex", "-1");
            });

          track.appendChild(clone);
        });

        let position = 0;
        let autoplay = !window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        let dragging = false;
        let pointerId = null;
        let startX = 0;
        let startPosition = 0;
        let dragDistance = 0;
        let lastTime = 0;
        let animation = null;

        const gap = () => {
          return parseFloat(getComputedStyle(track).gap) || 0;
        };

        const step = () => {
          return originals[0].getBoundingClientRect().width + gap();
        };

        const loopWidth = () => {
          return step() * originals.length;
        };

        function normalize() {
          const width = loopWidth();

          if (!width) return;

          position = ((position % width) + width) % width;
        }

        function render() {
          normalize();

          track.style.transform =
            `translate3d(${-position}px, 0, 0)`;
        }

        function move(direction) {
          autoplay = false;

          if (animation !== null) {
            cancelAnimationFrame(animation);
          }

          const width = loopWidth();

          if (!width) return;

          if (direction < 0 && position < step()) {
            position += width;
          }

          const from = position;
          const to = from + step() * direction;
          const start = performance.now();

          const duration = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
          ).matches ? 0 : 520;

          function frame(now) {
            const progress = duration
              ? Math.min((now - start) / duration, 1)
              : 1;

            const eased = 1 - Math.pow(1 - progress, 4);

            const current = from + (to - from) * eased;

            const loop = loopWidth();

            position = loop
              ? ((current % loop) + loop) % loop
              : current;

            track.style.transform =
              `translate3d(${-position}px, 0, 0)`;

            if (progress < 1) {
              animation = requestAnimationFrame(frame);
            } else {
              animation = null;
              normalize();
              render();
            }
          }

          animation = requestAnimationFrame(frame);
        }

        prev.addEventListener("click", () => move(-1));
        next.addEventListener("click", () => move(1));

        viewport.addEventListener("pointerdown", (event) => {
          if (
            event.pointerType === "mouse" &&
            event.button !== 0
          ) {
            return;
          }

          autoplay = false;

          if (animation !== null) {
            cancelAnimationFrame(animation);
          }

          animation = null;
          dragging = true;
          pointerId = event.pointerId;
          startX = event.clientX;
          startPosition = position;
          dragDistance = 0;

          viewport.classList.add("is-dragging");

          try {
            viewport.setPointerCapture(pointerId);
          } catch (_) {}
        });

        viewport.addEventListener("pointermove", (event) => {
          if (
            !dragging ||
            event.pointerId !== pointerId
          ) {
            return;
          }

          dragDistance = Math.abs(event.clientX - startX);

          position =
            startPosition -
            (event.clientX - startX);

          render();
        });

        function endDrag(event) {
          if (
            !dragging ||
            event.pointerId !== pointerId
          ) {
            return;
          }

          dragging = false;

          viewport.classList.remove("is-dragging");

          try {
            viewport.releasePointerCapture(pointerId);
          } catch (_) {}

          pointerId = null;

          render();
        }

        viewport.addEventListener("pointerup", endDrag);
        viewport.addEventListener("pointercancel", endDrag);

        track.addEventListener(
          "click",
          (event) => {
            if (dragDistance > 6) {
              event.preventDefault();
              event.stopPropagation();
            }

            dragDistance = 0;
          },
          true
        );

        viewport.addEventListener("dragstart", (event) => {
          event.preventDefault();
        });

        function autoFrame(now) {
          if (!lastTime) {
            lastTime = now;
          }

          const delta = Math.min(now - lastTime, 50);

          lastTime = now;

          if (
            autoplay &&
            !dragging &&
            animation === null &&
            !document.hidden
          ) {
            position += 28 * delta / 1000;
            render();
          }

          requestAnimationFrame(autoFrame);
        }

        window.addEventListener(
          "resize",
          render,
          { passive: true }
        );

        render();
        requestAnimationFrame(autoFrame);
      });
  }


  /* FAQ */

  function initFAQ() {
    document
      .querySelectorAll(".agassi-group-faq")
      .forEach((section) => {

        if (section.dataset.initialized === "true") return;

        const sharedIcon = section.querySelector(
          ".agassi-group-faq__shared-icon"
        );

        const entries = [
          ...section.querySelectorAll(
            ".agassi-group-faq__entry"
          )
        ];

        if (!entries.length) return;

        section.dataset.initialized = "true";

        function syncIcons() {
          const source = sharedIcon?.getAttribute("src")?.trim();

          entries.forEach((entry) => {
            const icon = entry.querySelector(
              ".agassi-group-faq__icon"
            );

            if (!icon) return;

            let image = icon.querySelector(
              ".agassi-group-faq__icon-image"
            );

            const fallback = icon.querySelector(
              ".agassi-group-faq__icon-fallback"
            );

            if (source) {
              if (!image) {
                image = document.createElement("img");
                image.className = "agassi-group-faq__icon-image";
                image.alt = "";
                image.setAttribute("aria-hidden", "true");
                icon.appendChild(image);
              }

              if (image.getAttribute("src") !== source) {
                image.src = source;
              }

              if (fallback) {
                fallback.hidden = true;
              }
            } else {
              if (image) {
                image.remove();
              }

              if (fallback) {
                fallback.hidden = false;
              }
            }
          });
        }

        syncIcons();

        if (sharedIcon && "MutationObserver" in window) {
          const observer = new MutationObserver(syncIcons);

          observer.observe(sharedIcon, {
            attributes: true,
            attributeFilter: ["src"]
          });
        }
      });
  }


  /* Инициализация */

  function init() {
    initHeader();
    initPartners();
    initFAQ();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }

})();
