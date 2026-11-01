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
      const root = document.documentElement;
      // В редакторе список языков не раскрываем: он растягивает высоту блока
      if (window.self !== window.top) slot.classList.add('is-editor');
      if (!header || !menu || !burger) return;

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
        setMenu(!slot.classList.contains('is-menu-open'));
      });
      menu.addEventListener('click', function (event) {
        if (event.target.closest('a')) setMenu(false);
      });
      document.addEventListener('click', function (event) {
        if (!slot.contains(event.target) && !header.contains(event.target)) setMenu(false);
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
  // Лента с карточками: партнёры (с автоплеем) и СМИ на мобильных (только стрелки и свайп)
  function initPartners() {
    [
      { section: '.agassi-group-partners', track: '.agassi-group-partners__track', prev: '.agassi-group-partners__arrow--prev', next: '.agassi-group-partners__arrow--next', autoplay: true },
      { section: '.agassi-group-featured', track: '.agassi-group-featured__list', prev: '.agassi-group-featured__arrow--prev', next: '.agassi-group-featured__arrow--next', autoplay: false }
    ].forEach(function (config) {
      document.querySelectorAll(config.section).forEach(function (section) {
        initCarousel(section, config);
      });
    });
  }

  function initCarousel(section, config) {
    {
      if (!claim(section)) return;

      const track = section.querySelector(config.track);
      const prev = section.querySelector(config.prev);
      const next = section.querySelector(config.next);
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
      if (config.autoplay) startAutoplay();
    }
  }

  // Блог: записи потока Tilda загружаются по публичному адресу потока и выводятся карточками
  function initBlog() {
    document.querySelectorAll('.agassi-group-blog').forEach(function (section) {
      if (section.dataset.agassiGroupBlogLoaded === 'true') return;
      section.dataset.agassiGroupBlogLoaded = 'true';

      const list = section.querySelector('.agassi-group-blog__list');
      const action = section.querySelector('.agassi-group-blog__action');
      const more = section.querySelector('.agassi-group-blog__button');
      const feed = section.dataset.agassiGroupFeed;
      if (!list || !feed) return;

      const count = parseInt(section.dataset.agassiGroupCount, 10) || 3;
      let page = 0;
      let loaded = 0;

      function element(tag, className, text) {
        const node = document.createElement(tag);
        node.className = 'agassi-group-blog__' + className;
        if (text) node.textContent = text;
        return node;
      }

      function formatDate(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '');
        if (!match) return '';
        const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      }

      function card(post) {
        const preview = post['preview-media'] && post['preview-media'].source;
        const image = post.image || (preview && preview.url) || '';
        const item = element('div', 'item');
        const link = element('a', 'card');
        link.href = /^https:\/\//.test(post.url || '') ? post.url : '#';

        const media = element('div', 'media');
        if (image) {
          const picture = element('img', 'image');
          picture.src = image;
          picture.alt = '';
          picture.loading = 'lazy';
          media.appendChild(picture);
        }

        const body = element('div', 'body');
        const date = formatDate(post.date);
        if (date) body.appendChild(element('p', 'date', date));
        body.appendChild(element('h3', 'title', post.title));
        if (post.descr) body.appendChild(element('p', 'text', post.descr));
        body.appendChild(element('span', 'more', 'Read more'));

        link.appendChild(media);
        link.appendChild(body);
        item.appendChild(link);
        return item;
      }

      function showEmpty() {
        list.hidden = true;
        const message = element('p', 'empty', 'New articles are coming soon.');
        list.parentNode.insertBefore(message, list);
      }

      // Загрузка очередной страницы потока; кнопка «Show more» скрывается, когда записи закончились
      function load() {
        const query = new URLSearchParams({ feeduid: feed, size: count, slice: page + 1, 'sort[date]': 'desc' });
        if (more) more.disabled = true;

        return fetch('https://feeds.tildaapi.com/api/getfeed/?' + query.toString())
          .then(function (response) {
            if (!response.ok) throw new Error('Feed ' + response.status);
            return response.json();
          })
          .then(function (data) {
            const posts = (data && data.posts) || [];
            if (!posts.length && !loaded) return showEmpty();

            const first = !loaded;
            page += 1;
            loaded += posts.length;
            posts.forEach(function (post) {
              list.appendChild(card(post));
            });

            if (first) {
              initCarousel(section, {
                track: '.agassi-group-blog__list',
                prev: '.agassi-group-blog__arrow--prev',
                next: '.agassi-group-blog__arrow--next',
                autoplay: false
              });
            } else {
              list.dispatchEvent(new Event('scroll'));
            }

            const total = parseInt(data.total, 10) || 0;
            if (action) action.hidden = !posts.length || loaded >= total;
            if (more) more.disabled = false;
          })
          .catch(function (error) {
            console.warn('Agassi blog: feed failed', error);
            if (more) more.disabled = false;
            if (!loaded) showEmpty();
          });
      }

      if (more) more.addEventListener('click', load);
      load();
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

  // Факты: счётчик чисел при первом появлении в экране
  function initFacts() {
    document.querySelectorAll('.agassi-group-facts').forEach(function (section) {
      if (!claim(section)) return;
      if (reducedMotion.matches || window.self !== window.top || !('IntersectionObserver' in window)) return;

      const duration = 1600;
      const values = [];

      section.querySelectorAll('.agassi-group-facts__value').forEach(function (element) {
        const text = element.textContent.trim();
        const match = text.match(/^(\D*)(\d[\d.,]*)(.*)$/);
        if (!match) return;
        const target = parseFloat(match[2].replace(/,/g, ''));
        if (!isFinite(target)) return;
        // Ширину фиксируем по итоговому числу, чтобы текст не прыгал
        element.style.setProperty('--agassi-group-facts-width', Math.ceil(element.getBoundingClientRect().width) + 'px');
        values.push({ element: element, prefix: match[1], target: target, suffix: match[3], grouped: match[2].indexOf(',') !== -1 });
      });
      if (!values.length) return;

      function format(item, number) {
        const rounded = Math.round(number);
        return item.prefix + (item.grouped ? rounded.toLocaleString('en-US') : String(rounded)) + item.suffix;
      }

      function run() {
        const start = performance.now();
        values.forEach(function (item) { item.element.textContent = format(item, 0); });

        function frame(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          values.forEach(function (item) { item.element.textContent = format(item, item.target * eased); });
          if (progress < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      }

      const observer = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        run();
      }, { threshold: 0.35 });
      observer.observe(section);
    });
  }

  // О компании: показать или скрыть продолжение истории
  function initStory() {
    document.querySelectorAll('.agassi-group-story').forEach(function (section) {
      if (!claim(section)) return;

      const more = section.querySelector('.agassi-group-story__more');
      const toggle = section.querySelector('.agassi-group-story__toggle');
      if (!more || !toggle) return;

      const layout = section.querySelector('.agassi-group-story__layout');
      const body = section.querySelector('.agassi-group-story__body');
      const action = section.querySelector('.agassi-group-story__action');
      const firstText = section.querySelector('.agassi-group-story__text');

      // Высота фото = высота свёрнутого текста, при раскрытии не меняется
      function syncHeight() {
        if (!layout || !body || !action) return;
        const height = action.getBoundingClientRect().bottom - body.getBoundingClientRect().top - more.getBoundingClientRect().height;
        if (height > 0) layout.style.setProperty('--agassi-group-story-height', Math.round(height) + 'px');
      }

      syncHeight();
      window.addEventListener('load', syncHeight);
      window.addEventListener('resize', syncHeight, { passive: true });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncHeight);
      if ('ResizeObserver' in window && firstText) new ResizeObserver(syncHeight).observe(firstText);

      const closedLabel = toggle.textContent.trim();
      const openLabel = toggle.getAttribute('data-label-open') || closedLabel;

      toggle.addEventListener('click', function () {
        const open = !more.classList.contains('is-open');
        more.classList.toggle('is-open', open);
        more.setAttribute('aria-hidden', String(!open));
        toggle.setAttribute('aria-expanded', String(open));
        toggle.textContent = open ? openLabel : closedLabel;
      });
    });
  }

  // Типограф: короткие слова не остаются в конце строки (склеиваются со следующим неразрывным пробелом)
  function initTypography() {
    const words = 'a|an|the|to|of|in|on|at|by|for|and|or|but|as|if|so|is|it|we|us|our|my|no|not|with|from|i|в|во|к|ко|с|со|у|о|об|и|а|но|на|по|за|из|от|до|не|ни|для|при|без|над|под|про|или|что|как';
    const pattern = new RegExp('(^|[\\s\\u00A0(\\[“"\'])(' + words + ')\\s+(?=\\S)', 'giu');
    const skip = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, CODE: 1 };

    document.querySelectorAll('.agassi-group-section, .agassi-group-footer, .agassi-group-header-slot').forEach(function (root) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      nodes.forEach(function (node) {
        if (skip[node.parentNode.nodeName]) return;
        const text = node.nodeValue;
        // Повторяем, чтобы обработать подряд идущие короткие слова
        let result = text.replace(pattern, '$1$2\u00A0');
        result = result.replace(pattern, '$1$2\u00A0');
        if (result !== text) node.nodeValue = result;
      });
    });
  }

  // Заголовки появляются при прокрутке (в редакторе и при reduced motion не анимируются)
  function initReveal() {
    if (window.self !== window.top || reducedMotion.matches || !('IntersectionObserver' in window)) return;

    const selector = '.agassi-group-heading__title, .agassi-group-contact__title, .agassi-group-privacy__title';
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll(selector).forEach(function (node) {
      node.classList.add('agassi-group-reveal');
      observer.observe(node);
    });
  }

  // 404: блок по центру высоты окна страницы (iframe блока не знает высоту окна)
  function initNotFound() {
    var section = document.querySelector('.agassi-group-notfound');
    if (!section) return;

    function update() {
      var height = window.innerHeight;
      try {
        height = window.parent.innerHeight || height;
      } catch (error) {}
      section.style.setProperty('--agassi-group-viewport', height + 'px');
    }

    update();
    window.addEventListener('resize', update);
  }

  function init() {
    initHeader();
    initPartners();
    initBlog();
    initNotFound();
    initFaq();
    initFacts();
    initStory();
    initTypography();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
