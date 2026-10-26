(() => {
  "use strict";

  /* Header */

  function initHeader() {
    document.querySelectorAll(".agassi-group-header").forEach((header) => {
      if (header.dataset.initialized === "true") return;

      const toggle = header.querySelector(".agassi-group-header__toggle");
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

      setMenuState(false);

      toggle.addEventListener("click", () => {
        setMenuState(!header.classList.contains("is-menu-open"));
      });

      menu.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
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
        if (event.matches && header.classList.contains("is-menu-open")) {
          setMenuState(false);
        }
      });
    });
  }

  /* Partners */

  function initPartners() {
    document.querySelectorAll(".agassi-group-partners").forEach((section) => {
      if (section.dataset.initialized === "true") return;

      const viewport = section.querySelector(
        ".agassi-group-partners__viewport"
      );

      const track = section.querySelector(
        ".agassi-group-partners__track"
      );

      const previous = section.querySelector(
        ".agassi-group-partners__arrow--prev"
      );

      const next = section.querySelector(
        ".agassi-group-partners__arrow--next"
      );

      if (!viewport || !track || !previous || !next) return;

      const originalCards = Array.from(
        track.querySelectorAll(".agassi-group-partners__card")
      ).filter((card) => !card.hasAttribute("data-agassi-group-clone"));

      if (!originalCards.length) return;

      section.dataset.initialized = "true";

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

      originalCards.forEach((card) => {
        const clone = card.cloneNode(true);

        clone.dataset.agassiGroupClone = "true";
        clone.setAttribute("aria-hidden", "true");
        clone.setAttribute("tabindex", "-1");

        track.appendChild(clone);
      });

      let position = 0;
      let autoplay = !reducedMotion.matches;
      let dragging = false;
      let pointerId = null;
      let startX = 0;
      let startPosition = 0;
      let dragDistance = 0;
      let lastTime = 0;
      let manualAnimation = null;

      function getGap() {
        return parseFloat(window.getComputedStyle(track).gap) || 0;
      }

      function getStep() {
        const firstCard = originalCards[0];

        return firstCard.getBoundingClientRect().width + getGap();
      }

      function getLoopWidth() {
        return getStep() * originalCards.length;
      }

      function normalize() {
        const width = getLoopWidth();

        if (!width) return;

        position = ((position % width) + width) % width;
      }

      function render() {
        normalize();

        track.style.transform = `translate3d(${-position}px, 0, 0)`;
      }

      function cancelManualAnimation() {
        if (manualAnimation !== null) {
          window.cancelAnimationFrame(manualAnimation);
          manualAnimation = null;
        }
      }

      function move(direction) {
        autoplay = false;
        cancelManualAnimation();

        const width = getLoopWidth();

        if (!width) return;

        if (direction < 0 && position < getStep()) {
          position += width;
        }

        const from = position;
        const to = from + getStep() * direction;

        if (reducedMotion.matches) {
          position = to;
          render();
          return;
        }

        const started = performance.now();
        const duration = 520;

        function animate(now) {
          const progress = Math.min((now - started) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);

          position = from + (to - from) * eased;

          const loopWidth = getLoopWidth();

          if (loopWidth) {
            const visiblePosition =
              ((position % loopWidth) + loopWidth) % loopWidth;

            track.style.transform =
              `translate3d(${-visiblePosition}px, 0, 0)`;
          }

          if (progress < 1) {
            manualAnimation = window.requestAnimationFrame(animate);
          } else {
            manualAnimation = null;
            normalize();
            render();
          }
        }

        manualAnimation = window.requestAnimationFrame(animate);
      }

      previous.addEventListener("click", () => {
        move(-1);
      });

      next.addEventListener("click", () => {
        move(1);
      });

      viewport.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;

        autoplay = false;
        cancelManualAnimation();

        dragging = true;
        pointerId = event.pointerId;
        startX = event.clientX;
        startPosition = position;
        dragDistance = 0;

        viewport.classList.add("is-dragging");

        try {
          viewport.setPointerCapture(pointerId);
        } catch (error) {
          // Захват указателя может быть недоступен.
        }
      });

      viewport.addEventListener("pointermove", (event) => {
        if (!dragging || event.pointerId !== pointerId) return;

        const delta = event.clientX - startX;

        dragDistance = Math.abs(delta);
        position = startPosition - delta;

        render();
      });

      function endDrag(event) {
        if (!dragging) return;

        if (
          event &&
          pointerId !== null &&
          event.pointerId !== pointerId
        ) {
          return;
        }

        dragging = false;
        viewport.classList.remove("is-dragging");

        if (pointerId !== null) {
          try {
            viewport.releasePointerCapture(pointerId);
          } catch (error) {
            // Указатель мог быть освобождён браузером.
          }
        }

        pointerId = null;

        normalize();
        render();
      }

      viewport.addEventListener("pointerup", endDrag);
      viewport.addEventListener("pointercancel", endDrag);
      viewport.addEventListener("lostpointercapture", endDrag);

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
        if (!lastTime) lastTime = now;

        const delta = Math.min(now - lastTime, 50);

        lastTime = now;

        if (
          autoplay &&
          !dragging &&
          manualAnimation === null &&
          !reducedMotion.matches &&
          !document.hidden
        ) {
          position += (28 * delta) / 1000;
          render();
        }

        window.requestAnimationFrame(autoFrame);
      }

      window.addEventListener(
        "resize",
        () => {
          cancelManualAnimation();
          normalize();
          render();
        },
        { passive: true }
      );

      reducedMotion.addEventListener("change", (event) => {
        if (event.matches) {
          autoplay = false;
          cancelManualAnimation();
          render();
        }
      });

      render();
      window.requestAnimationFrame(autoFrame);
    });
  }

  /* FAQ */

  function initFAQ() {
    document.querySelectorAll(".agassi-group-faq").forEach((section) => {
      if (section.dataset.initialized === "true") return;

      const items = Array.from(
        section.querySelectorAll(".agassi-group-faq__item")
      );

      if (!items.length) return;

      section.dataset.initialized = "true";

      items.forEach((item) => {
        item.addEventListener("toggle", () => {
          if (!item.open) return;

          items.forEach((otherItem) => {
            if (otherItem !== item && otherItem.open) {
              otherItem.open = false;
            }
          });
        });
      });
    });
  }

  /* Инициализация */

  function init() {
    initHeader();
    initPartners();
    initFAQ();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
