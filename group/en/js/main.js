(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Защита от повторной инициализации
  function claim(element) {
    if (element.dataset.agassiGroupReady === 'true') return false;
    element.dataset.agassiGroupReady = 'true';
    return true;
  }

  // Шапка и мобильное меню
  function initHeader() {
    document.querySelectorAll('.agassi-group-header-slot').forEach(function (slot) {
      if (!claim(slot)) return;

      const header = slot.querySelector('.agassi-group-header');
      const menu = slot.querySelector('.agassi-group-header__mobile-menu');
      const burger = slot.querySelector('.agassi-group-header__burger');
      const closeButton = slot.querySelector('.agassi-group-header__mobile-close');
      const root = document.documentElement;
      if (!header || !menu || !burger || !closeButton) return;

      function setMenu(open) {
        slot.classList.toggle('is-menu-open', open);
        root.classList.toggle('agassi-group-scroll-locked', open);
        menu.setAttribute('aria-hidden', String(!open));
        burger.setAttribute('aria-expanded', String(open));
      }

      function updateScrollState() {
        header.classList.toggle('is-scrolled', window.scrollY > 12);
      }

      burger.addEventListener('click', function () {
        setMenu(true);
      });
      closeButton.addEventListener('click', function () {
        setMenu(false);
      });
      menu.addEventListener('click', function (event) {
        if (event.target.closest('a')) setMenu(false);
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') setMenu(false);
      });
      window.addEventListener('resize', function () {
        if (window.innerWidth > 960) setMenu(false);
      }, { passive: true });
      window.addEventListener('scroll', updateScrollState, { passive: true });

      updateScrollState();
    });
  }

  // Карусель партнёров: автоплей и кнопки двигают ровно на одну карточку
  function initPartners() {
    document.querySelectorAll('.agassi-group-partners').forEach(function (section) {
      if (!claim(section)) return;

      const track = section.querySelector('.agassi-group-partners__track');
      const prev = section.querySelector('.agassi-group-partners__arrow--prev');
      const next = section.querySelector('.agassi-group-partners__arrow--next');
      if (!track || !track.firstElementChild || !prev || !next) return;

      const autoplayDelay = 4000;
      let index = 0;
      let timer = 0;
      let autoplay = 0;

      function step() {
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
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

      // Автоплей: шаг на одну карточку, в конце возврат к началу
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

      // Нажатие на кнопку навсегда останавливает автоплей
      prev.addEventListener('click', function () {
        stopAutoplay();
        goTo(index - 1);
      });
      next.addEventListener('click', function () {
        stopAutoplay();
        goTo(index + 1);
      });

      // Синхронизация после свайпа или окончания прокрутки
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
  }

  // Аккордеон вопросов
  function initFaq() {
    document.querySelectorAll('.agassi-group-faq').forEach(function (section) {
      if (!claim(section)) return;

      const items = section.querySelectorAll('.agassi-group-faq__item');
      const source = section.querySelector('.agassi-group-faq__icon-image');

      // Одна иконка из «Контента» подставляется во все вопросы
      if (source) {
        section.querySelectorAll('.agassi-group-faq__head').forEach(function (head) {
          const icon = document.createElement('span');
          const image = document.createElement('img');
          icon.className = 'agassi-group-faq__icon';
          image.src = source.src;
          image.alt = '';
          icon.appendChild(image);
          head.insertBefore(icon, head.querySelector('.agassi-group-faq__toggle'));
        });
      }

      function setOpen(item, open) {
        const button = item.querySelector('.agassi-group-faq__toggle');
        item.classList.toggle('is-open', open);
        if (button) button.setAttribute('aria-expanded', String(open));
      }

      section.addEventListener('click', function (event) {
        const button = event.target.closest('.agassi-group-faq__toggle');
        if (!button) return;

        const item = button.closest('.agassi-group-faq__item');
        const willOpen = !item.classList.contains('is-open');

        items.forEach(function (other) {
          setOpen(other, false);
        });
        if (willOpen) setOpen(item, true);
      });
    });
  }

  function init() {
    initHeader();
    initPartners();
    initFaq();
    initFacts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
