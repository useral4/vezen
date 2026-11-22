(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

  for (const hero of document.querySelectorAll('[data-move]')) {
    const image = hero.querySelector('.hero-image img');
    hero.addEventListener('pointermove', event => {
      if (reduced.matches || !finePointer.matches || event.pointerType !== 'mouse') return;
      const box = hero.getBoundingClientRect();
      image.style.setProperty('--move-x', (0.5 - (event.clientX - box.left) / box.width) * 22 + 'px');
      image.style.setProperty('--move-y', (0.5 - (event.clientY - box.top) / box.height) * 14 + 'px');
    });
    hero.addEventListener('pointerleave', () => {
      image.style.removeProperty('--move-x');
      image.style.removeProperty('--move-y');
    });
  }

  const gallery = document.querySelector('.flow-catalogue');
  if (gallery && 'IntersectionObserver' in window) {
    const videos = [...gallery.querySelectorAll('[data-material-video]')];
    let inView = false;
    let current = null;

    function syncMaterial() {
      const selected = inView && !reduced.matches && !document.hidden
        ? videos.find(video => !video.closest('[role="tabpanel"]').hidden)
        : null;
      if (selected === current) return;
      if (current) {
        current.pause();
        current.classList.remove('is-playing');
        current.removeAttribute('src');
        current.load();
      }
      current = selected;
      if (!current) return;
      current.src = current.dataset.materialVideo;
      current.play().catch(() => {});
    }

    for (const video of videos) {
      video.addEventListener('playing', () => {
        if (video === current) video.classList.add('is-playing');
      });
      video.addEventListener('ended', () => video.classList.remove('is-playing'));
    }

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncMaterial();
    }, { threshold: .15 });
    observer.observe(gallery.querySelector('.tab-stage'));
    new MutationObserver(syncMaterial).observe(gallery.querySelector('.tab-stage'), {
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden'],
    });
    document.addEventListener('visibilitychange', syncMaterial);
    reduced.addEventListener('change', syncMaterial);
  }

  const search = document.getElementById('material-search');
  if (search) {
    const finder = search.closest('.atlas-finder');
    const resultList = finder.querySelector('.found-products');
    const status = finder.querySelector('.search-feedback');
    const normalise = value => value.toLocaleLowerCase('ru').replaceAll('ё', 'е').replace(/[–—−]/g, '-');
    const products = [...resultList.children].map(item => ({
      item,
      keywords: normalise(item.dataset.terms + ' ' + item.textContent),
    }));

    function updateSearch() {
      const query = normalise(search.value.trim());
      const tokens = query.split(/\s+/);
      let matches = 0;
      for (const { item, keywords } of products) {
        const found = Boolean(query) && tokens.every(token => keywords.includes(token));
        item.hidden = !found;
        if (found) matches++;
      }
      resultList.hidden = matches === 0;
      status.textContent = query ? (matches ? 'Найдено ' + matches : 'Ничего не найдено. Попробуйте другое название или CAS.') : '';
    }
    search.addEventListener('input', updateSearch);
    updateSearch();
  }

  for (const item of document.querySelectorAll('.edition-faq details')) {
    const summary = item.querySelector('summary');
    const answer = item.querySelector('.faq-answer');
    let animation;
    let opening;

    summary.addEventListener('click', event => {
      if (reduced.matches || typeof item.animate !== 'function') return;
      event.preventDefault();
      const start = item.getBoundingClientRect().height;
      opening = animation ? !opening : !item.open;
      animation?.cancel();
      item.open = true;
      item.classList.toggle('closing', !opening);
      item.style.overflow = 'hidden';
      const end = summary.offsetHeight + (opening ? answer.offsetHeight : 0) + 1;
      animation = item.animate({ height: [start + 'px', end + 'px'] }, {
        duration: 300,
        easing: 'cubic-bezier(.22,.73,.3,1)',
        fill: 'both',
      });
      animation.onfinish = () => {
        item.open = opening;
        item.classList.remove('closing');
        item.style.removeProperty('overflow');
        animation.cancel();
        animation = null;
      };
    });
  }
})();
