(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const entries = new Map();
  const visibleThreshold = .55;
  let active = null;
  let autoplayBlocked = false;

  function stop() {
    if (!active) return;
    const { entry } = active;
    active = null;
    entry.video.pause();
    delete entry.card.dataset.motion;
  }

  function playNextVisible() {
    if (finePointer.matches || reducedMotion.matches || document.hidden || autoplayBlocked || active) return;
    const next = [...entries.values()].find(entry => entry.visible && !entry.finished && !entry.failed);
    if (next) play(next, true);
  }

  function play(entry, automatic = false) {
    if (reducedMotion.matches || document.hidden || active?.entry === entry) return;
    stop();
    const playback = { entry, automatic };
    active = playback;

    const { card, video } = entry;
    const compact = video.dataset.video;
    const hd = video.dataset.videoHd;
    const useHd = !automatic && finePointer.matches && !navigator.connection?.saveData && !entry.hdFailed;
    card.dataset.motion = 'loading';
    video.muted = true;
    video.loop = !automatic;

    function loadAndPlay(url) {
      if (video.getAttribute('src') !== url) video.src = url;
      else if (!automatic && video.readyState > 0) video.currentTime = 0;
      video.play().catch(error => {
        if (active !== playback) return;
        if (url === hd && (error.name === 'NotSupportedError' || video.error)) {
          entry.hdFailed = true;
          loadAndPlay(compact);
          return;
        }
        if (automatic) {
          if (error.name === 'NotAllowedError') autoplayBlocked = true;
          else entry.failed = true;
        }
        stop();
        playNextVisible();
      });
    }
    loadAndPlay(useHd ? hd : compact);
  }

  function refreshMode() {
    stop();
    for (const entry of entries.values()) {
      if (entry.finished && !finePointer.matches && !reducedMotion.matches) entry.card.dataset.motion = 'finished';
      else delete entry.card.dataset.motion;
    }
    playNextVisible();
  }

  const observer = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(changes => {
      for (const change of changes) {
        const entry = entries.get(change.target);
        entry.visible = change.isIntersecting && change.intersectionRatio >= visibleThreshold;
        if (active?.entry === entry && (active.automatic ? !entry.visible : !change.isIntersecting)) stop();
      }
      playNextVisible();
    }, { threshold: [0, visibleThreshold], rootMargin: '-64px 0px 0px' })
    : null;

  for (const card of document.querySelectorAll('[data-category-motion]')) {
    const link = card.querySelector('.category-tile');
    const video = card.querySelector('video');
    const entry = { card, video, visible: false, finished: false };
    entries.set(card, entry);

    card.addEventListener('pointerenter', event => {
      if (finePointer.matches && event.pointerType === 'mouse') play(entry);
    });
    card.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse' && active?.entry === entry && !active.automatic && !link.matches(':focus-visible')) stop();
    });
    link.addEventListener('focus', () => {
      if (finePointer.matches && link.matches(':focus-visible')) play(entry);
    });
    link.addEventListener('blur', () => {
      if (active?.entry === entry && !active.automatic && !card.matches(':hover')) stop();
    });

    video.addEventListener('playing', () => {
      if (active?.entry === entry) card.dataset.motion = 'playing';
      else video.pause();
    });
    video.addEventListener('ended', () => {
      if (active?.entry !== entry || !active.automatic) return;
      active = null;
      entry.finished = true;
      // Each loop ends on the same glass composition as its poster.
      card.dataset.motion = 'finished';
      video.removeAttribute('src');
      video.load();
      playNextVisible();
    });
    observer?.observe(card);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else playNextVisible();
  });
  reducedMotion.addEventListener('change', refreshMode);
  finePointer.addEventListener('change', refreshMode);
})();
