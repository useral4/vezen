const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionAllowed = () => !reducedMotion.matches;

const menu = document.querySelector('.menu-toggle');
if (menu) {
  menu.hidden = false;
  const header = menu.closest('header');
  menu.addEventListener('click', () => {
    menu.setAttribute('aria-expanded', String(header.classList.toggle('nav-open')));
  });
  header.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !header.classList.contains('nav-open')) return;
    header.classList.remove('nav-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.focus();
  });
}

for (const group of document.querySelectorAll('[data-tabs]')) {
  const list = group.querySelector('[role="tablist"]');
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  let current = 0;

  function show(index) {
    if (index === current) return;
    tabs[current].setAttribute('aria-selected', 'false');
    tabs[current].tabIndex = -1;
    panels[current].classList.remove('entering');
    panels[current].hidden = true;
    tabs[index].setAttribute('aria-selected', 'true');
    tabs[index].tabIndex = 0;
    panels[index].hidden = false;
    if (motionAllowed()) panels[index].classList.add('entering');
    current = index;
  }

  tabs.forEach((tab, index) => tab.addEventListener('click', () => show(index)));
  list.addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    if (index === -1) return;
    const destinations = {
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!Object.hasOwn(destinations, event.key)) return;
    event.preventDefault();
    const destination = (destinations[event.key] + tabs.length) % tabs.length;
    show(destination);
    tabs[destination].focus();
  });
}

const dialog = document.querySelector('#inquiry');
if (dialog) {
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-contact]')) return;
    dialog.showModal();
    dialog.querySelector('h2').focus();
  });
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const { left, right, top, bottom } = dialog.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) dialog.close();
  });
}

if (motionAllowed() && 'IntersectionObserver' in window) {
  const reveals = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      target.classList.remove('awaiting-reveal');
      reveals.unobserve(target);
    }
  }, { rootMargin: '0px 0px -14px' });

  for (const section of document.querySelectorAll('[data-reveal]')) {
    if (section.getBoundingClientRect().top < innerHeight) continue;
    section.classList.add('awaiting-reveal');
    reveals.observe(section);
  }
}

const film = document.querySelector('[data-film]');
if (film) {
  const compact = matchMedia('(max-width: 700px)').matches;
  if (compact) film.poster = '../assets/brand-open-portrait.jpg';
  if (motionAllowed() && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || !motionAllowed()) {
        film.pause();
        return;
      }
      if (film.ended) return;
      if (!film.hasAttribute('src')) film.src = compact ? film.dataset.compact : film.dataset.film;
      film.play().catch(() => {});
    }, { threshold: .15 });
    observer.observe(film);
  }
}

const industry = document.querySelector('.industry-hero');
if (industry && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const steel = industry.querySelector('img');
  steel.classList.add('follow');
  industry.addEventListener('pointermove', event => {
    if (!motionAllowed()) return;
    const { left, top, width, height } = industry.getBoundingClientRect();
    steel.style.setProperty('--x', (10 - 20 * (event.clientX - left) / width) + 'px');
    steel.style.setProperty('--y', (7 - 14 * (event.clientY - top) / height) + 'px');
  });
  industry.addEventListener('pointerleave', () => {
    steel.style.removeProperty('--x');
    steel.style.removeProperty('--y');
  });
}
