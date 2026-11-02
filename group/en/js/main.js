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

      let lockedAt = 0;
      let syncFrame = 0;

      // Safari на iPhone меняет высоту экрана с задержкой, когда сворачивается адресная строка: высота меню замеряется заново, пока оно открыто
      function syncMenuHeight() {
        const viewport = window.visualViewport;
        const height = Math.max(window.innerHeight, viewport ? viewport.height : 0);
        root.style.setProperty('--agassi-group-menu-height', height + 'px');
      }

      function watchMenuHeight() {
        window.cancelAnimationFrame(syncFrame);
        const started = Date.now();
        (function tick() {
          syncMenuHeight();
          if (slot.classList.contains('is-menu-open') && Date.now() - started < 1500) {
            syncFrame = window.requestAnimationFrame(tick);
          }
        })();
      }

      window.addEventListener('resize', function () {
        if (slot.classList.contains('is-menu-open')) syncMenuHeight();
      });
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', function () {
          if (slot.classList.contains('is-menu-open')) syncMenuHeight();
        });
      }

      // Safari на iPhone игнорирует overflow: hidden, поэтому страница фиксируется на месте, а при закрытии возвращается к прежней позиции
      function setMenu(open) {
        const wasOpen = slot.classList.contains('is-menu-open');
        if (open === wasOpen) return;
        if (open) {
          lockedAt = window.scrollY;
          root.style.setProperty('--agassi-group-scroll-top', lockedAt + 'px');
        }
        // Плавная прокрутка страницы отключается на время фиксации, иначе страница «уезжает» к hero и возвращается обратно
        root.style.scrollBehavior = 'auto';
        slot.classList.toggle('is-menu-open', open);
        root.classList.toggle('agassi-group-scroll-locked', open);
        if (open) watchMenuHeight();
        if (!open) {
          root.style.removeProperty('--agassi-group-scroll-top');
          window.scrollTo(0, lockedAt);
        }
        window.setTimeout(function () { root.style.removeProperty('scroll-behavior'); }, 60);
        menu.setAttribute('aria-hidden', String(!open));
        burger.setAttribute('aria-expanded', String(open));
      }

      function updateScrollState() {
        if (slot.classList.contains('is-menu-open')) return;
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

  // 404 и первый экран: высота окна страницы (iframe блока сама её не знает)
  function initViewport() {
    var section = document.querySelector('.agassi-group-notfound, .agassi-group-hero');
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
      section.style.setProperty('--agassi-group-viewport', height + 'px');
    }

    grow();
    window.addEventListener('load', grow);
    window.setTimeout(grow, 400);
    window.setTimeout(grow, 1200);
    try { window.parent.addEventListener('resize', grow); } catch (error) {}
  }

  // Страны для телефона: [ISO, название, код, маска]; # означает цифру, без маски номер вводится цифрами
  const phoneCountries = [
    ['UZ', 'Uzbekistan', '+998', '## ### ## ##'],
    ['KZ', 'Kazakhstan', '+7', '### ### ## ##'],
    ['KG', 'Kyrgyzstan', '+996', '### ### ###'],
    ['TJ', 'Tajikistan', '+992', '## ### ####'],
    ['TM', 'Turkmenistan', '+993', '## ######'],
    ['AZ', 'Azerbaijan', '+994', '## ### ## ##'],
    ['GE', 'Georgia', '+995', '### ## ## ##'],
    ['AM', 'Armenia', '+374', '## ### ###'],
    ['BY', 'Belarus', '+375', '## ### ## ##'],
    ['RU', 'Russia', '+7', '### ### ## ##'],
    ['UA', 'Ukraine', '+380', '## ### ## ##'],
    ['MD', 'Moldova', '+373', '## ### ###'],
    ['TR', 'Turkey', '+90', '### ### ## ##'],
    ['KR', 'South Korea', '+82', '## #### ####'],
    ['CN', 'China', '+86', '### #### ####'],
    ['AE', 'United Arab Emirates', '+971', '## ### ####'],
    ['US', 'United States', '+1', '### ### ####'],
    ['CA', 'Canada', '+1', '### ### ####'],
    ['AF', 'Afghanistan', '+93'], ['AL', 'Albania', '+355'], ['DZ', 'Algeria', '+213'],
    ['AR', 'Argentina', '+54'], ['AU', 'Australia', '+61'], ['AT', 'Austria', '+43'],
    ['BH', 'Bahrain', '+973'], ['BD', 'Bangladesh', '+880'], ['BE', 'Belgium', '+32'],
    ['BR', 'Brazil', '+55'], ['BG', 'Bulgaria', '+359'], ['KH', 'Cambodia', '+855'],
    ['CL', 'Chile', '+56'], ['CO', 'Colombia', '+57'], ['HR', 'Croatia', '+385'],
    ['CY', 'Cyprus', '+357'], ['CZ', 'Czechia', '+420'], ['DK', 'Denmark', '+45'],
    ['EG', 'Egypt', '+20'], ['EE', 'Estonia', '+372'], ['FI', 'Finland', '+358'],
    ['FR', 'France', '+33'], ['DE', 'Germany', '+49'], ['GR', 'Greece', '+30'],
    ['HK', 'Hong Kong', '+852'], ['HU', 'Hungary', '+36'], ['IN', 'India', '+91'],
    ['ID', 'Indonesia', '+62'], ['IR', 'Iran', '+98'], ['IQ', 'Iraq', '+964'],
    ['IE', 'Ireland', '+353'], ['IL', 'Israel', '+972'], ['IT', 'Italy', '+39'],
    ['JP', 'Japan', '+81'], ['JO', 'Jordan', '+962'], ['KW', 'Kuwait', '+965'],
    ['LV', 'Latvia', '+371'], ['LB', 'Lebanon', '+961'], ['LT', 'Lithuania', '+370'],
    ['MY', 'Malaysia', '+60'], ['MX', 'Mexico', '+52'], ['MN', 'Mongolia', '+976'],
    ['MA', 'Morocco', '+212'], ['NP', 'Nepal', '+977'], ['NL', 'Netherlands', '+31'],
    ['NZ', 'New Zealand', '+64'], ['NG', 'Nigeria', '+234'], ['NO', 'Norway', '+47'],
    ['OM', 'Oman', '+968'], ['PK', 'Pakistan', '+92'], ['PL', 'Poland', '+48'],
    ['PT', 'Portugal', '+351'], ['QA', 'Qatar', '+974'], ['RO', 'Romania', '+40'],
    ['SA', 'Saudi Arabia', '+966'], ['RS', 'Serbia', '+381'], ['SG', 'Singapore', '+65'],
    ['SK', 'Slovakia', '+421'], ['SI', 'Slovenia', '+386'], ['ZA', 'South Africa', '+27'],
    ['ES', 'Spain', '+34'], ['LK', 'Sri Lanka', '+94'], ['SE', 'Sweden', '+46'],
    ['CH', 'Switzerland', '+41'], ['SY', 'Syria', '+963'], ['TW', 'Taiwan', '+886'],
    ['TH', 'Thailand', '+66'], ['TN', 'Tunisia', '+216'], ['GB', 'United Kingdom', '+44'],
    ['VN', 'Vietnam', '+84']
  ].map(function (item) {
    return { iso: item[0].toLowerCase(), name: item[1], code: item[2], mask: item[3] || '' };
  });

  // Флаги картинками: в Windows эмодзи-флаги не отображаются и показываются буквами
  function createFlag(iso) {
    const image = document.createElement('img');
    image.className = 'agassi-group-form__flag-image';
    image.src = 'https://flagcdn.com/24x18/' + iso + '.png';
    image.srcset = 'https://flagcdn.com/48x36/' + iso + '.png 2x';
    image.width = 20;
    image.height = 15;
    image.alt = '';
    image.loading = 'lazy';
    return image;
  }

  // Форма: проверяет поля и отправляет заявку через служебную форму Tilda (она подключает почту и CRM)
  function initContactForm() {
    document.querySelectorAll('.agassi-group-form').forEach(function (form) {
      if (!claim(form)) return;

      const button = form.querySelector('.agassi-group-form__submit');
      const status = form.querySelector('.agassi-group-form__status');
      const label = button.textContent;
      const messages = {
        name: 'Enter your name',
        phone: 'Enter a valid phone number',
        email: 'Enter a valid email address',
        consent: 'Please confirm to continue',
        terms: 'Please confirm to continue'
      };
      let submitting = false;

      function findNative() {
        const documents = [document];
        try { documents.push(window.parent.document); } catch (error) {}
        for (let i = 0; i < documents.length; i += 1) {
          const found = documents[i].querySelector('#' + form.dataset.nativeBlock + ' form');
          if (found) return found;
        }
        return null;
      }

      function fire(element) {
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }

      function setError(input, text) {
        const field = input.closest('.agassi-group-form__field');
        const error = field && field.querySelector('.agassi-group-form__error');
        if (error) error.textContent = text;
        input.setAttribute('aria-invalid', text ? 'true' : 'false');
      }

      // Телефон: страна выбирается списком, номер форматируется по маске страны (# означает цифру)
      const phoneBox = form.querySelector('.agassi-group-form__phone');
      const phoneInput = phoneBox && phoneBox.querySelector('input');
      const countryButton = phoneBox && phoneBox.querySelector('.agassi-group-form__country');
      const countryList = phoneBox && phoneBox.querySelector('.agassi-group-form__countries');
      let country = phoneCountries[0];

      // Длина номера без кода: по маске, а для стран без маски до 12 цифр
      function phoneSize() {
        return country.mask ? (country.mask.match(/#/g) || []).length : 12;
      }

      function formatPhone(value) {
        const code = country.code.replace(/\D/g, '');
        const size = phoneSize();
        const text = value.trim();
        let digits = text.replace(/\D/g, '');
        if (text.indexOf(country.code) === 0) digits = digits.slice(code.length);
        else if (digits.length > size && digits.indexOf(code) === 0) digits = digits.slice(code.length);
        if (!country.mask) return digits.slice(0, size);
        let out = '';
        let pending = '';
        let index = 0;
        for (let i = 0; i < country.mask.length; i += 1) {
          if (country.mask[i] !== '#') {
            pending += country.mask[i];
          } else {
            if (index >= digits.length) break;
            out += pending + digits[index];
            pending = '';
            index += 1;
          }
        }
        return out;
      }

      function fullPhone() {
        return phoneInput.value ? country.code + ' ' + phoneInput.value : '';
      }

      function setCountry(next) {
        country = next;
        const flagBox = countryButton.querySelector('.agassi-group-form__flag');
        flagBox.textContent = '';
        flagBox.appendChild(createFlag(country.iso));
        countryButton.querySelector('.agassi-group-form__code').textContent = country.code;
        phoneInput.placeholder = country.mask ? country.mask.replace(/#/g, '0') : '000 000 000';
        phoneInput.value = formatPhone(phoneInput.value);
        countryList.querySelectorAll('[role="option"]').forEach(function (item) {
          item.setAttribute('aria-selected', item.dataset.name === country.name ? 'true' : 'false');
        });
      }

      function toggleCountries(open) {
        countryList.hidden = !open;
        countryButton.setAttribute('aria-expanded', open ? 'true' : 'false');
      }

      if (phoneInput && countryButton && countryList) {
        phoneCountries.forEach(function (item) {
          const option = document.createElement('li');
          option.setAttribute('role', 'option');
          option.dataset.name = item.name;
          option.tabIndex = 0;
          option.appendChild(createFlag(item.iso));
          option.appendChild(document.createTextNode(item.name + ' ' + item.code));
          countryList.appendChild(option);
        });
        phoneInput.addEventListener('input', function () { phoneInput.value = formatPhone(phoneInput.value); });
        countryButton.addEventListener('click', function () { toggleCountries(countryList.hidden); });
        countryList.addEventListener('click', function (event) {
          const option = event.target.closest('[role="option"]');
          if (!option) return;
          setCountry(phoneCountries.filter(function (item) { return item.name === option.dataset.name; })[0]);
          toggleCountries(false);
          phoneInput.focus();
        });
        countryList.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.target.click();
          }
        });
        document.addEventListener('click', function (event) {
          if (!phoneBox.contains(event.target)) toggleCountries(false);
        });
        form.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') toggleCountries(false);
        });
        setCountry(country);
      }

      function isValid(input) {
        if (input.type === 'checkbox') return input.checked;
        const value = input.value.trim();
        if (input === phoneInput) {
          const length = value.replace(/\D/g, '').length;
          return country.mask ? length === phoneSize() : length >= 6;
        }
        if (input.name === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        return value !== '';
      }

      function setSubmitting(state) {
        submitting = state;
        button.disabled = state;
        button.textContent = state ? 'Sending…' : label;
      }

      // Значения переносятся в служебную форму; телефон уходит целиком, вместе с кодом страны
      function fill(native, input) {
        // Имя переменной в Tilda может быть написано с заглавной буквы, поэтому регистр не учитывается
        const target = Array.prototype.find.call(native.querySelectorAll('[name]'), function (field) {
          return field.name.toLowerCase() === input.name.toLowerCase();
        });
        const value = input === phoneInput ? fullPhone() : input.value.trim();
        if (target) {
          if (input.type === 'checkbox') target.checked = input.checked;
          else target.value = value;
          fire(target);
        }
        if (input !== phoneInput) return;
        // Если в служебной форме у телефона маска страны, номер без кода передаётся и ей
        const mask = native.querySelector('.t-input-phonemask[name="tildaspec-phone-part[]"]');
        if (!mask || mask.getAttribute('data-phonemask-code') !== country.code) return;
        mask.value = phoneInput.value.replace(/\D/g, '');
        fire(mask);
      }

      form.addEventListener('input', function (event) {
        setError(event.target, '');
        status.textContent = '';
      });

      function submit() {
        if (submitting) return;

        let valid = true;
        form.querySelectorAll('[required]').forEach(function (input) {
          const ok = isValid(input);
          setError(input, ok ? '' : messages[input.name] || 'Required field');
          if (!ok) valid = false;
        });
        if (!valid) return;

        const native = findNative();
        const nativeButton = native && native.querySelector('button[type="submit"], input[type="submit"]');
        if (!nativeButton) {
          status.textContent = 'Something went wrong. Please write to us at team@agassi.group';
          return;
        }

        form.querySelectorAll('[name]').forEach(function (input) { fill(native, input); });

        // Окно успеха Tilda не нужно: результат показывает наша форма
        native.setAttribute('data-success-popup', 'n');
        native.addEventListener('tildaform:aftersuccess', function () {
          if (!submitting) return;
          setSubmitting(false);
          form.querySelectorAll('[name]').forEach(function (input) {
            if (input.type === 'checkbox') input.checked = false;
            else input.value = '';
          });
          form.classList.add('is-success');
        });
        native.addEventListener('tildaform:aftererror', function () {
          if (!submitting) return;
          setSubmitting(false);
          status.textContent = 'We could not send your request. Please try again or write to us at team@agassi.group';
          // Для диагностики: причина отказа служебной формы и значения её полей
          const reason = native.querySelector('.js-errorbox-all, .t-form__errorbox-wrapper');
          const values = {};
          native.querySelectorAll('[name]').forEach(function (field) {
            values[field.name] = field.type === 'checkbox' ? field.checked : field.value;
          });
          console.warn('[agassi-group] native form error:', reason ? reason.textContent.trim() : '(no message)', values);
        });

        setSubmitting(true);
        nativeButton.click();

        // Если Tilda не прислала ни успех, ни ошибку (например, показала свою ошибку поля), кнопка не должна зависать
        let checks = 0;
        const watchdog = setInterval(function () {
          checks += 1;
          if (!submitting) { clearInterval(watchdog); return; }
          const visible = Array.prototype.filter.call(
            native.querySelectorAll('.t-form__errorbox-item, .t-input-error'),
            function (item) { return item.offsetParent !== null && item.textContent.trim() !== ''; }
          );
          if (visible.length || checks >= 20) {
            clearInterval(watchdog);
            setSubmitting(false);
            status.textContent = 'We could not send your request. Please try again or write to us at team@agassi.group';
            console.warn('[agassi-group] native form did not respond:', visible.map(function (item) { return item.textContent.trim(); }));
          }
        }, 750);
      }

      button.addEventListener('click', submit);
      form.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' || event.target.tagName !== 'INPUT' || event.target.type === 'checkbox') return;
        event.preventDefault();
        submit();
      });
    });
  }

  function init() {
    initHeader();
    initPartners();
    initBlog();
    initViewport();
    initContactForm();
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
