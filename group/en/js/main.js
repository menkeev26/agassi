(() => {
  "use strict";

  const initHeader = () => {
    const header = document.querySelector(".agassi-group-header");

    if (!header || header.dataset.initialized === "true") return;

    const toggle = header.querySelector(".agassi-group-header__toggle");
    const navigation = header.querySelector(".agassi-group-header__nav");

    if (!toggle || !navigation) return;

    header.dataset.initialized = "true";

    const setMenu = (open) => {
      header.classList.toggle("is-menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

      document.body.classList.toggle("agassi-group-menu-locked", open);

      if (open) {
        navigation.removeAttribute("inert");
      } else if (window.innerWidth <= 1199) {
        navigation.setAttribute("inert", "");
      } else {
        navigation.removeAttribute("inert");
      }
    };

    toggle.addEventListener("click", () => {
      setMenu(!header.classList.contains("is-menu-open"));
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && header.classList.contains("is-menu-open")) {
        setMenu(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1199) {
        setMenu(false);
      } else if (!header.classList.contains("is-menu-open")) {
        navigation.setAttribute("inert", "");
      }
    });

    setMenu(false);
  };

  const initPartners = () => {
    document.querySelectorAll(".agassi-group-partners").forEach((section) => {
      if (section.dataset.initialized === "true") return;

      const viewport = section.querySelector(".agassi-group-partners__viewport");
      const track = section.querySelector(".agassi-group-partners__track");
      const prev = section.querySelector(".agassi-group-partners__arrow--prev");
      const next = section.querySelector(".agassi-group-partners__arrow--next");

      if (!viewport || !track || !prev || !next) return;

      const originalCards = Array.from(track.children);
      const count = originalCards.length;

      if (count < 2) {
        prev.disabled = true;
        next.disabled = true;
        return;
      }

      section.dataset.initialized = "true";

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

      const createClone = (card) => {
        const clone = card.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.setAttribute("inert", "");
        clone.dataset.clone = "true";
        return clone;
      };

      const before = document.createDocumentFragment();
      const after = document.createDocumentFragment();

      originalCards.forEach((card) => {
        before.appendChild(createClone(card));
        after.appendChild(createClone(card));
      });

      track.prepend(before);
      track.append(after);

      let index = count;
      let step = 0;
      let position = 0;
      let dragging = false;
      let pointerId = null;
      let startX = 0;
      let startPosition = 0;
      let moved = false;
      let suppressClick = false;
      let resizeFrame = 0;

      const duration = reducedMotion.matches ? 0 : 400;

      const getStep = () => {
        const card = track.querySelector(".agassi-group-partners__card");
        if (!card) return 0;

        const styles = getComputedStyle(track);
        const gap = parseFloat(styles.columnGap) || 0;

        return card.getBoundingClientRect().width + gap;
      };

      const render = (animate = true) => {
        track.style.transition = animate && !reducedMotion.matches
          ? `transform ${duration}ms ease`
          : "none";

        position = -index * step;
        track.style.transform = `translate3d(${position}px, 0, 0)`;
      };

      const normalize = () => {
        if (index >= count * 2) {
          index -= count;
          render(false);
        } else if (index < count) {
          index += count;
          render(false);
        }
      };

      const move = (direction) => {
        if (dragging || !step) return;

        normalize();
        index += direction;
        render(true);

        if (reducedMotion.matches) normalize();
      };

      const updateSize = () => {
        step = getStep();
        normalize();
        render(false);
      };

      track.addEventListener("transitionend", (event) => {
        if (event.target !== track || event.propertyName !== "transform") return;
        normalize();
      });

      prev.addEventListener("click", () => move(-1));
      next.addEventListener("click", () => move(1));

      viewport.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        }
      });

      viewport.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if (!step) return;

        dragging = true;
        moved = false;
        pointerId = event.pointerId;
        startX = event.clientX;
        startPosition = position;

        track.style.transition = "none";
        viewport.classList.add("is-dragging");

        if (event.pointerType === "mouse") {
          viewport.setPointerCapture(event.pointerId);
        }
      });

      viewport.addEventListener("pointermove", (event) => {
        if (!dragging || event.pointerId !== pointerId) return;

        const delta = event.clientX - startX;

        if (Math.abs(delta) > 8) moved = true;
        if (!moved) return;

        position = startPosition + delta;
        track.style.transform = `translate3d(${position}px, 0, 0)`;
      });

      const endDrag = (event) => {
        if (!dragging || event.pointerId !== pointerId) return;

        const delta = event.clientX - startX;

        dragging = false;
        pointerId = null;

        viewport.classList.remove("is-dragging");

        if (moved) {
          const cardsMoved = Math.round(Math.abs(delta) / step);
          const amount = Math.max(1, cardsMoved);

          index += delta < 0 ? amount : -amount;

          index = Math.max(0, Math.min(index, count * 3 - 1));

          suppressClick = true;
        }

        render(true);

        if (reducedMotion.matches) normalize();

        if (viewport.hasPointerCapture?.(event.pointerId)) {
          viewport.releasePointerCapture(event.pointerId);
        }
      };

      viewport.addEventListener("pointerup", endDrag);
      viewport.addEventListener("pointercancel", endDrag);

      viewport.addEventListener("click", (event) => {
        if (!suppressClick) return;

        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
      }, true);

      viewport.addEventListener("dragstart", (event) => {
        event.preventDefault();
      });

      window.addEventListener("resize", () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(updateSize);
      });

      updateSize();
    });
  };

  const init = () => {
    initHeader();
    initPartners();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
