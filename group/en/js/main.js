(() => {
  'use strict';

  // Один жизненный цикл на документ, в том числе при повторном подключении файла.
  const key = Symbol.for('agassi.group.runtime.v2');
  if (document[key]) {
    document[key].refresh();
    return;
  }
  const mounted = new Map();
  const selectors = '.agassi-group-header, .agassi-group-partners, [data-agassi-form]';
  let frame = 0;

  function initHeader(header, signal) {
    const toggle = header.querySelector('.agassi-group-header__toggle');
    const navigation = header.querySelector('.agassi-group-header__nav');
    if (!toggle || !navigation) return false;
    const mobile = matchMedia('(max-width: 1199px)');
    let open = false;
    function setMenu(next, restoreFocus = false) {
      open = mobile.matches && next;
      navigation.classList.toggle('agassi-group-header__nav--open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      toggle.hidden = !mobile.matches;
      if (restoreFocus && mobile.matches) toggle.focus();
    }
    header.classList.add('agassi-group-header--enhanced');
    toggle.addEventListener('click', () => setMenu(!open), { signal });
    navigation.addEventListener('click', event => {
      if (event.target.closest('a')) setMenu(false);
    }, { signal });
    header.addEventListener('keydown', event => {
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        setMenu(false, true);
      }
    }, { signal });
    document.addEventListener('click', event => {
      if (open && !header.contains(event.target)) setMenu(false);
    }, { signal });
    mobile.addEventListener('change', () => {
      const focusedLink = navigation.contains(document.activeElement);
      setMenu(false, focusedLink);
    }, { signal });
    setMenu(false);
    return () => {
      header.classList.remove('agassi-group-header--enhanced');
      navigation.classList.remove('agassi-group-header__nav--open');
      toggle.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    };
  }

  function initPartners(section, signal) {
    const viewport = section.querySelector('.agassi-group-partners__viewport');
    const track = section.querySelector('.agassi-group-partners__track');
    const previous = section.querySelector('.agassi-group-partners__arrow--prev');
    const next = section.querySelector('.agassi-group-partners__arrow--next');
    const controls = section.querySelector('.agassi-group-partners__controls');
    if (!viewport || !track || !previous || !next || !controls) return false;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    function update() {
      const maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      controls.hidden = maximum <= 1;
      previous.disabled = viewport.scrollLeft <= 1;
      next.disabled = viewport.scrollLeft >= maximum - 1;
    }
    function move(direction) {
      const card = track.querySelector('.agassi-group-partners__card');
      if (!card) return;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      viewport.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    }
    previous.addEventListener('click', () => move(-1), { signal });
    next.addEventListener('click', () => move(1), { signal });
    viewport.addEventListener('scroll', update, { passive: true, signal });
    viewport.addEventListener('keydown', event => {
      if (event.target !== viewport || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
      }
    }, { signal });
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
    observer?.observe(viewport);
    observer?.observe(track);
    if (!observer) window.addEventListener('resize', update, { signal });
    update();
    return () => { observer?.disconnect(); controls.hidden = true; };
  }

  function initForm(form, signal) {
    const submit = form.querySelector('[type="submit"]');
    const status = form.querySelector('[role="status"]');
    const note = form.querySelector('.agassi-group-contact__note');
    if (!submit || !status || !note) return false;
    let endpoint;
    try {
      const value = (form.dataset.agassiEndpoint || '').trim();
      if (value) {
        const parsed = new URL(value, location.href);
        if (parsed.protocol === 'https:') endpoint = parsed.href;
      }
    } catch { /* Некорректный адрес не включает отправку. */ }
    submit.disabled = !endpoint;
    if (endpoint) note.textContent = 'Use this form for business enquiries. Please do not include sensitive personal information.';
    let busy = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!endpoint || busy || !form.reportValidity()) return;
      busy = true;
      submit.disabled = true;
      form.setAttribute('aria-busy', 'true');
      status.textContent = 'Sending your enquiry…';
      const request = new AbortController();
      const abortRequest = () => request.abort();
      signal.addEventListener('abort', abortRequest, { once: true });
      const timer = setTimeout(abortRequest, 15000);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'omit',
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
          signal: request.signal
        });
        const result = await response.json();
        if (!response.ok || result?.ok !== true) throw new Error('Request not accepted');
        if (!signal.aborted) {
          status.textContent = 'Thank you. Your enquiry has been received.';
          form.reset();
        }
      } catch {
        if (!signal.aborted) status.textContent = 'Delivery could not be confirmed. Your text is still here. Please try again later.';
      } finally {
        clearTimeout(timer);
        signal.removeEventListener('abort', abortRequest);
        busy = false;
        form.removeAttribute('aria-busy');
        submit.disabled = !endpoint;
      }
    }, { signal });
  }

  function refresh() {
    for (const [element, instance] of mounted) {
      if (!element.isConnected || instance.children.some(child => !element.contains(child))) {
        instance.controller.abort();
        instance.cleanup?.();
        mounted.delete(element);
      }
    }
    document.querySelectorAll(selectors).forEach(element => {
      if (mounted.has(element)) return;
      const controller = new AbortController();
      const initializer = element.matches('[data-agassi-form]') ? initForm : element.matches('.agassi-group-header') ? initHeader : initPartners;
      const cleanup = initializer(element, controller.signal);
      if (cleanup === false) { controller.abort(); return; }
      mounted.set(element, { controller, cleanup, children: Array.from(element.querySelectorAll('button, nav, form, .agassi-group-partners__viewport, .agassi-group-partners__track')) });
    });
  }
  function scheduleRefresh() {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; refresh(); });
  }
  document[key] = { refresh: scheduleRefresh };
  function start() {
    refresh();
    new MutationObserver(scheduleRefresh).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', event => {
      const link = event.target.closest('[data-agassi-interest]');
      const select = document.querySelector('[data-agassi-form] select[name="interest"]');
      if (link && select) select.value = link.dataset.agassiInterest;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
