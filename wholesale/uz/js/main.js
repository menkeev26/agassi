/* AGASSI Wholesale UZ v2.0.0
 * Load once with defer. No dependencies. Public API: init(root), refresh(root), destroy(root).
 * Original component geometry, slider speed and statement motion distances are retained.
 */
(function (window, document) {
  'use strict';
  if (window.AgassiWholesale) { window.AgassiWholesale.init(); return; }

  var instances = new Map();
  var suspended = new WeakSet();
  var openMenus = new Set();
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function context() {
    var cleanups = [], frames = new Set(), timers = new Set();
    var ctx = {
      alive: true,
      cleanup: function (fn) { cleanups.push(fn); },
      on: function (target, event, fn, options) {
        if (!target) return;
        target.addEventListener(event, fn, options);
        cleanups.push(function () { target.removeEventListener(event, fn, options); });
      },
      raf: function (fn) {
        var id = window.requestAnimationFrame(function (time) {
          frames.delete(id); if (ctx.alive) fn(time);
        });
        frames.add(id); return id;
      },
      cancelRaf: function (id) { window.cancelAnimationFrame(id); frames.delete(id); },
      timeout: function (fn, delay) {
        var id = window.setTimeout(function () { timers.delete(id); if (ctx.alive) fn(); }, delay);
        timers.add(id); return id;
      },
      clearTimeout: function (id) { window.clearTimeout(id); timers.delete(id); },
      resize: function (elements, fn) {
        if (!window.ResizeObserver) return;
        var observer = new ResizeObserver(fn);
        elements.forEach(function (el) { if (el) observer.observe(el); });
        cleanups.push(function () { observer.disconnect(); });
      },
      destroy: function () {
        ctx.alive = false;
        frames.forEach(function (id) { window.cancelAnimationFrame(id); });
        timers.forEach(function (id) { window.clearTimeout(id); });
        cleanups.reverse().forEach(function (fn) { fn(); });
        frames.clear(); timers.clear();
      }
    };
    return ctx;
  }

  function watchVisibility(section, ctx, callback) {
    var visible = true;
    function report() { callback(visible && !document.hidden); }
    if (window.IntersectionObserver) {
      var observer = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting; report();
      });
      observer.observe(section); ctx.cleanup(function () { observer.disconnect(); });
    }
    ctx.on(document, 'visibilitychange', report);
    report();
  }

  function header(slot, ctx) {
    var bars = Array.from(slot.querySelectorAll('.ags-header'));
    var burger = slot.querySelector('.ags-header__burger');
    var menu = slot.querySelector('.ags-header__mobile-menu');
    var closeButton = slot.querySelector('.ags-header__mobile-close');
    if (!bars.length || !burger || !menu || !closeButton) return false;
    var theme = document.querySelector('meta[name="theme-color"]');
    var themeBefore = theme ? theme.content : '';
    var opened = false, focusBefore = null;
    var inertBefore = menu.inert;
    menu.inert = true;

    function setOpen(value, restoreFocus) {
      if (value && !opened) focusBefore = document.activeElement;
      opened = value;
      slot.classList.toggle('is-menu-open', value);
      if (value) openMenus.add(slot); else openMenus.delete(slot);
      document.documentElement.classList.toggle('ags-scroll-locked', openMenus.size > 0);
      document.body.classList.toggle('ags-scroll-locked', openMenus.size > 0);
      menu.inert = !value;
      menu.setAttribute('aria-hidden', String(!value));
      burger.setAttribute('aria-expanded', String(value));
      burger.setAttribute('aria-label', value ? 'Закрыть меню' : 'Открыть меню');
      if (theme) theme.content = openMenus.size ? '#8C0F14' : themeBefore;
      if (value) closeButton.focus({ preventScroll: true });
      else if (restoreFocus && focusBefore && focusBefore.isConnected) focusBefore.focus({ preventScroll: true });
    }
    function top(event) {
      event.preventDefault(); setOpen(false, false);
      window.scrollTo({ top: 0, left: 0, behavior: motion.matches ? 'auto' : 'smooth' });
    }
    ctx.on(burger, 'click', function () { setOpen(!opened, true); });
    ctx.on(closeButton, 'click', function () { setOpen(false, true); });
    ctx.on(slot.querySelector('.ags-header__mobile-logo'), 'click', top);
    slot.querySelectorAll('.ags-header__logo').forEach(function (logo) { ctx.on(logo, 'click', top); });
    menu.querySelectorAll('a[href^="#"]').forEach(function (link) {
      if (link.classList.contains('ags-header__mobile-logo')) return;
      ctx.on(link, 'click', function (event) {
        var target = document.getElementById(link.getAttribute('href').slice(1));
        if (!target) return;
        event.preventDefault(); setOpen(false, false);
        target.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth', block: 'start' });
      });
    });
    ctx.on(document, 'keydown', function (event) {
      if (!opened) return;
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false, true); return; }
      if (event.key !== 'Tab') return;
      var items = Array.from(menu.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')).filter(function (el) {
        return el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
      });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (!menu.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) {
        event.preventDefault(); (event.shiftKey ? last : first).focus();
      } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    function update() { bars.forEach(function (bar) { bar.classList.toggle('is-scrolled', window.scrollY > 12); }); }
    ctx.on(window, 'scroll', update, { passive: true });
    ctx.on(window, 'resize', function () { if (window.innerWidth > 1200 && opened) setOpen(false, false); }, { passive: true });
    ctx.cleanup(function () { setOpen(false, false); menu.inert = inertBefore; });
    update();
  }

  function statement(section, ctx) {
    var layer = section.querySelector('.ags-statement__flowers');
    var flowers = Array.from(section.querySelectorAll('.ags-statement__flower'));
    if (!layer || !flowers.length) return false;
    var bounds = [], frame = 0, dirty = true, active = true;
    var before = flowers.map(function (_, i) { return section.style.getPropertyValue('--ags-fall-' + (i + 1)); });
    function limits() {
      var w = window.innerWidth;
      if (w <= 360) return [28, 34, 26, 22, 18];
      if (w <= 480) return [34, 40, 30, 26, 20];
      if (w <= 640) return [42, 50, 38, 34, 28];
      if (w <= 960) return [58, 70, 54, 54, 42];
      return [105, 145, 120, 175, 150];
    }
    function zero() { flowers.forEach(function (_, i) { section.style.setProperty('--ags-fall-' + (i + 1), '0px'); }); }
    function update() {
      frame = 0;
      if (motion.matches) { zero(); return; }
      if (!active) return;
      if (dirty) {
        zero(); var area = layer.getBoundingClientRect(), caps = limits();
        bounds = flowers.map(function (flower, i) {
          var rect = flower.getBoundingClientRect();
          var min = Math.max(0, area.top + 6 - rect.top);
          var max = Math.max(min, area.bottom - 6 - rect.bottom);
          return { min: min, max: Math.max(min, Math.min(caps[i] || 0, max)) };
        });
        dirty = false;
      }
      var rect = section.getBoundingClientRect();
      var progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
      flowers.forEach(function (_, i) {
        var b = bounds[i]; section.style.setProperty('--ags-fall-' + (i + 1), (b.min + progress * (b.max - b.min)) + 'px');
      });
    }
    function schedule() { if (!frame && (active || motion.matches)) frame = ctx.raf(update); }
    function invalidate() { dirty = true; schedule(); }
    flowers.forEach(function (flower) { ctx.on(flower, 'load', invalidate); });
    ctx.on(window, 'scroll', schedule, { passive: true });
    ctx.on(window, 'resize', invalidate, { passive: true });
    ctx.on(window, 'load', invalidate); ctx.on(motion, 'change', invalidate);
    ctx.resize([layer].concat(flowers), invalidate);
    if (document.fonts) document.fonts.ready.then(function () { if (ctx.alive) invalidate(); });
    watchVisibility(section, ctx, function (value) { active = value; if (value) invalidate(); });
    ctx.cleanup(function () {
      before.forEach(function (value, i) {
        var key = '--ags-fall-' + (i + 1);
        if (value) section.style.setProperty(key, value); else section.style.removeProperty(key);
      });
    });
    update();
  }

  function partners(section, ctx) {
    var viewport = section.querySelector('.ags-partners__viewport'), track = section.querySelector('.ags-partners__track');
    var prev = section.querySelector('.ags-partners__arrow--prev'), next = section.querySelector('.ags-partners__arrow--next');
    if (!viewport || !track || !prev || !next) return false;
    // An editor may copy serialized live markup, including generated clones.
    track.querySelectorAll('[data-ags-clone]').forEach(function (clone) { clone.remove(); });
    var cards = Array.from(track.children).filter(function (card) { return !card.hasAttribute('data-ags-clone'); });
    if (!cards.length) return false;
    var clones = cards.map(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute('data-ags-clone', 'true'); clone.setAttribute('aria-hidden', 'true'); clone.setAttribute('tabindex', '-1');
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
      clone.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(function (el) { el.setAttribute('tabindex', '-1'); });
      track.appendChild(clone); return clone;
    });
    var transformBefore = track.style.transform;
    var position = 0, autoplay = true, dragging = false, active = true;
    var pointer = null, startX = 0, startPosition = 0, dragDistance = 0, lastTime = 0;
    var auto = 0, manual = 0, hovered = false, focused = false;
    function step() { return cards[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).gap) || 0); }
    function normalize() { var width = step() * cards.length; if (width > 0) position = ((position % width) + width) % width; }
    function render() { normalize(); track.style.transform = 'translate3d(' + (-position) + 'px,0,0)'; }
    function stopManual() { ctx.cancelRaf(manual); manual = 0; }
    function canAuto() { return autoplay && active && !motion.matches && !dragging && !manual && !hovered && !focused; }
    function autoFrame(now) {
      auto = 0;
      if (!canAuto()) { lastTime = 0; return; }
      if (!lastTime) lastTime = now;
      position += 28 * Math.min(now - lastTime, 50) / 1000; lastTime = now;
      render(); auto = ctx.raf(autoFrame);
    }
    function syncAuto() {
      if (canAuto()) { if (!auto) { lastTime = 0; auto = ctx.raf(autoFrame); } }
      else { ctx.cancelRaf(auto); auto = 0; lastTime = 0; }
    }
    function move(direction) {
      autoplay = false; stopManual(); syncAuto();
      var width = step() * cards.length; if (!width) return;
      if (direction < 0 && position - step() < 0) position += width;
      var from = position, to = position + step() * direction;
      if (motion.matches) { position = to; render(); return; }
      var started = performance.now();
      function frame(now) {
        var progress = Math.min((now - started) / 520, 1);
        position = from + (to - from) * (1 - Math.pow(1 - progress, 4)); render();
        manual = progress < 1 ? ctx.raf(frame) : 0;
      }
      manual = ctx.raf(frame);
    }
    ctx.on(prev, 'click', function () { move(-1); });
    ctx.on(next, 'click', function () { move(1); });
    ctx.on(viewport, 'pointerdown', function (event) {
      if (dragging || (event.pointerType === 'mouse' && event.button !== 0)) return;
      autoplay = false; stopManual(); syncAuto();
      dragging = true; pointer = event.pointerId; startX = event.clientX; startPosition = position; dragDistance = 0;
      viewport.classList.add('is-dragging');
      try { viewport.setPointerCapture(pointer); } catch (_) {}
    });
    ctx.on(viewport, 'pointermove', function (event) {
      if (!dragging || event.pointerId !== pointer) return;
      dragDistance = Math.abs(event.clientX - startX); position = startPosition - (event.clientX - startX); render();
    });
    function endDrag(event) {
      if (!dragging || (event && event.pointerId !== pointer)) return;
      dragging = false; viewport.classList.remove('is-dragging');
      try { viewport.releasePointerCapture(pointer); } catch (_) {}
      pointer = null; render();
    }
    ctx.on(viewport, 'pointerup', endDrag); ctx.on(viewport, 'pointercancel', endDrag); ctx.on(viewport, 'lostpointercapture', endDrag);
    ctx.on(track, 'click', function (event) {
      if (dragDistance > 6) { event.preventDefault(); event.stopPropagation(); }
      dragDistance = 0;
    });
    ctx.on(viewport, 'dragstart', function (event) { event.preventDefault(); });
    ctx.on(viewport, 'pointerenter', function () { hovered = true; syncAuto(); });
    ctx.on(viewport, 'pointerleave', function () { hovered = false; syncAuto(); });
    ctx.on(section, 'focusin', function () { focused = true; syncAuto(); });
    ctx.on(section, 'focusout', function (event) { focused = section.contains(event.relatedTarget); syncAuto(); });
    ctx.on(window, 'resize', render, { passive: true }); ctx.resize([viewport], render);
    ctx.on(motion, 'change', function () { if (motion.matches) stopManual(); syncAuto(); });
    watchVisibility(section, ctx, function (value) { active = value; if (!value) stopManual(); syncAuto(); });
    ctx.cleanup(function () { endDrag(); clones.forEach(function (clone) { clone.remove(); }); track.style.transform = transformBefore; });
    render(); syncAuto();
  }

  function stories(section, ctx) {
    var track = section.querySelector('.ags-stories__track'), cards = Array.from(section.querySelectorAll('.ags-stories__card'));
    var prev = section.querySelector('.ags-stories__arrow--prev'), next = section.querySelector('.ags-stories__arrow--next');
    if (!track || !cards.length || !prev || !next) return false;
    var timer = 0, disabledBefore = [prev.disabled, next.disabled];
    function position(i) { return track.scrollLeft + cards[i].getBoundingClientRect().left - track.getBoundingClientRect().left; }
    function maxScroll() { return Math.max(0, track.scrollWidth - track.clientWidth); }
    function update() { prev.disabled = track.scrollLeft <= 2; next.disabled = track.scrollLeft >= maxScroll() - 2; }
    function move(direction) {
      var index = 0, distance = Infinity;
      cards.forEach(function (_, i) { var d = Math.abs(position(i) - track.scrollLeft); if (d < distance) { distance = d; index = i; } });
      if (direction > 0 && position(index) <= track.scrollLeft + 2) index++;
      if (direction < 0 && position(index) >= track.scrollLeft - 2) index--;
      index = Math.max(0, Math.min(cards.length - 1, index));
      // Allow the last partial step to reach the end when fractional card widths are used.
      var target = Math.max(0, Math.min(position(index), maxScroll()));
      track.scrollTo({ left: target, behavior: motion.matches ? 'instant' : 'smooth' });
      update();
    }
    ctx.on(prev, 'click', function () { move(-1); }); ctx.on(next, 'click', function () { move(1); });
    ctx.on(track, 'scroll', function () { ctx.clearTimeout(timer); timer = ctx.timeout(update, 80); }, { passive: true });
    ctx.on(window, 'resize', update, { passive: true }); ctx.resize([track].concat(cards), update);
    ctx.on(window, 'load', update);
    ctx.cleanup(function () { prev.disabled = disabledBefore[0]; next.disabled = disabledBefore[1]; });
    update();
  }

  function faq(section, ctx) {
    var entries = Array.from(section.querySelectorAll('.ags-faq__entry'));
    var items = Array.from(section.querySelectorAll('.ags-faq__item')), list = section.querySelector('.ags-faq__list');
    if (!entries.length || !list || !items.length) return false;
    var timer = 0, heightBefore = section.style.getPropertyValue('--ags-faq-visual-height');
    function syncHeight() {
      if (window.innerWidth <= 960) { section.style.removeProperty('--ags-faq-visual-height'); return; }
      var styles = getComputedStyle(list), gap = parseFloat(styles.rowGap || styles.gap) || 0;
      var height = items.reduce(function (total, item) { return total + item.offsetHeight; }, 0) + gap * (items.length - 1);
      section.style.setProperty('--ags-faq-visual-height', height + 'px');
    }
    entries.forEach(function (entry) {
      var button = entry.querySelector('.ags-faq__question');
      ctx.on(button, 'click', function () {
        var open = entry.classList.contains('is-open');
        entries.forEach(function (other) {
          other.classList.remove('is-open'); var b = other.querySelector('.ags-faq__question'); if (b) b.setAttribute('aria-expanded', 'false');
        });
        if (!open) { entry.classList.add('is-open'); button.setAttribute('aria-expanded', 'true'); }
      });
    });
    ctx.on(window, 'resize', function () { ctx.clearTimeout(timer); timer = ctx.timeout(syncHeight, 100); }, { passive: true });
    ctx.on(window, 'load', syncHeight); ctx.resize(items, syncHeight);
    if (document.fonts) document.fonts.ready.then(function () { if (ctx.alive) syncHeight(); });
    ctx.cleanup(function () {
      if (heightBefore) section.style.setProperty('--ags-faq-visual-height', heightBefore);
      else section.style.removeProperty('--ags-faq-visual-height');
    });
    syncHeight();
  }

  var modules = [
    ['.ags-header-slot', header, '.ags-header,.ags-header__burger,.ags-header__mobile-menu,.ags-header__mobile-close,a'],
    ['.ags-statement', statement, '.ags-statement__flowers,.ags-statement__flower'],
    ['.ags-partners', partners, '.ags-partners__viewport,.ags-partners__track,.ags-partners__card,.ags-partners__arrow'],
    ['.ags-stories', stories, '.ags-stories__track,.ags-stories__card,.ags-stories__arrow'],
    ['.ags-faq', faq, '.ags-faq__entry,.ags-faq__item,.ags-faq__list,.ags-faq__question']
  ];
  function elements(root, selector) {
    var found = root.querySelectorAll ? Array.from(root.querySelectorAll(selector)) : [];
    if (root.matches && root.matches(selector)) found.unshift(root);
    return found;
  }
  function signature(section, selector) {
    return Array.from(section.querySelectorAll(selector)).filter(function (el) { return !el.closest('[data-ags-clone]'); });
  }
  function dispose(section) {
    var record = instances.get(section); if (!record) return;
    instances.delete(section); record.ctx.destroy();
  }
  function mount(root, explicit) {
    root = root || document;
    modules.forEach(function (module) {
      elements(root, module[0]).forEach(function (section) {
        if (explicit) suspended.delete(section);
        if (suspended.has(section)) return;
        var nodes = signature(section, module[2]), old = instances.get(section);
        if (old && old.nodes.length === nodes.length && old.nodes.every(function (el, i) { return el === nodes[i]; })) return;
        if (old) dispose(section);
        var ctx = context();
        try {
          if (module[1](section, ctx) === false) { ctx.destroy(); return; }
          instances.set(section, { ctx: ctx, nodes: nodes });
        } catch (error) { ctx.destroy(); console.error('[AGASSI] ' + module[0], error); }
      });
    });
  }
  function init(root) { mount(root || document, true); }
  function destroy(root) {
    root = root || document;
    instances.forEach(function (_, section) {
      if (section === root || root.contains(section)) { suspended.add(section); dispose(section); }
    });
  }
  function refresh(root) { destroy(root); init(root); }
  window.AgassiWholesale = { version: '2.0.0', init: init, refresh: refresh, destroy: destroy };

  var queued = false;
  function reconcile() {
    queued = false;
    instances.forEach(function (_, section) { if (!section.isConnected) dispose(section); });
    mount(document, false);
  }
  function start() {
    init();
    // Observe structural edits only; style/attribute changes from animations are ignored.
    var observer = new MutationObserver(function () {
      if (!queued) { queued = true; window.queueMicrotask(reconcile); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('agassi:refresh', function (event) {
      refresh(event.detail && event.detail.root || document);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})(window, document);
