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

  // Карусель партнёров: без автоплея, шаг ровно в одну карточку
  function initPartners() {
    document.querySelectorAll('.agassi-group-partners').forEach(function (section) {
      if (!claim(section)) return;

      const track = section.querySelector('.agassi-group-partners__track');
      const prev = section.querySelector('.agassi-group-partners__arrow--prev');
      const next = section.querySelector('.agassi-group-partners__arrow--next');
      if (!track || !track.firstElementChild || !prev || !next) return;

      let index = 0;
      let timer = 0;

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

      prev.addEventListener('click', function () {
        goTo(index - 1);
      });
      next.addEventListener('click', function () {
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
    });
  }

  // Аккордеон вопросов
  function initFaq() {
    document.querySelectorAll('.agassi-group-faq').forEach(function (section) {
      if (!claim(section)) return;

      const items = section.querySelectorAll('.agassi-group-faq__item');

      function setOpen(item, open) {
        const button = item.querySelector('.agassi-group-faq__question');
        item.classList.toggle('is-open', open);
        if (button) button.setAttribute('aria-expanded', String(open));
      }

      section.addEventListener('click', function (event) {
        const button = event.target.closest('.agassi-group-faq__question');
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

  // Отправка формы
  function initForms() {
    document.querySelectorAll('.agassi-group-form').forEach(function (form) {
      if (!claim(form)) return;

      const submit = form.querySelector('[type="submit"]');
      const success = form.querySelector('[data-message="success"]');
      const failure = form.querySelector('[data-message="error"]');

      function showMessage(type) {
        if (success) success.hidden = type !== 'success';
        if (failure) failure.hidden = type !== 'error';
      }

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!form.reportValidity()) return;

        const endpoint = form.dataset.endpoint;
        if (!endpoint) {
          showMessage('error');
          return;
        }

        showMessage('');
        if (submit) submit.disabled = true;

        fetch(endpoint, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        })
          .then(function (response) {
            if (!response.ok) throw new Error(response.status);
            form.reset();
            showMessage('success');
          })
          .catch(function () {
            showMessage('error');
          })
          .finally(function () {
            if (submit) submit.disabled = false;
          });
      });
    });
  }

  // Счётчик фактов: число набегает при появлении блока
  function initFacts() {
    document.querySelectorAll('.agassi-group-facts').forEach(function (section) {
      if (!claim(section)) return;
      if (reducedMotion.matches || window.self !== window.top || !('IntersectionObserver' in window)) return;

      const items = [];

      section.querySelectorAll('.agassi-group-facts__value').forEach(function (element) {
        const match = element.textContent.trim().match(/^(\D*)(\d+)(.*)$/);
        if (!match) return;

        // Ширина фиксируется по итоговому значению, чтобы блок не прыгал
        element.style.setProperty('--agassi-group-facts-width', element.offsetWidth + 'px');
        items.push({ element: element, prefix: match[1], target: Number(match[2]), suffix: match[3] });
        element.textContent = match[1] + '0' + match[3];
      });

      function animate(item) {
        const duration = 1800;
        const start = performance.now();

        function frame(now) {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          item.element.textContent = item.prefix + Math.round(item.target * eased) + item.suffix;
          if (progress < 1) window.requestAnimationFrame(frame);
        }

        window.requestAnimationFrame(frame);
      }

      const observer = new IntersectionObserver(function (entries) {
        if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
        observer.disconnect();
        items.forEach(animate);
      }, { threshold: 0.4 });

      observer.observe(section.querySelector('.agassi-group-facts__list'));
    });
  }

  function init() {
    initHeader();
    initPartners();
    initFaq();
    initFacts();
    initForms();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
