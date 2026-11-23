const dialog=document.getElementById('inquiry');
const title=document.getElementById('request-title');
const note=dialog.querySelector('.requestContext');
const field=dialog.querySelector('textarea');
let selected='';
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-inquire]');
 if(!b)return;
 const topic=b.dataset.inquire;
 if(!field.value||field.value===selected||topic!==selected)field.value=topic;
 selected=topic;
 title.textContent=topic?'Запросить предложение':'Обсудим вашу задачу';
 note.hidden=!topic;note.textContent=topic?'Тема запроса · '+topic:'';
 dialog.showModal();title.focus();
});
dialog.querySelector('.close').onclick=()=>dialog.close();
dialog.onclick=e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()};
const menu=document.querySelector('.menu');
menu.onclick=()=>menu.setAttribute('aria-expanded',document.getElementById('nav').classList.toggle('open'));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

const header = document.querySelector('body > header');
if (header) {
  let waitingForFrame = false;
  const updateHeader = () => {
    header.classList.toggle('has-scrolled', scrollY > 12);
    waitingForFrame = false;
  };
  addEventListener('scroll', () => {
    if (!waitingForFrame) {
      waitingForFrame = true;
      requestAnimationFrame(updateHeader);
    }
  }, { passive: true });
  updateHeader();
}

