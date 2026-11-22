(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const cards = [...document.querySelectorAll('[data-category-motion]')];
  let active = null;

  function stop() {
    if (!active) return;
    const { card, video, toggle } = active;
    active = null;
    video.pause();
    delete card.dataset.motion;
    toggle.setAttribute('aria-pressed', 'false');
  }

  function play(entry, isTouchPreview = false) {
    if (reducedMotion.matches || document.hidden || active === entry) return;
    stop();
    active = entry;
    const { card, video, toggle } = entry;
    card.dataset.motion = 'loading';
    if (isTouchPreview) toggle.setAttribute('aria-pressed', 'true');
    const compact = video.dataset.video;
    const hd = video.dataset.videoHd;
    const useHd = !isTouchPreview && finePointer.matches && !navigator.connection?.saveData && !entry.hdFailed;
    video.muted = true;

    function loadAndPlay(url) {
      if (video.getAttribute('src') !== url) video.src = url;
      else if (video.readyState > 0) video.currentTime = 0;
      video.play().catch(error => {
        if (entry !== active || !video.paused) return;
        if (url === hd && (error.name === 'NotSupportedError' || video.error)) {
          entry.hdFailed = true;
          loadAndPlay(compact);
        } else {
          stop();
        }
      });
    }
    loadAndPlay(useHd ? hd : compact);
  }

  const observer = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => {
      if (entries.some(item => item.target === active?.card && !item.isIntersecting)) stop();
    })
    : null;

  for (const card of cards) {
    const link = card.querySelector('.category-tile');
    const video = card.querySelector('video');
    const toggle = card.querySelector('.category-motion-toggle');
    const entry = { card, video, toggle };
    toggle.hidden = false;
    card.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') play(entry);
    });
    card.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse' && active === entry && !link.matches(':focus-visible')) stop();
    });
    link.addEventListener('focus', () => {
      if (link.matches(':focus-visible')) play(entry);
    });
    link.addEventListener('blur', () => {
      if (active === entry && !card.matches(':hover')) stop();
    });
    toggle.addEventListener('click', () => {
      if (active === entry) stop();
      else play(entry, true);
    });
    video.addEventListener('playing', () => {
      if (active === entry) card.dataset.motion = 'playing';
      else video.pause();
    });
    observer?.observe(card);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) stop();
  });
})();
