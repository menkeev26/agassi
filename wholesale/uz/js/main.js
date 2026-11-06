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
    document.querySelectorAll('.agassi-wholesale-support').forEach(function (section) {
      if (section.dataset.agassiWholesaleMotionReady) return;
      section.dataset.agassiWholesaleMotionReady = 'true';

      if (
        window.self !== window.top ||
        !('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }

      section.classList.add('is-motion');

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          section.classList.add('is-visible');
          observer.disconnect();
        });
      }, { threshold: 0.2 });

      observer.observe(section.querySelector('.agassi-wholesale-support__surface') || section);
    });
  })();



  (function () {
    if (
      window.self !== window.top ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    var groups = [
      ['.agassi-wholesale-statement', []],
      ['.agassi-wholesale-numbers', ['__surface']],
      ['.agassi-wholesale-why', ['__layout']],
      ['.agassi-wholesale-support', []],
      ['.agassi-wholesale-products', ['__grid']],
      ['.agassi-wholesale-partners', ['__viewport', '__controls']],
      ['.agassi-wholesale-stories', ['__track', '__controls']],
      ['.agassi-wholesale-faq', ['__layout']],
      ['.agassi-wholesale-contact', ['__surface']],
      ['.agassi-wholesale-footer', ['__main', '__bottom']]
    ];

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    groups.forEach(function (group) {
      document.querySelectorAll(group[0]).forEach(function (section) {
        var prefix = group[0].slice(1);
        var title = section.querySelector('.' + prefix + '__title');

        if (title && !title.classList.contains('agassi-wholesale-reveal-text')) {
          title.classList.add('agassi-wholesale-reveal-text');
          observer.observe(title);
        }

        group[1].forEach(function (suffix, index) {
          var target = section.querySelector('.' + prefix + suffix);

          if (!target || target.classList.contains('agassi-wholesale-reveal')) return;

          target.classList.add('agassi-wholesale-reveal');
          target.style.setProperty('--agassi-wholesale-reveal-delay', ((index + 1) * 120) + 'ms');
          observer.observe(target);
        });
      });
    });
  })();



  (function () {
    document.querySelectorAll('.agassi-wholesale-partners').forEach(function (section) {
      if (section.dataset.agassiWholesalePartnersReady) return;
      section.dataset.agassiWholesalePartnersReady = 'true';

      var track = section.querySelector('.agassi-wholesale-partners__viewport');
      var inner = section.querySelector('.agassi-wholesale-partners__track');
      var prev = section.querySelector('.agassi-wholesale-partners__arrow--prev');
      var next = section.querySelector('.agassi-wholesale-partners__arrow--next');

      if (!track || !inner || !inner.firstElementChild || !prev || !next) return;

      var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      var autoplayDelay = 4000;
      var index = 0;
      var timer = 0;
      var autoplay = 0;

      function step() {
        var gap = parseFloat(getComputedStyle(inner).columnGap) || 0;
        return inner.firstElementChild.getBoundingClientRect().width + gap;
      }

      function maxScroll() {
        return Math.max(0, track.scrollWidth - track.clientWidth);
      }

      function lastIndex() {
        return Math.ceil((maxScroll() - 1) / step());
      }

      function updateButtons() {
        prev.disabled = track.scrollLeft <= 1;
        next.disabled = track.scrollLeft >= maxScroll() - 1;
      }

      function goTo(target) {
        index = Math.max(0, Math.min(lastIndex(), target));
        track.scrollTo({
          left: Math.min(index * step(), maxScroll()),
          behavior: reducedMotion.matches ? 'auto' : 'smooth'
        });
      }

      function stopAutoplay() {
        window.clearInterval(autoplay);
        autoplay = 0;
      }

      function startAutoplay() {
        if (reducedMotion.matches || window.self !== window.top) return;

        autoplay = window.setInterval(function () {
          if (document.hidden) return;
          goTo(index >= lastIndex() ? 0 : index + 1);
        }, autoplayDelay);
      }

      prev.addEventListener('click', function () {
        stopAutoplay();
        goTo(index - 1);
      });

      next.addEventListener('click', function () {
        stopAutoplay();
        goTo(index + 1);
      });

      track.addEventListener('scroll', function () {
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          index = Math.round(track.scrollLeft / step());
          updateButtons();
        }, 100);
      }, { passive: true });

      window.addEventListener('resize', function () {
        index = Math.round(track.scrollLeft / step());
        updateButtons();
      }, { passive: true });

      updateButtons();
      startAutoplay();
    });
  })();



  (function () {
    document.querySelectorAll('.agassi-wholesale-stories').forEach(function (section) {
      if (section.dataset.agassiWholesaleStoriesReady) return;
      section.dataset.agassiWholesaleStoriesReady = 'true';

      var track = section.querySelector('.agassi-wholesale-stories__track');
      var prev = section.querySelector('.agassi-wholesale-stories__arrow--prev');
      var next = section.querySelector('.agassi-wholesale-stories__arrow--next');

      if (!track || !track.firstElementChild || !prev || !next) return;

      var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      var index = 0;
      var timer = 0;

      function step() {
        var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return track.firstElementChild.getBoundingClientRect().width + gap;
      }

      function maxScroll() {
        return Math.max(0, track.scrollWidth - track.clientWidth);
      }

      function lastIndex() {
        return Math.ceil((maxScroll() - 1) / step());
      }

      function updateButtons() {
        prev.disabled = track.scrollLeft <= 1;
        next.disabled = track.scrollLeft >= maxScroll() - 1;
      }

      function goTo(target) {
        index = Math.max(0, Math.min(lastIndex(), target));
        track.scrollTo({
          left: Math.min(index * step(), maxScroll()),
          behavior: reducedMotion.matches ? 'auto' : 'smooth'
        });
      }

      prev.addEventListener('click', function () {
        goTo(index - 1);
      });

      next.addEventListener('click', function () {
        goTo(index + 1);
      });

      track.addEventListener('scroll', function () {
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          index = Math.round(track.scrollLeft / step());
          updateButtons();
        }, 100);
      }, { passive: true });

      window.addEventListener('resize', function () {
        index = Math.round(track.scrollLeft / step());
        updateButtons();
      }, { passive: true });

      // «Ўқиш»: полный текст отзыва раскрывается внутри карточки
      section.querySelectorAll('.agassi-wholesale-stories__card').forEach(function (card) {
        var quote = card.querySelector('.agassi-wholesale-stories__quote');
        var more = card.querySelector('.agassi-wholesale-stories__more');

        if (!quote || !more) return;

        var openLabel = more.textContent.trim();
        var closeLabel = more.getAttribute('data-close-label') || openLabel;

        function measure() {
          quote.style.setProperty('--agassi-wholesale-quote-height', quote.scrollHeight + 'px');
          var short = quote.scrollHeight <= quote.clientHeight + 1 && !card.classList.contains('is-open');

          if (!card.classList.contains('is-open')) {
            card.classList.toggle('is-short', short);
            more.hidden = short;
          }
        }

        measure();
        window.addEventListener('resize', measure, { passive: true });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

        more.addEventListener('click', function () {
          var open = !card.classList.contains('is-open');

            if (open) quote.style.setProperty('--agassi-wholesale-quote-height', quote.scrollHeight + 'px');
          card.classList.toggle('is-open', open);
          more.setAttribute('aria-expanded', open ? 'true' : 'false');
          more.textContent = open ? closeLabel : openLabel;
        });
      });

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
