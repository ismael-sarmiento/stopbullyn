'use strict';
(() => {
  const catalog = window.StopbullynCatalog;
  const dictionaries = window.StopbullynI18n;
  const root = document.documentElement;
  const $ = (selector) => document.querySelector(selector);
  const all = (selector) => [...document.querySelectorAll(selector)];
  const storage = { get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }, set(key, value) { try { localStorage.setItem(key, value); } catch (_) {} } };
  const requestedLanguage = new URL(location.href).searchParams.get('lang');
  let language = ['es', 'en'].includes(requestedLanguage) ? requestedLanguage : storage.get('stopbullyn-language') === 'en' ? 'en' : 'es';
  let filter = 'all';
  let currentProduct = null;
  let currentView = 'front';
  let lastTrigger = null;
  let toastTimer;
  const dialog = $('#product-dialog');
  const grid = $('#product-grid');
  const toast = $('#toast');
  const t = (key) => dictionaries[language][key];
  const imagePath = (product) => `assets/images/original-${String(product.image).padStart(2, '0')}.jpg`;
  const visibleProducts = () => catalog.filter((product) => filter === 'all' || product.category === filter);
  const categoryName = (category) => ({ training: 'Training', padel: language === 'es' ? 'Pádel' : 'Padel', grappling: 'Grappling' })[category];

  function icon(name, className = 'icon') {
    const img = document.createElement('img');
    img.src = `assets/icons/${name}.svg`;
    img.alt = '';
    img.width = 20;
    img.height = 20;
    img.className = className;
    return img;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    (dialog.open ? dialog : document.body).append(toast);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
  }

  function updateTheme() {
    const isDark = root.dataset.theme !== 'light';
    const label = t(isDark ? 'light' : 'dark');
    $('#theme-toggle').setAttribute('aria-label', label);
    $('#theme-toggle').title = label;
    $('.theme-icon').src = `assets/icons/${isDark ? 'sun' : 'moon-stars'}.svg`;
    $('meta[name="theme-color"]').content = isDark ? '#101111' : '#f5f3ed';
  }

  function closeMenu(restoreFocus = false) {
    $('#mobile-menu').hidden = true;
    $('#menu-toggle').setAttribute('aria-expanded', 'false');
    $('#menu-toggle').setAttribute('aria-label', t('openMenu'));
    $('#menu-toggle img').src = 'assets/icons/list.svg';
    if (restoreFocus) $('#menu-toggle').focus();
  }

  function renderCatalog() {
    const fragment = document.createDocumentFragment();
    const products = visibleProducts();
    products.forEach((product) => {
      const card = document.createElement('article');
      card.className = 'product-card';
      const button = document.createElement('button');
      button.className = 'product-open';
      button.type = 'button';
      button.dataset.open = product.id;
      button.setAttribute('aria-label', `${t('viewDesign')}: ${product.name[language]}, ${t(product.type)}`);
      const frame = document.createElement('div');
      frame.className = 'product-frame';
      const photo = document.createElement('div');
      photo.className = 'product-photo';
      photo.dataset.side = product.side;
      const img = document.createElement('img');
      img.src = imagePath(product);
      img.alt = `${t('frontAlt')} ${product.name[language]}`;
      img.width = 1600;
      img.height = 900;
      img.loading = 'lazy';
      img.decoding = 'async';
      photo.append(img);
      const label = document.createElement('span');
      label.className = 'product-label';
      label.textContent = categoryName(product.category).toUpperCase();
      const view = document.createElement('span');
      view.className = 'product-view';
      view.setAttribute('aria-hidden', 'true');
      view.append(icon('arrow-up-right', ''));
      frame.append(photo, label, view);
      const meta = document.createElement('div');
      meta.className = 'product-meta';
      const info = document.createElement('div');
      const name = document.createElement('h3');
      name.className = 'product-name';
      name.textContent = product.name[language];
      const type = document.createElement('p');
      type.className = 'product-type';
      type.textContent = t(product.type);
      const number = document.createElement('span');
      number.className = 'product-number';
      number.textContent = String(product.image).padStart(2, '0');
      info.append(name, type);
      meta.append(info, number);
      button.append(frame, meta);
      card.append(button);
      fragment.append(card);
    });
    grid.replaceChildren(fragment);
    $('#product-count').textContent = `${products.length} ${t(products.length === 1 ? 'design' : 'designs')}`;
    all('[data-filter]').forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
      if (button.dataset.filter === 'padel') button.textContent = categoryName('padel');
    });
  }

  function setLanguage(nextLanguage) {
    language = nextLanguage;
    root.lang = language;
    storage.set('stopbullyn-language', language);
    const url = new URL(location.href);
    if (language === 'en') url.searchParams.set('lang', 'en'); else url.searchParams.delete('lang');
    history.replaceState(null, '', url);
    all('[data-i18n]').forEach((element) => { element.textContent = t(element.dataset.i18n); });
    all('[data-i18n-aria-label]').forEach((element) => { element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel)); });
    all('[data-i18n-alt]').forEach((element) => { element.alt = t(element.dataset.i18nAlt); });
    $('#language-toggle').textContent = language === 'es' ? 'EN' : 'ES';
    $('#language-toggle').lang = language === 'es' ? 'en' : 'es';
    $('#language-toggle').setAttribute('aria-label', language === 'es' ? 'Switch to English' : 'Cambiar a español');
    document.title = t('pageTitle');
    $('meta[name="description"]').content = t('metaDescription');
    updateTheme();
    closeMenu();
    renderCatalog();
    if (currentProduct) renderDialog();
  }

  function setFilter(value) {
    if (!['all', 'training', 'padel', 'grappling'].includes(value)) return;
    filter = value;
    renderCatalog();
  }

  function setView(view) {
    currentView = view;
    const product = currentProduct;
    if (!product) return;
    const side = view === 'both' ? 'both' : view === 'front' ? product.side : product.side === 'left' ? 'right' : 'left';
    $('#dialog-photo').dataset.side = side;
    $('#dialog-image').alt = `${t(view === 'both' ? 'bothAlt' : view === 'front' ? 'frontAlt' : 'backAlt')} ${product.name[language]}`;
    for (const choice of ['front', 'back', 'both']) {
      const button = $(`#view-${choice}`);
      button.classList.toggle('is-active', choice === view);
      button.setAttribute('aria-pressed', String(choice === view));
    }
  }

  function renderDialog() {
    const product = currentProduct;
    $('#dialog-image').src = imagePath(product);
    $('#dialog-title').textContent = product.name[language];
    $('#dialog-category').textContent = categoryName(product.category).toUpperCase();
    $('#dialog-type').textContent = t(product.type);
    $('#dialog-description').textContent = product.description[language];
    $('#open-original').href = imagePath(product);
    const products = visibleProducts();
    const index = products.findIndex((p) => p.id === product.id);
    $('#design-position').textContent = `${index + 1} / ${products.length}`;
    $('#previous-design').disabled = index <= 0;
    $('#next-design').disabled = index >= products.length - 1;
    setView(currentView);
  }

  function openProduct(id, trigger = null, updateUrl = true) {
    const product = catalog.find((entry) => entry.id === id);
    if (!product) return;
    if (!visibleProducts().some((entry) => entry.id === id)) setFilter('all');
    currentProduct = product;
    currentView = 'front';
    if (trigger) lastTrigger = trigger;
    renderDialog();
    if (!dialog.open) {
      dialog.showModal();
      document.body.classList.add('dialog-open');
      $('#dialog-close').focus({ preventScroll: true });
    }
    dialog.scrollTop = 0;
    if (updateUrl) {
      const url = new URL(location.href);
      url.hash = `design-${product.id}`;
      history.replaceState(null, '', url);
    }
  }

  function cleanProductUrl() {
    if (location.hash.startsWith('#design-')) {
      const url = new URL(location.href);
      url.hash = 'collection';
      history.replaceState(null, '', url);
    }
  }

  function closeProduct() { if (dialog.open) dialog.close(); }
  function checkDeepLink() {
    if (location.hash.startsWith('#design-')) openProduct(location.hash.slice(8), null, false);
    else if (dialog.open) closeProduct();
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-open]');
    if (button) openProduct(button.dataset.open, button);
    const filterButton = event.target.closest('[data-filter]');
    if (filterButton) setFilter(filterButton.dataset.filter);
    const sportLink = event.target.closest('[data-category]');
    if (sportLink) setFilter(sportLink.dataset.category);
    if (event.target.closest('#mobile-menu a')) closeMenu();
  });
  $('#language-toggle').addEventListener('click', () => setLanguage(language === 'es' ? 'en' : 'es'));
  $('#theme-toggle').addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    storage.set('stopbullyn-theme', root.dataset.theme);
    updateTheme();
  });
  $('#menu-toggle').addEventListener('click', () => {
    const open = $('#mobile-menu').hidden;
    $('#mobile-menu').hidden = !open;
    $('#menu-toggle').setAttribute('aria-expanded', String(open));
    $('#menu-toggle').setAttribute('aria-label', t(open ? 'closeMenu' : 'openMenu'));
    $('#menu-toggle img').src = `assets/icons/${open ? 'x-lg' : 'list'}.svg`;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !$('#mobile-menu').hidden) closeMenu(true);
  });
  const desktopMedia = matchMedia('(min-width: 761px)');
  desktopMedia.addEventListener('change', (event) => { if (event.matches) closeMenu(); });
  $('#dialog-close').addEventListener('click', closeProduct);
  let backdropPointer = false;
  dialog.addEventListener('pointerdown', (event) => { backdropPointer = event.target === dialog; });
  dialog.addEventListener('click', (event) => { if (backdropPointer && event.target === dialog) closeProduct(); backdropPointer = false; });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    currentProduct = null;
    cleanProductUrl();
    toast.hidden = true;
    document.body.append(toast);
    const fallback = lastTrigger?.dataset.open ? grid.querySelector(`[data-open="${lastTrigger.dataset.open}"]`) : null;
    (lastTrigger?.isConnected ? lastTrigger : fallback || $('#collection')).focus({ preventScroll: true });
  });
  for (const view of ['front', 'back', 'both']) $(`#view-${view}`).addEventListener('click', () => setView(view));
  for (const [id, step] of [['previous-design', -1], ['next-design', 1]]) {
    $(`#${id}`).addEventListener('click', () => {
      const products = visibleProducts();
      const index = products.findIndex((product) => product.id === currentProduct.id);
      if (products[index + step]) openProduct(products[index + step].id);
    });
  }
  $('#share-design').addEventListener('click', async () => {
    if (!currentProduct) return;
    const product = currentProduct;
    const url = new URL(location.href);
    url.hash = `design-${product.id}`;
    if (language === 'en') url.searchParams.set('lang', 'en');
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ title: `Stopbullyn · ${product.name[language]}`, url: url.href }); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(url.href); showToast(t('copied')); }
    catch (_) { showToast(t('copyFallback')); }
  });
  window.addEventListener('hashchange', checkDeepLink);
  window.addEventListener('popstate', checkDeepLink);

  const tiltMedia = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  let tiltTarget = null;
  let tiltFrame = null;
  let pendingTilt;
  function resetTilt() {
    if (tiltFrame) cancelAnimationFrame(tiltFrame);
    tiltFrame = null;
    if (tiltTarget) { tiltTarget.style.removeProperty('--rx'); tiltTarget.style.removeProperty('--ry'); }
    tiltTarget = null;
  }
  document.addEventListener('pointermove', (event) => {
    if (!tiltMedia.matches || dialog.open || event.pointerType === 'touch') return;
    const target = event.target.closest('.hero-garment,.product-frame');
    if (target !== tiltTarget) { resetTilt(); tiltTarget = target; }
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const strength = target.classList.contains('hero-garment') ? 7 : 3;
    pendingTilt = { x: (event.clientX - rect.left) / rect.width - .5, y: (event.clientY - rect.top) / rect.height - .5, strength };
    if (!tiltFrame) tiltFrame = requestAnimationFrame(() => {
      tiltFrame = null;
      if (!tiltTarget) return;
      tiltTarget.style.setProperty('--rx', `${-pendingTilt.y * pendingTilt.strength}deg`);
      tiltTarget.style.setProperty('--ry', `${pendingTilt.x * pendingTilt.strength}deg`);
    });
  });
  document.addEventListener('pointerleave', resetTilt);
  window.addEventListener('blur', resetTilt);
  tiltMedia.addEventListener('change', resetTilt);
  setLanguage(language);
  checkDeepLink();
})();
