/* Agassi Wholesale (UZ): общий скрипт всех блоков сайта.
   Каждая часть сама проверяет, есть ли её блок на странице. */
(function () {
  'use strict';

  function initViewport() {
    var section = document.querySelector('.agassi-wholesale-hero');
    if (!section) return;

    // На опубликованной странице высота задаётся в CSS через svh, скрипт нужен только внутри iframe редактора
    var framed = false;
    try { framed = window.parent !== window; } catch (error) { framed = true; }
    if (!framed) return;

    // В редакторе высота окна читается несколько раз и только растёт: так блок не «прыгает» и не остаётся короче экрана
    var height = 0;

    function grow() {
      var value = window.innerHeight;
      try { value = window.parent.innerHeight || value; } catch (error) {}
      if (value <= height) return;
      height = value;
      section.style.setProperty('--agassi-wholesale-viewport', height + 'px');
    }

    grow();
    window.addEventListener('load', grow);
    window.setTimeout(grow, 400);
    window.setTimeout(grow, 1200);
    try { window.parent.addEventListener('resize', grow); } catch (error) {}
  }

  function init() {
    initViewport();


  (function () {
    const slot = document.querySelector('.agassi-wholesale-header-slot');

    if (!slot || slot.dataset.agassiWholesaleReady === 'true') return;

    slot.dataset.agassiWholesaleReady = 'true';

    const headers = slot.querySelectorAll('.agassi-wholesale-header');
    const burger = slot.querySelector('.agassi-wholesale-header__burger');
    const menu = slot.querySelector('.agassi-wholesale-header__mobile-menu');
    const closeButton = slot.querySelector('.agassi-wholesale-header__mobile-close');
    const mobileLogo = slot.querySelector('.agassi-wholesale-header__mobile-logo');
    const desktopLogos = slot.querySelectorAll('.agassi-wholesale-header__logo');
    const mobileLinks = slot.querySelectorAll('.agassi-wholesale-header__mobile-nav a[href^="#"]');
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function openMenu() {
      slot.classList.add('is-menu-open');
      document.documentElement.classList.add('agassi-wholesale-scroll-locked');
      document.body.classList.add('agassi-wholesale-scroll-locked');

      menu?.setAttribute('aria-hidden', 'false');
      burger?.setAttribute('aria-expanded', 'true');
      burger?.setAttribute('aria-label', 'Менюни ёпиш');

      if (themeColor) {
        themeColor.content = '#8C0F14';
      }
    }

    function closeMenu() {
      slot.classList.remove('is-menu-open');
      document.documentElement.classList.remove('agassi-wholesale-scroll-locked');
      document.body.classList.remove('agassi-wholesale-scroll-locked');

      menu?.setAttribute('aria-hidden', 'true');
      burger?.setAttribute('aria-expanded', 'false');
      burger?.setAttribute('aria-label', 'Менюни очиш');

      if (themeColor) {
        themeColor.content = '#F4F1EA';
      }
    }

    function scrollToTop() {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: reducedMotion.matches ? 'auto' : 'smooth'
      });
    }

    function scrollToSection(hash) {
      const target = document.querySelector(hash);

      if (!target) return;

      target.scrollIntoView({
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
        block: 'start'
      });
    }

    burger?.addEventListener('click', function () {
      if (slot.classList.contains('is-menu-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    closeButton?.addEventListener('click', closeMenu);

    mobileLogo?.addEventListener('click', function (event) {
      event.preventDefault();
      closeMenu();
      scrollToTop();
    });

    desktopLogos.forEach(function (logo) {
      logo.addEventListener('click', function (event) {
        event.preventDefault();
        scrollToTop();
      });
    });

    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function (event) {
        const hash = link.getAttribute('href');

        if (!hash || hash === '#') return;

        event.preventDefault();
        closeMenu();
        scrollToSection(hash);
      });
    });

    function updateHeaderState() {
      headers.forEach(function (header) {
        header.classList.toggle('is-scrolled', window.scrollY > 12);
      });
    }

    updateHeaderState();

    window.addEventListener('scroll', updateHeaderState, {
      passive: true
    });

    window.addEventListener('resize', function () {
      if (
        window.innerWidth > 1200 &&
        slot.classList.contains('is-menu-open')
      ) {
        closeMenu();
      }
    });
  })();



  (function () {
    document.querySelectorAll('.agassi-wholesale-statement').forEach(function (section) {
      if (section.dataset.agassiWholesaleFlowersReady === 'true') return;
      section.dataset.agassiWholesaleFlowersReady = 'true';
      var layer = section.querySelector('.agassi-wholesale-statement__flowers');
      var flowers = Array.prototype.slice.call(section.querySelectorAll('.agassi-wholesale-statement__flower'));
      if (!layer || !flowers.length) return;
      var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      var distances = [105, 145, 120, 175, 150, 130];
      var bounds = [];
      var frame = 0;
      var measureNeeded = true;
      function limits() {
        var width = window.innerWidth;
        if (width <= 360) return [6, 6, 6, 22, 18, 18];
        if (width <= 480) return [8, 8, 8, 26, 20, 20];
        if (width <= 640) return [8, 8, 8, 34, 28, 28];
        if (width <= 960) return [10, 10, 10, 54, 42, 40];
        return distances;
      }
      function measure() {
        flowers.forEach(function (flower, i) {
          section.style.setProperty('--agassi-wholesale-fall-' + (i + 1), '0px');
        });
        var area = layer.getBoundingClientRect();
        var caps = limits();
        bounds = flowers.map(function (flower, i) {
          var rect = flower.getBoundingClientRect();
          var minimum = Math.max(0, area.top + 6 - rect.top);
          var maximum = Math.max(minimum, area.bottom - 6 - rect.bottom);
          return { min: minimum, max: Math.max(minimum, Math.min(caps[i], maximum)) };
        });
        measureNeeded = false;
      }
      function update() {
        frame = 0;
        if (reduceMotion.matches) {
          flowers.forEach(function (flower, i) {
            section.style.setProperty('--agassi-wholesale-fall-' + (i + 1), '0px');
          });
          return;
        }
        if (measureNeeded) measure();
        var rect = section.getBoundingClientRect();
        var progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        progress = Math.max(0, Math.min(1, progress));
        flowers.forEach(function (flower, i) {
          var limit = bounds[i];
          var fall = limit.min + progress * (limit.max - limit.min);
          section.style.setProperty('--agassi-wholesale-fall-' + (i + 1), fall + 'px');
        });
      }
      function schedule() {
        if (!frame) frame = window.requestAnimationFrame(update);
      }
      function invalidate() {
        measureNeeded = true;
        schedule();
      }
      flowers.forEach(function (flower) {
        flower.addEventListener('load', invalidate);
      });
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', invalidate, { passive: true });
      window.addEventListener('load', invalidate);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(invalidate);
      if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', invalidate);
      if (window.ResizeObserver) {
        var observer = new ResizeObserver(invalidate);
        observer.observe(layer);
        flowers.forEach(function (flower) { observer.observe(flower); });
      }
      update();
    });
  })();



  (function () {
    document.querySelectorAll('.agassi-wholesale-partners').forEach(function (section) {
      if (section.dataset.agassiWholesalePartnersReady) return;
      section.dataset.agassiWholesalePartnersReady = 'true';

      var viewport = section.querySelector('.agassi-wholesale-partners__viewport');
      var track = section.querySelector('.agassi-wholesale-partners__track');
      var prev = section.querySelector('.agassi-wholesale-partners__arrow--prev');
      var next = section.querySelector('.agassi-wholesale-partners__arrow--next');

      if (!viewport || !track || !prev || !next) return;

      var originalCards = Array.prototype.slice.call(track.children);

      if (!originalCards.length) return;

      originalCards.forEach(function (card) {
        var clone = card.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.setAttribute('tabindex', '-1');
        track.appendChild(clone);
      });

      var position = 0;
      var autoplay = true;
      var dragging = false;
      var pointerId = null;
      var startX = 0;
      var startPosition = 0;
      var lastTime = 0;
      var manualAnimation = null;
      var dragDistance = 0;

      var reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      function gap() {
        return parseFloat(getComputedStyle(track).gap) || 0;
      }

      function step() {
        return originalCards[0].getBoundingClientRect().width + gap();
      }

      function loopWidth() {
        return step() * originalCards.length;
      }

      function normalize() {
        var width = loopWidth();

        if (!width) return;

        while (position >= width) {
          position -= width;
        }

        while (position < 0) {
          position += width;
        }
      }

      function render() {
        normalize();

        track.style.transform =
          'translate3d(' + (-position) + 'px,0,0)';
      }

      function stopAutoplay() {
        autoplay = false;
      }

      function cancelManualAnimation() {
        if (manualAnimation !== null) {
          cancelAnimationFrame(manualAnimation);
          manualAnimation = null;
        }
      }

      function move(direction) {
        stopAutoplay();
        cancelManualAnimation();

        var width = loopWidth();

        if (!width) return;

        var from = position;
        var to = position + step() * direction;

        if (direction < 0 && to < 0) {
          position += width;
          from = position;
          to = position + step() * direction;
        }

        var started = performance.now();
        var duration = 520;

        function frame(now) {
          var progress = Math.min(
            (now - started) / duration,
            1
          );

          var eased =
            1 - Math.pow(1 - progress, 4);

          position =
            from +
            (to - from) * eased;

          render();

          if (progress < 1) {
            manualAnimation =
              requestAnimationFrame(frame);
          } else {
            manualAnimation = null;
            normalize();
            render();
          }
        }

        manualAnimation =
          requestAnimationFrame(frame);
      }

      prev.addEventListener('click', function () {
        move(-1);
      });

      next.addEventListener('click', function () {
        move(1);
      });

      viewport.addEventListener('pointerdown', function (event) {
        if (
          event.pointerType === 'mouse' &&
          event.button !== 0
        ) {
          return;
        }

        stopAutoplay();
        cancelManualAnimation();

        dragging = true;
        pointerId = event.pointerId;
        startX = event.clientX;
        startPosition = position;
        dragDistance = 0;

        viewport.classList.add('is-dragging');

        try {
          viewport.setPointerCapture(pointerId);
        } catch (error) {}
      });

      viewport.addEventListener('pointermove', function (event) {
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
        if (!dragging) return;

        if (
          event &&
          pointerId !== null &&
          event.pointerId !== pointerId
        ) {
          return;
        }

        dragging = false;

        viewport.classList.remove('is-dragging');

        if (pointerId !== null) {
          try {
            viewport.releasePointerCapture(pointerId);
          } catch (error) {}
        }

        pointerId = null;

        normalize();
        render();
      }

      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);

      track.addEventListener('click', function (event) {
        if (dragDistance > 6) {
          event.preventDefault();
          event.stopPropagation();
        }

        dragDistance = 0;
      });

      viewport.addEventListener('dragstart', function (event) {
        event.preventDefault();
      });

      function autoFrame(now) {
        if (!lastTime) {
          lastTime = now;
        }

        var delta = Math.min(
          now - lastTime,
          50
        );

        lastTime = now;

        if (
          autoplay &&
          !dragging &&
          manualAnimation === null &&
          !reducedMotion
        ) {
          position += 28 * delta / 1000;
          render();
        }

        requestAnimationFrame(autoFrame);
      }

      window.addEventListener(
        'resize',
        function () {
          normalize();
          render();
        },
        { passive: true }
      );

      render();
      requestAnimationFrame(autoFrame);
    });
  })();



  (function () {
    document.querySelectorAll('.agassi-wholesale-stories').forEach(function (section) {
      if (section.dataset.agassiWholesaleStoriesReady) return;
      section.dataset.agassiWholesaleStoriesReady = 'true';

      var track = section.querySelector('.agassi-wholesale-stories__track');
      var cards = Array.prototype.slice.call(
        section.querySelectorAll('.agassi-wholesale-stories__card')
      );
      var prev = section.querySelector('.agassi-wholesale-stories__arrow--prev');
      var next = section.querySelector('.agassi-wholesale-stories__arrow--next');

      if (!track || !cards.length || !prev || !next) return;

      var scrollTimer = null;

      function getCardPosition(index) {
        var trackRect = track.getBoundingClientRect();
        var cardRect = cards[index].getBoundingClientRect();

        return track.scrollLeft + cardRect.left - trackRect.left;
      }

      function getClosestIndex() {
        var current = track.scrollLeft;
        var closestIndex = 0;
        var closestDistance = Infinity;

        cards.forEach(function (card, index) {
          var position = getCardPosition(index);
          var distance = Math.abs(position - current);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });

        return closestIndex;
      }

      function getLastReachableIndex() {
        var maxScroll = Math.max(
          0,
          track.scrollWidth - track.clientWidth
        );

        var lastIndex = 0;

        cards.forEach(function (card, index) {
          if (getCardPosition(index) <= maxScroll + 2) {
            lastIndex = index;
          }
        });

        return lastIndex;
      }

      function updateButtons() {
        var maxScroll = Math.max(
          0,
          track.scrollWidth - track.clientWidth
        );

        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= maxScroll - 2;
      }

      function goToCard(index) {
        var lastIndex = getLastReachableIndex();

        index = Math.max(
          0,
          Math.min(lastIndex, index)
        );

        var maxScroll = Math.max(
          0,
          track.scrollWidth - track.clientWidth
        );

        var target = Math.min(
          getCardPosition(index),
          maxScroll
        );

        track.scrollTo({
          left: target,
          behavior: 'smooth'
        });
      }

      prev.addEventListener('click', function () {
        var index = getClosestIndex();

        if (getCardPosition(index) < track.scrollLeft - 2) {
          goToCard(index);
        } else {
          goToCard(index - 1);
        }
      });

      next.addEventListener('click', function () {
        var index = getClosestIndex();

        if (getCardPosition(index) > track.scrollLeft + 2) {
          goToCard(index);
        } else {
          goToCard(index + 1);
        }
      });

      track.addEventListener(
        'scroll',
        function () {
          window.clearTimeout(scrollTimer);

          scrollTimer = window.setTimeout(
            updateButtons,
            80
          );
        },
        { passive: true }
      );

      window.addEventListener(
        'resize',
        function () {
          updateButtons();
        },
        { passive: true }
      );

      updateButtons();
    });
  })();



  (function () {
    var faqBlocks = document.querySelectorAll('.agassi-wholesale-faq');

    faqBlocks.forEach(function (faq) {
      if (faq.dataset.agassiWholesaleFaqReady === 'true') return;

      faq.dataset.agassiWholesaleFaqReady = 'true';

      var iconSource = faq.querySelector('.agassi-wholesale-faq__icon-source .agassi-wholesale-faq__icon-image');

      if (iconSource) {
        faq.querySelectorAll('.agassi-wholesale-faq__icon').forEach(function (icon) {
          if (icon.querySelector('img')) return;

          var image = iconSource.cloneNode(false);

          image.removeAttribute('aria-label');
          image.setAttribute('alt', '');
          icon.appendChild(image);
        });
      }

      var entries = faq.querySelectorAll('.agassi-wholesale-faq__item');
      var items = faq.querySelectorAll('.agassi-wholesale-faq__head');
      var list = faq.querySelector('.agassi-wholesale-faq__list');
      var resizeTimer;

      function syncVisualHeight() {
        if (!list || !items.length) return;

        if (window.innerWidth <= 960) {
          faq.style.removeProperty('--agassi-wholesale-faq-visual-height');
          return;
        }

        var totalHeight = 0;

        items.forEach(function (item) {
          totalHeight += item.offsetHeight;
        });

        var listStyles = window.getComputedStyle(list);
        var gap = parseFloat(listStyles.rowGap || listStyles.gap) || 0;

        totalHeight += gap * (items.length - 1);

        faq.style.setProperty(
          '--agassi-wholesale-faq-visual-height',
          totalHeight + 'px'
        );
      }

      entries.forEach(function (entry) {
        var button = entry.querySelector('.agassi-wholesale-faq__question');

        if (!button) return;

        button.addEventListener('click', function () {
          var isOpen = entry.classList.contains('is-open');

          entries.forEach(function (otherEntry) {
            var otherButton = otherEntry.querySelector('.agassi-wholesale-faq__question');

            otherEntry.classList.remove('is-open');

            if (otherButton) {
              otherButton.setAttribute('aria-expanded', 'false');
            }
          });

          if (!isOpen) {
            entry.classList.add('is-open');
            button.setAttribute('aria-expanded', 'true');
          }
        });
      });

      syncVisualHeight();

      window.addEventListener('load', syncVisualHeight);

      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(function () {
          syncVisualHeight();
        }, 100);
      });
    });
  })();

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
