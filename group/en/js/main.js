(() => {
  /* Header */

  function initHeader() {
    const header = document.querySelector(".agassi-group-header");

    if (!header || header.dataset.initialized === "true") return;

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
    document.querySelectorAll(".agassi-group-partners").forEach((section) => {
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

      const count = originals.length;

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

      let index = 0;
      let position = 0;

      let dragging = false;
      let pointerId = null;
      let startX = 0;
      let startPosition = 0;
      let dragDistance = 0;
      let suppressClick = false;

      let animation = null;

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

      function getGap() {
        return parseFloat(getComputedStyle(track).columnGap) || 0;
      }

      function getStep() {
        return originals[0].getBoundingClientRect().width + getGap();
      }

      function getLoopWidth() {
        return getStep() * count;
      }

      function render() {
        track.style.transform = `translate3d(${-position}px, 0, 0)`;
      }

      function cancelMove() {
        if (animation !== null) {
          cancelAnimationFrame(animation);
          animation = null;
        }
      }

      function normalize() {
        const loopWidth = getLoopWidth();

        if (!loopWidth) return;

        while (position < 0) {
          position += loopWidth;
          index += count;
        }

        while (position >= loopWidth) {
          position -= loopWidth;
          index -= count;
        }

        index = ((index % count) + count) % count;
      }

      function animateTo(target, onComplete) {
        cancelMove();

        const from = position;
        const distance = target - from;
        const duration = reducedMotion.matches ? 0 : 480;
        const start = performance.now();

        if (duration === 0) {
          position = target;
          render();

          if (onComplete) onComplete();

          return;
        }

        function frame(now) {
          const progress = Math.min(
            (now - start) / duration,
            1
          );

          const eased = 1 - Math.pow(1 - progress, 4);

          position = from + distance * eased;
          render();

          if (progress < 1) {
            animation = requestAnimationFrame(frame);
          } else {
            animation = null;
            position = target;

            if (onComplete) onComplete();

            render();
          }
        }

        animation = requestAnimationFrame(frame);
      }

      function goTo(targetIndex) {
        if (dragging) return;

        cancelMove();

        const step = getStep();
        const loopWidth = getLoopWidth();

        if (!step || !loopWidth) return;

        index = targetIndex;

        if (index < 0) {
          position += loopWidth;
          index += count;
        }

        if (index >= count) {
          position -= loopWidth;
          index -= count;
        }

        const target = index * step;

        animateTo(target, () => {
          normalize();
          position = index * step;
          render();
        });
      }

      function move(direction) {
        if (dragging) return;

        const step = getStep();

        if (!step) return;

        const currentIndex = Math.round(position / step);

        goTo(currentIndex + direction);
      }

      prev.addEventListener("click", () => {
        move(-1);
      });

      next.addEventListener("click", () => {
        move(1);
      });

      viewport.addEventListener("pointerdown", (event) => {
        if (
          event.pointerType === "mouse" &&
          event.button !== 0
        ) {
          return;
        }

        cancelMove();

        dragging = true;
        pointerId = event.pointerId;
        startX = event.clientX;
        startPosition = position;
        dragDistance = 0;
        suppressClick = false;

        viewport.classList.add("is-dragging");

        try {
          viewport.setPointerCapture(pointerId);
        } catch (_) {}
      });

      viewport.addEventListener("pointermove", (event) => {
        if (!dragging || event.pointerId !== pointerId) return;

        const delta = event.clientX - startX;

        dragDistance = Math.abs(delta);
        position = startPosition - delta;

        render();
      });

      function endDrag(event) {
        if (!dragging || event.pointerId !== pointerId) return;

        dragging = false;
        pointerId = null;

        viewport.classList.remove("is-dragging");

        try {
          viewport.releasePointerCapture(event.pointerId);
        } catch (_) {}

        const step = getStep();

        if (!step) return;

        const delta = event.clientX - startX;
        const threshold = Math.min(step / 4, 64);

        let targetIndex = Math.round(startPosition / step);

        if (delta <= -threshold) {
          targetIndex += 1;
        } else if (delta >= threshold) {
          targetIndex -= 1;
        }

        suppressClick = dragDistance > 6;

        goTo(targetIndex);
      }

      viewport.addEventListener("pointerup", endDrag);
      viewport.addEventListener("pointercancel", endDrag);

      track.addEventListener(
        "click",
        (event) => {
          if (suppressClick) {
            event.preventDefault();
            event.stopPropagation();
          }

          suppressClick = false;
        },
        true
      );

      viewport.addEventListener("dragstart", (event) => {
        event.preventDefault();
      });

      window.addEventListener(
        "resize",
        () => {
          cancelMove();

          const step = getStep();

          if (!step) return;

          normalize();

          position = index * step;
          render();
        },
        { passive: true }
      );

      render();
    });
  }

  /* FAQ */

  function initFAQ() {
    document.querySelectorAll(".agassi-group-faq").forEach((section) => {
      if (section.dataset.initialized === "true") return;

      const entries = [
        ...section.querySelectorAll(
          "details.agassi-group-faq__entry"
        )
      ];

      const sharedIcon = section.querySelector(
        ".agassi-group-faq__shared-icon"
      );

      if (!entries.length) return;

      section.dataset.initialized = "true";

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

      const states = new WeakMap();

      function syncIcons() {
        const source = sharedIcon
          ?.getAttribute("src")
          ?.trim();

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

              image.className =
                "agassi-group-faq__icon-image";

              image.alt = "";

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

      function setOpen(entry, open) {
        const answer = entry.querySelector(
          ".agassi-group-faq__answer"
        );

        if (!answer) return;

        let state = states.get(entry);

        if (!state) {
          state = {
            open: entry.open,
            animation: null
          };

          states.set(entry, state);
        }

        if (state.open === open && !state.animation) {
          return;
        }

        const from = answer.getBoundingClientRect().height;

        if (state.animation) {
          state.animation.cancel();
          state.animation = null;
        }

        state.open = open;

        if (open) {
          entry.open = true;
        }

        const to = open ? answer.scrollHeight : 0;

        if (
          reducedMotion.matches ||
          Math.abs(to - from) < 1
        ) {
          answer.style.height = open ? "auto" : "0px";
          answer.style.opacity = open ? "1" : "0";

          if (!open) {
            entry.open = false;
          }

          return;
        }

        answer.style.height = `${from}px`;

        const animation = answer.animate(
          [
            {
              height: `${from}px`,
              opacity: open ? 0 : 1
            },
            {
              height: `${to}px`,
              opacity: open ? 1 : 0
            }
          ],
          {
            duration: 400,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)"
          }
        );

        state.animation = animation;

        animation.onfinish = () => {
          if (state.animation !== animation) {
            return;
          }

          state.animation = null;

          answer.style.height = open ? "auto" : "0px";
          answer.style.opacity = open ? "1" : "0";

          if (!open) {
            entry.open = false;
          }
        };
      }

      entries.forEach((entry) => {
        const summary = entry.querySelector(
          ".agassi-group-faq__question"
        );

        const answer = entry.querySelector(
          ".agassi-group-faq__answer"
        );

        if (!summary || !answer) return;

        const initialOpen = entry.open;

        states.set(entry, {
          open: initialOpen,
          animation: null
        });

        answer.style.height = initialOpen ? "auto" : "0px";
        answer.style.opacity = initialOpen ? "1" : "0";

        summary.addEventListener("click", (event) => {
          event.preventDefault();

          const shouldOpen = !states.get(entry).open;

          entries.forEach((other) => {
            if (other !== entry) {
              setOpen(other, false);
            }
          });

          setOpen(entry, shouldOpen);
        });
      });

      syncIcons();

      if (
        sharedIcon &&
        "MutationObserver" in window
      ) {
        new MutationObserver(syncIcons).observe(sharedIcon, {
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