if (!reduced && 'IntersectionObserver' in window) {
  const stageObserver = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      target.classList.remove('motion-pending');
      stageObserver.unobserve(target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -22px' });

  function prepareEntrance(element, delay = 0) {
    if (element.getBoundingClientRect().top < innerHeight - 16) return;
    element.style.setProperty('--entry-delay', delay+'ms');
    element.classList.add('motion-eligible', 'motion-pending');
    stageObserver.observe(element);
  }

  document.querySelectorAll('.reveal').forEach(element => prepareEntrance(element));
  document.querySelectorAll('[data-stage]').forEach(group => {
    Array.from(group.children).forEach((element, index) => prepareEntrance(element, Math.min(index, 4) * 60));
  });
}
const mass=document.getElementById('mass');if(mass){mass.oninput=()=>{const value=mass.valueAsNumber;const valid=Number.isInteger(value)&&value>0&&value<=10000000;document.querySelectorAll('[data-pack]').forEach(b=>b.textContent=valid?Math.ceil(value/Number(b.dataset.pack)).toLocaleString('ru'):'—');document.getElementById('packnote').textContent=valid?'Расчёт округлён до целой упаковки вверх. Фактическую массу отгрузки согласует отдел продаж.':'Введите целое число от 1 до 10 000 000 кг.'}}
dialog.querySelector('form').addEventListener('formdata',event=>{if(selected){event.formData.set(field.name,selected+(field.value.trim()?'\n'+field.value.trim():''))}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-inquire]');if(!b)return;if(selected){if(field.value===selected)field.value='';field.required=false;field.placeholder='Объём партии, город поставки или ваш вопрос';field.parentElement.firstChild.nodeValue='Что важно учесть? (необязательно)'}else{field.required=true;field.placeholder='Например, ацетат хрома, 200 кг';field.parentElement.firstChild.nodeValue='Что нужно подобрать?'}});

const catalog = window.vezenCatalog;
const catalogPage = document.querySelector('[data-catalog-page]');

function normalizeCatalogText(value) {
  return value.normalize('NFKC').toLocaleLowerCase('ru').replaceAll('ё', 'е')
    .replace(/[‐‑–—−]/g, '-').replace(/[^\p{L}\p{N}\s-]+/gu, ' ').trim();
}

function catalogSearchTokens(value) {
  return normalizeCatalogText(value).replace(/^(cas|кас)\s+(?=\d)/, '').split(/\s+/).filter(Boolean);
}

function animateChange(region, update) {
  if (reduced || !region.animate) {
    update();
    return;
  }
  const opacity = Number(getComputedStyle(region).opacity);
  region.getAnimations().forEach(animation => animation.cancel());
  const leaving = region.animate({ opacity: [opacity, .65] }, {
    duration: 120, fill: 'forwards', easing: 'ease-out'
  });
  leaving.finished.then(() => {
    leaving.cancel();
    update();
    region.animate([
      { opacity: .65, transform: 'translateY(5px)' },
      { opacity: 1, transform: 'none' },
    ], { duration: 300, easing: 'cubic-bezier(.22,.75,.25,1)' });
  }, () => {});
}

if (catalog && catalogPage) {
  const field = document.getElementById('search');
  const catalogTop = catalogPage.querySelector('.catalog-top');
  const region = catalogPage.querySelector('.catalog-results');
  const banner = region.querySelector('[data-catalog-banner]');
  const list = region.querySelector('[data-product-results]');
  const status = document.getElementById('results');
  const heading = catalogPage.querySelector('h1');
  const crumb = catalogPage.querySelector('[data-crumb-tail]');
  const categoryNav = catalogPage.querySelector('.catalog-nav');
  const categoryLinks = [...categoryNav.querySelectorAll('a')];
  const initial = catalogPage.dataset.catalogPage;
  const categoryPicker = document.createElement('label');
  const categorySelect = document.createElement('select');
  categoryPicker.className = 'catalog-picker';
  categoryPicker.append('Категория', categorySelect);
  categorySelect.replaceChildren(...categoryLinks.map(link => new Option(
    link.querySelector('span').textContent,
    link.dataset.category,
  )));
  categorySelect.value = initial;
  categoryNav.before(categoryPicker);
  categorySelect.addEventListener('change', () => {
    categoryLinks.find(link => link.dataset.category === categorySelect.value)?.click();
  });
  let current = initial;
  let searchingAll = false;

  function searchProducts() {
    const tokens = catalogSearchTokens(field.value);
    const searchWholeCatalog = tokens.length > 0;
    if (searchWholeCatalog !== searchingAll) {
      list.innerHTML = catalog.state[searchWholeCatalog ? 'all' : current].rows;
      searchingAll = searchWholeCatalog;
      banner.hidden = searchWholeCatalog;
    }
    let visible = 0;
    list.querySelectorAll('.product-row').forEach(item => {
      const haystack = normalizeCatalogText(item.textContent+' '+(item.dataset.searchTerms || ''));
      item.hidden = tokens.some(token => !haystack.includes(token));
      visible += Number(!item.hidden);
    });
    list.querySelectorAll('[data-product-group]').forEach(group => {
      group.hidden = !group.querySelector('.product-row:not([hidden])');
    });
    status.textContent = searchWholeCatalog ? visible ? 'Во всём каталоге найдено: '+visible : 'Совпадений нет. Попробуйте название, марку или CAS.' : '';
  }

  function bringCatalogIntoView() {
    const offset = catalogTop.getBoundingClientRect().top - (header?.offsetHeight ?? 0) - 16;
    if (offset < 0) window.scrollTo({ top: window.scrollY + offset, behavior: 'instant' });
  }

  function showCategory(key, { query = '', revealStart = false } = {}) {
    const entry = catalog.state[key];
    if (!entry) return;
    const changed = key !== current;
    if (changed) {
      current = key;
      banner.innerHTML = entry.banner;
      list.innerHTML = entry.rows;
      heading.textContent = entry.heading;
      categorySelect.value = key;
      crumb.hidden = key === 'all';
      crumb.querySelector('[data-crumb-label]').textContent = entry.heading;
      document.title = entry.heading+' | Везен';
      categoryLinks.forEach(link => {
        if (link.dataset.category === key) link.setAttribute('aria-current','page');
        else link.removeAttribute('aria-current');
      });
      searchingAll = false;
      banner.hidden = false;
    }
    field.value = query;
    searchProducts();

    if (!revealStart) return;
    // The new list can be shorter than the outgoing list. Position the viewport after the swap.
    bringCatalogIntoView();
    if (changed && !reduced && region.animate) {
      region.getAnimations().forEach(animation => animation.cancel());
      region.animate({ opacity: [.72, 1] }, { duration: 220, easing: 'ease-out' });
    }
  }

  function categoryAtAddress() {
    if (location.protocol === 'file:') {
      return location.hash.slice(1) || initial;
    }
    const file = location.pathname.split('/').pop();
    return Object.keys(catalog.state).find(key => catalog.state[key].href === file) || initial;
  }

  field.addEventListener('input', searchProducts);
  catalogPage.addEventListener('click', event => {
    const link = event.target.closest('a[data-category]');
    if (!link || event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const key = link.dataset.category;
    const focusHeading = list.contains(link) && link.matches(':focus-visible');
    if (key !== current || new URLSearchParams(location.search).has('q')) {
      const destination = new URL(link.href);
      if (location.protocol === 'file:') {
        destination.pathname = location.pathname;
        destination.hash = key;
      }
      try {
        history.replaceState({ ...history.state, catalogScrollY: window.scrollY }, '');
        history.pushState({ category: key }, '', destination);
      } catch {
        location.assign(link.href);
        return;
      }
    }
    showCategory(key, { revealStart: true });
    if (focusHeading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  });

  function restoreCatalogFromAddress(event) {
    showCategory(categoryAtAddress(), { query: new URLSearchParams(location.search).get('q') || '' });
    const previousScroll = event?.state?.catalogScrollY;
    if (!Number.isFinite(previousScroll)) return;
    const address = location.href;
    // Native history can clamp the saved offset to the size of the outgoing category.
    requestAnimationFrame(() => {
      if (location.href === address) window.scrollTo({ top: previousScroll, behavior: 'instant' });
    });
  }
  window.addEventListener('popstate', restoreCatalogFromAddress);
  restoreCatalogFromAddress();
}

const backgroundClip = document.querySelector('.brand-hero video');
if (backgroundClip) {
  const portrait = matchMedia('(max-width:680px)').matches;
  if (portrait) backgroundClip.poster = backgroundClip.dataset.mobilePoster || 'assets/brand-open-portrait.jpg';
  let visible = false;
  const syncPlayback = () => {
    if (!visible || document.hidden) {
      backgroundClip.pause();
      return;
    }
    if (backgroundClip.ended) return;
    if (!backgroundClip.hasAttribute('src')) {
      backgroundClip.src = portrait ? backgroundClip.dataset.mobile : backgroundClip.dataset.desktop;
    }
    if (backgroundClip.paused) backgroundClip.play().catch(() => {});
  };
  if (!reduced && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= .2;
      syncPlayback();
    }, { threshold: .2 });
    observer.observe(backgroundClip);
    document.addEventListener('visibilitychange', syncPlayback);
  } else if (!reduced) {
    visible = true;
    syncPlayback();
  }
}

const journalFilters = document.querySelector('.journal-filters');
if (journalFilters) {
  journalFilters.hidden = false;
  const journalCards = [...document.querySelectorAll('[data-article-tag]')];
  journalFilters.addEventListener('click', event => {
    const button = event.target.closest('[data-journal]');
    if (!button) return;
    const topic = button.dataset.journal;
    journalFilters.querySelectorAll('button').forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    animateChange(document.querySelector('.journal-grid'), () => {
      journalCards.forEach(card => {
        card.hidden = Boolean(topic && card.dataset.articleTag !== topic);
      });
    });
  });
}

const faqTopics = document.querySelector('.faq-topics');
if (faqTopics) {
  const tabs = [...faqTopics.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  let current = -1;

  function selectFaqTopic(index) {
    if (index === current) return;
    tabs.forEach((tab, position) => {
      const active = position === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[position].hidden = !active;
    });
    if (current >= 0 && !reduced && panels[index].animate) {
      panels[index].animate(
        [{ opacity: .5, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }],
        { duration: 230, easing: 'ease-out' },
      );
    }
    current = index;
  }

  tabs.forEach((tab, index) => tab.addEventListener('click', () => selectFaqTopic(index)));
  faqTopics.addEventListener('keydown', event => {
    const destinations = {
      Home: 0, End: tabs.length - 1,
      ArrowLeft: current - 1, ArrowUp: current - 1,
      ArrowRight: current + 1, ArrowDown: current + 1,
    };
    if (!Object.hasOwn(destinations, event.key)) return;
    event.preventDefault();
    const next = (destinations[event.key] + tabs.length) % tabs.length;
    selectFaqTopic(next);
    tabs[next].focus();
  });

  selectFaqTopic(0);
  faqTopics.hidden = false;
  faqTopics.closest('.faq-module').classList.add('faq-enhanced');
}

if (!reduced && typeof Element.prototype.animate === 'function') {
  const disclosureGroups = new Map();
  document.querySelectorAll('.faq-item').forEach(details => {
    const summary = details.querySelector('summary');
    const answer = details.querySelector('.faq-answer');
    const group = details.getAttribute('name');
    let animation;
    let opening = false;
    const isOpen = () => animation ? opening : details.open;

    function setOpen(next) {
      if (isOpen() === next) return;
      const initialHeight = details.getBoundingClientRect().height;
      animation?.cancel();
      opening = next;
      if (opening) details.open = true;
      details.classList.toggle('closing', !opening);
      const borderHeight = details.offsetHeight - details.clientHeight;
      const finalHeight = summary.offsetHeight + (opening ? answer.offsetHeight : 0) + borderHeight;
      details.style.overflow = 'hidden';
      const transition = details.animate({ height: [initialHeight+'px', finalHeight+'px'] }, {
        duration: 290,
        easing: 'cubic-bezier(.24,.75,.28,1)',
        fill: 'both'
      });
      animation = transition;
      transition.onfinish = () => {
        if (animation !== transition) return;
        if (!opening) details.open = false;
        details.classList.remove('closing');
        transition.cancel();
        animation = undefined;
        details.style.removeProperty('overflow');
      };
    }

    if (group) {
      // Native groups still work with JavaScript disabled or reduced motion.
      details.removeAttribute('name');
      if (!disclosureGroups.has(group)) disclosureGroups.set(group, []);
      disclosureGroups.get(group).push(setOpen);
    }
    summary.addEventListener('click', event => {
      event.preventDefault();
      const next = !isOpen();
      if (next && group) disclosureGroups.get(group).forEach(toggle => {
        if (toggle !== setOpen) toggle(false);
      });
      setOpen(next);
    });
  });
}

