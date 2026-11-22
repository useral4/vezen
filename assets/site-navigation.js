(() => {
  const nav = document.getElementById('nav');
  const mobileMenu = document.querySelector('header > .menu');
  const catalogMenu = nav.querySelector('.nav-catalog');
  const toggle = catalogMenu.querySelector('button');
  const links = document.getElementById('catalog-links');
  const pointerMenu = matchMedia('(min-width: 941px) and (hover: hover) and (pointer: fine)');
  const searchButton = document.querySelector('.header-search');
  const searchDialog = document.getElementById('header-search-dialog');
  const field = document.getElementById('header-search-query');
  const list = searchDialog.querySelector('.header-search-results');
  const status = searchDialog.querySelector('.header-search-status');
  const closeSearch = searchDialog.querySelector('.close');
  const showCatalog = searchDialog.querySelector('button[type="submit"]');
  let hoverTimer;
  let records;

  function setCatalogMenu(open) {
    clearTimeout(hoverTimer);
    toggle.setAttribute('aria-expanded', String(open));
    links.hidden = !open;
  }

  toggle.addEventListener('click', () => {
    setCatalogMenu(links.hidden);
  });
  catalogMenu.addEventListener('pointerenter', event => {
    if (!pointerMenu.matches || event.pointerType !== 'mouse') return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => setCatalogMenu(true), 110);
  });
  catalogMenu.addEventListener('pointerleave', event => {
    if (!pointerMenu.matches || event.pointerType !== 'mouse') return;
    clearTimeout(hoverTimer);
    if (links.contains(document.activeElement)) return;
    hoverTimer = setTimeout(() => setCatalogMenu(false), 155);
  });
  catalogMenu.addEventListener('focusout', event => {
    if (!catalogMenu.contains(event.relatedTarget) && !catalogMenu.matches(':hover')) setCatalogMenu(false);
  });
  document.addEventListener('pointerdown', event => {
    if (!catalogMenu.contains(event.target)) setCatalogMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || searchDialog.open) return;
    if (!links.hidden) {
      const restoreFocus = catalogMenu.contains(document.activeElement);
      setCatalogMenu(false);
      if (restoreFocus) toggle.focus();
    } else if (nav.classList.contains('open')) {
      closeMobileMenu();
      mobileMenu.focus();
    }
  });
  mobileMenu.addEventListener('click', () => {
    if (!nav.classList.contains('open')) setCatalogMenu(false);
  });
  pointerMenu.addEventListener('change', () => setCatalogMenu(false));

  function closeMobileMenu() {
    nav.classList.remove('open');
    mobileMenu.setAttribute('aria-expanded', 'false');
    setCatalogMenu(false);
  }

  function indexCatalog() {
    const entries = Object.entries(window.vezenCatalog.state);
    const template = document.createElement('template');
    template.innerHTML = window.vezenCatalog.state.all.rows;
    const groups = entries.filter(([key]) => key !== 'all').map(([, group]) => ({
      href: group.href,
      title: group.heading,
      label: 'Категория',
      searchable: normalizeCatalogText(group.heading),
    }));
    const products = [...template.content.querySelectorAll('.product-row')].map(row => {
      const description = row.querySelector('a > div:nth-child(2)');
      return {
        href: row.querySelector('a').getAttribute('href'),
        title: description.querySelector('strong').textContent,
        label: description.querySelector('small').textContent,
        searchable: normalizeCatalogText(row.textContent + ' ' + row.dataset.searchTerms),
      };
    });
    const pages = window.vezenSearchPages.map(({ href, title, label, description }) => ({
      href, title, label,
      searchable: normalizeCatalogText(title + ' ' + description),
    }));
    return { groups, products, pages };
  }

  function resultItem({ href, title, label }) {
    const item = document.createElement('li');
    const anchor = document.createElement('a');
    const name = document.createElement('strong');
    const category = document.createElement('span');
    anchor.href = href;
    name.textContent = title;
    category.textContent = label;
    anchor.append(name, category);
    item.append(anchor);
    return item;
  }

  function updateResults() {
    records ??= indexCatalog();
    const tokens = catalogSearchTokens(field.value);
    const findMatches = items => items.filter(item => tokens.every(token => item.searchable.includes(token)));
    const groups = tokens.length ? findMatches(records.groups) : records.groups;
    const products = tokens.length ? findMatches(records.products) : [];
    const pages = tokens.length ? findMatches(records.pages) : [];
    const total = groups.length + products.length + pages.length;
    const matches = tokens.length ? [...groups.slice(0, 2), ...products.slice(0, pages.length ? 4 : 7), ...pages].slice(0, 8) : groups.slice(0, 5);
    list.replaceChildren(...matches.map(resultItem));
    showCatalog.hidden = !products.length;
    status.textContent = !tokens.length ? 'Категории каталога' : total ? 'Найдено ' + total : 'Совпадений нет. Попробуйте другой запрос.';
  }

  searchButton.addEventListener('click', () => {
    closeMobileMenu();
    updateResults();
    searchDialog.showModal();
    field.focus();
  });
  field.addEventListener('input', updateResults);
  searchDialog.querySelector('form').addEventListener('submit', event => {
    if (showCatalog.hidden) {
      event.preventDefault();
      list.querySelector('a')?.focus();
    }
  });
  closeSearch.addEventListener('click', () => searchDialog.close());
  searchDialog.addEventListener('click', event => {
    if (event.target !== searchDialog) return;
    const { left, top, right, bottom } = searchDialog.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) searchDialog.close();
  });
})();
