(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const isFramed = window.self !== window.top;
  const canAnimate = () => !isFramed && !reducedMotion.matches;
  const scrollBehavior = () => (reducedMotion.matches ? 'auto' : 'smooth');

  const once = (element, key) => {
    if (element.dataset[key]) return false;
    element.dataset[key] = 'true';
    return true;
  };

  const onResize = (callback) => {
    let frame = 0;

    window.addEventListener('resize', () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(callback);
    }, { passive: true });
  };

  const cssToken = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  function initViewport() {
    const section = document.querySelector('.agassi-wholesale-hero');

    if (!section || !isFramed) return;

    let height = 0;

    const grow = () => {
      let value = window.innerHeight;

      try { value = window.parent.innerHeight || value; } catch {}

      if (value <= height) return;

      height = value;
      section.style.setProperty('--agassi-wholesale-viewport', `${height}px`);
    };

    grow();
    window.addEventListener('load', grow);
    setTimeout(grow, 400);
    setTimeout(grow, 1200);

    try { window.parent.addEventListener('resize', grow); } catch {}
  }

  const EDITOR_LABELS = new Set([
    'Автор', 'Бренд', 'Город', 'Должность', 'Заголовок', 'Изображение', 'Иконка', 'Карточка', 'Карточки',
    'Категория', 'Кнопка', 'Количество продуктов', 'Колонки', 'Контактные данные', 'Контакты', 'Контент',
    'Логотип', 'Надзаголовок', 'Нижняя строка', 'Номер', 'Описание', 'Состав линейки', 'Способ связи',
    'Ссылка', 'Ссылки меню', 'Ссылки направлений', 'Соцсети', 'Соцсеть', 'Текст', 'Управление',
    'Юридическая информация', 'CTA', 'Десктопная версия', 'Мобильная версия', 'Закрытое меню',
    'Открытое меню', 'Иконка открытия', 'Иконка закрытия', 'Открыть'
  ]);

  function removeEditorLabels() {
    if (isFramed) return;

    document.querySelectorAll('[aria-label]').forEach((element) => {
      if (!element.closest('[class*="agassi-wholesale-"]')) return;

      const label = element.getAttribute('aria-label');
      const isEditorLabel = /^\d+\.\s/.test(label) || EDITOR_LABELS.has(label);

      if (element.localName === 'nav') {
        element.removeAttribute('role');
        return;
      }

      if (!isEditorLabel) return;

      element.removeAttribute('aria-label');

      if (element.getAttribute('role') === 'group') element.removeAttribute('role');
    });
  }

  function createCarousel(viewport, list, prev, next, onArrow) {
    let index = 0;
    let timer = 0;

    const step = () => {
      const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
      return list.firstElementChild.getBoundingClientRect().width + gap;
    };
    const maxScroll = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const lastIndex = () => Math.ceil((maxScroll() - 1) / step());

    const updateButtons = () => {
      prev.disabled = viewport.scrollLeft <= 1;
      next.disabled = viewport.scrollLeft >= maxScroll() - 1;
    };

    const syncIndex = () => {
      index = Math.round(viewport.scrollLeft / step());
      updateButtons();
    };

    const goTo = (target) => {
      index = Math.max(0, Math.min(lastIndex(), target));
      viewport.scrollTo({ left: Math.min(index * step(), maxScroll()), behavior: scrollBehavior() });
    };

    prev.addEventListener('click', () => {
      onArrow?.();
      goTo(index - 1);
    });

    next.addEventListener('click', () => {
      onArrow?.();
      goTo(index + 1);
    });

    viewport.addEventListener('scroll', () => {
      clearTimeout(timer);
      timer = setTimeout(syncIndex, 100);
    }, { passive: true });

    onResize(syncIndex);
    updateButtons();

    return { nextOrFirst: () => goTo(index >= lastIndex() ? 0 : index + 1) };
  }

  function initHeader() {
    const slot = document.querySelector('.agassi-wholesale-header-slot');

    if (!slot || !once(slot, 'agassiWholesaleReady')) return;

    const headers = slot.querySelectorAll('.agassi-wholesale-header');
    const burger = slot.querySelector('.agassi-wholesale-header__burger');
    const menu = slot.querySelector('.agassi-wholesale-header__mobile-menu');
    const themeColor = document.querySelector('meta[name="theme-color"]');

    const setMenu = (open) => {
      slot.classList.toggle('is-menu-open', open);
      document.documentElement.classList.toggle('agassi-wholesale-scroll-locked', open);
      document.body.classList.toggle('agassi-wholesale-scroll-locked', open);

      menu?.setAttribute('aria-hidden', String(!open));
      burger?.setAttribute('aria-expanded', String(open));
      burger?.setAttribute('aria-label', open ? 'Менюни ёпиш' : 'Менюни очиш');

      const color = cssToken(open ? '--agassi-wholesale-crimson' : '--agassi-wholesale-ivory');

      if (themeColor && color) themeColor.content = color;
    };

    const scrollToTop = () => window.scrollTo({ top: 0, left: 0, behavior: scrollBehavior() });

    burger?.addEventListener('click', () => setMenu(!slot.classList.contains('is-menu-open')));
    slot.querySelector('.agassi-wholesale-header__mobile-close')?.addEventListener('click', () => setMenu(false));

    slot.querySelector('.agassi-wholesale-header__mobile-logo')?.addEventListener('click', (event) => {
      event.preventDefault();
      setMenu(false);
      scrollToTop();
    });

    slot.querySelectorAll('.agassi-wholesale-header__logo').forEach((logo) => {
      logo.addEventListener('click', (event) => {
        event.preventDefault();
        scrollToTop();
      });
    });

    slot.querySelectorAll('.agassi-wholesale-header__mobile-nav a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const hash = link.getAttribute('href');

        if (!hash || hash === '#') return;

        event.preventDefault();
        setMenu(false);
        document.querySelector(hash)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      });
    });

    const updateHeaderState = () => {
      headers.forEach((header) => header.classList.toggle('is-scrolled', window.scrollY > 12));
    };

    updateHeaderState();
    window.addEventListener('scroll', updateHeaderState, { passive: true });

    window.matchMedia('(min-width: 1201px)').addEventListener('change', (event) => {
      if (event.matches && slot.classList.contains('is-menu-open')) setMenu(false);
    });
  }

  function initFlowers() {
    document.querySelectorAll('.agassi-wholesale-statement').forEach((section) => {
      if (!once(section, 'agassiWholesaleFlowersReady')) return;

      const layer = section.querySelector('.agassi-wholesale-statement__flowers');
      const flowers = [...section.querySelectorAll('.agassi-wholesale-statement__flower')];

      if (!layer || !flowers.length) return;

      const distances = [105, 145, 120, 175, 150, 130];
      let bounds = [];
      let frame = 0;
      let measureNeeded = true;

      const setFall = (index, value) => {
        section.style.setProperty(`--agassi-wholesale-fall-${index + 1}`, `${value}px`);
      };

      const limits = () => {
        const width = window.innerWidth;

        if (width <= 360) return [6, 6, 6, 22, 18, 18];
        if (width <= 480) return [8, 8, 8, 26, 20, 20];
        if (width <= 640) return [8, 8, 8, 34, 28, 28];
        if (width <= 960) return [10, 10, 10, 54, 42, 40];

        return distances;
      };

      const measure = () => {
        flowers.forEach((flower, i) => setFall(i, 0));

        const area = layer.getBoundingClientRect();
        const caps = limits();

        bounds = flowers.map((flower, i) => {
          const rect = flower.getBoundingClientRect();
          const min = Math.max(0, area.top + 6 - rect.top);
          const max = Math.max(min, area.bottom - 6 - rect.bottom);

          return { min, max: Math.max(min, Math.min(caps[i], max)) };
        });
        measureNeeded = false;
      };

      const update = () => {
        frame = 0;

        if (reducedMotion.matches) {
          flowers.forEach((flower, i) => setFall(i, 0));
          return;
        }

        if (measureNeeded) measure();

        const rect = section.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));

        flowers.forEach((flower, i) => setFall(i, bounds[i].min + progress * (bounds[i].max - bounds[i].min)));
      };

      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };

      const invalidate = () => {
        measureNeeded = true;
        schedule();
      };

      flowers.forEach((flower) => flower.addEventListener('load', invalidate));
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', invalidate, { passive: true });
      window.addEventListener('load', invalidate);
      document.fonts?.ready.then(invalidate);
      reducedMotion.addEventListener('change', invalidate);

      const observer = new ResizeObserver(invalidate);

      observer.observe(layer);
      flowers.forEach((flower) => observer.observe(flower));

      update();
    });
  }

  function initSupportMotion() {
    document.querySelectorAll('.agassi-wholesale-support').forEach((section) => {
      if (!once(section, 'agassiWholesaleMotionReady') || !canAnimate()) return;

      section.classList.add('is-motion');

      const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;

        section.classList.add('is-visible');
        observer.disconnect();
      }, { threshold: 0.2 });

      observer.observe(section.querySelector('.agassi-wholesale-support__surface') || section);
    });
  }

  function initReveal() {
    if (!canAnimate()) return;

    const groups = [
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

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    groups.forEach(([selector, parts]) => {
      const prefix = selector.slice(1);

      document.querySelectorAll(selector).forEach((section) => {
        const title = section.querySelector(`.${prefix}__title`);

        if (title && !title.classList.contains('agassi-wholesale-reveal-text')) {
          title.classList.add('agassi-wholesale-reveal-text');
          observer.observe(title);
        }

        parts.forEach((suffix, index) => {
          const target = section.querySelector(`.${prefix}${suffix}`);

          if (!target || target.classList.contains('agassi-wholesale-reveal')) return;

          target.classList.add('agassi-wholesale-reveal');
          target.style.setProperty('--agassi-wholesale-reveal-delay', `${(index + 1) * 120}ms`);
          observer.observe(target);
        });
      });
    });
  }

  function initPartners() {
    document.querySelectorAll('.agassi-wholesale-partners').forEach((section) => {
      if (!once(section, 'agassiWholesalePartnersReady')) return;

      const viewport = section.querySelector('.agassi-wholesale-partners__viewport');
      const list = section.querySelector('.agassi-wholesale-partners__track');
      const prev = section.querySelector('.agassi-wholesale-partners__arrow--prev');
      const next = section.querySelector('.agassi-wholesale-partners__arrow--next');

      if (!viewport || !list?.firstElementChild || !prev || !next) return;

      let autoplay = 0;
      const carousel = createCarousel(viewport, list, prev, next, () => clearInterval(autoplay));

      if (!isFramed && !reducedMotion.matches) {
        autoplay = setInterval(() => {
          if (!document.hidden) carousel.nextOrFirst();
        }, 4000);
      }
    });
  }

  function initStories() {
    document.querySelectorAll('.agassi-wholesale-stories').forEach((section) => {
      if (!once(section, 'agassiWholesaleStoriesReady')) return;

      const track = section.querySelector('.agassi-wholesale-stories__track');
      const prev = section.querySelector('.agassi-wholesale-stories__arrow--prev');
      const next = section.querySelector('.agassi-wholesale-stories__arrow--next');

      if (!track?.firstElementChild || !prev || !next) return;

      createCarousel(track, track, prev, next);

      const items = [...section.querySelectorAll('.agassi-wholesale-stories__card')]
        .map((card) => ({
          card,
          quote: card.querySelector('.agassi-wholesale-stories__quote'),
          more: card.querySelector('.agassi-wholesale-stories__more')
        }))
        .filter(({ quote, more }) => quote && more);

      const measure = () => {
        const sizes = items.map(({ card, quote }) => ({
          height: quote.scrollHeight,
          short: quote.scrollHeight <= quote.clientHeight + 1 && !card.classList.contains('is-open')
        }));

        items.forEach(({ card, quote, more }, i) => {
          quote.style.setProperty('--agassi-wholesale-quote-height', `${sizes[i].height}px`);

          if (card.classList.contains('is-open')) return;

          card.classList.toggle('is-short', sizes[i].short);
          more.hidden = sizes[i].short;
        });
      };

      items.forEach(({ card, quote, more }) => {
        const openLabel = more.textContent.trim();
        const closeLabel = more.dataset.closeLabel || openLabel;

        more.addEventListener('click', () => {
          const open = !card.classList.contains('is-open');

          if (open) quote.style.setProperty('--agassi-wholesale-quote-height', `${quote.scrollHeight}px`);

          card.classList.toggle('is-open', open);
          more.setAttribute('aria-expanded', String(open));
          more.textContent = open ? closeLabel : openLabel;
        });
      });

      measure();
      onResize(measure);
      document.fonts?.ready.then(measure);
    });
  }

  function initFaq() {
    document.querySelectorAll('.agassi-wholesale-faq').forEach((faq) => {
      if (!once(faq, 'agassiWholesaleFaqReady')) return;

      const iconSource = faq.querySelector('.agassi-wholesale-faq__icon-source .agassi-wholesale-faq__icon-image');

      if (iconSource) {
        faq.querySelectorAll('.agassi-wholesale-faq__icon').forEach((icon) => {
          if (icon.querySelector('img')) return;

          const image = iconSource.cloneNode(false);

          image.removeAttribute('aria-label');
          image.alt = '';
          icon.append(image);
        });
      }

      const entries = [...faq.querySelectorAll('.agassi-wholesale-faq__item')];
      const heads = [...faq.querySelectorAll('.agassi-wholesale-faq__head')];
      const list = faq.querySelector('.agassi-wholesale-faq__list');

      entries.forEach((entry) => {
        const button = entry.querySelector('.agassi-wholesale-faq__question');

        if (!button) return;

        const question = entry.querySelector('.agassi-wholesale-faq__question-text');

        if (!isFramed && question) button.setAttribute('aria-label', question.textContent.trim());

        button.addEventListener('click', () => {
          const wasOpen = entry.classList.contains('is-open');

          entries.forEach((other) => {
            other.classList.remove('is-open');
            other.querySelector('.agassi-wholesale-faq__question')?.setAttribute('aria-expanded', 'false');
          });

          if (wasOpen) return;

          entry.classList.add('is-open');
          button.setAttribute('aria-expanded', 'true');
        });
      });

      const syncVisualHeight = () => {
        if (!list || !heads.length || window.innerWidth <= 960) {
          faq.style.removeProperty('--agassi-wholesale-faq-visual-height');
          return;
        }

        const gap = parseFloat(getComputedStyle(list).rowGap) || 0;
        const total = heads.reduce((sum, head) => sum + head.offsetHeight, 0) + gap * (heads.length - 1);

        faq.style.setProperty('--agassi-wholesale-faq-visual-height', `${total}px`);
      };

      syncVisualHeight();
      window.addEventListener('load', syncVisualHeight);
      onResize(syncVisualHeight);
    });
  }

  const init = () => {
    initViewport();
    removeEditorLabels();
    initHeader();
    initFlowers();
    initSupportMotion();
    initReveal();
    initPartners();
    initStories();
    initFaq();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
