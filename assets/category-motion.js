(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const entries = new Map();
  const visibleThreshold = .55;
  let desktopActive = null;
  let autoplayBlocked = false;

  function stop(entry) {
    if (!entry?.playback) return;
    entry.playback = null;
    if (desktopActive === entry) desktopActive = null;
    entry.video.pause();
    delete entry.card.dataset.motion;
  }

  function playVisible() {
    if (finePointer.matches || reducedMotion.matches || document.hidden || autoplayBlocked) return;
    for (const entry of entries.values()) {
      if (entry.visible && !entry.finished && !entry.failed) play(entry, true);
    }
  }

  function play(entry, automatic = false) {
    if (reducedMotion.matches || document.hidden || entry.playback) return;
    if (!automatic) {
      stop(desktopActive);
      desktopActive = entry;
    }
    const playback = { automatic };
    entry.playback = playback;

    const { card, video } = entry;
    const compact = video.dataset.video;
    const hd = video.dataset.videoHd;
    const mobile = video.dataset.videoMobile;
    const useHd = !automatic && finePointer.matches && !navigator.connection?.saveData && !entry.hdFailed;
    card.dataset.motion = 'loading';
    video.muted = true;
    video.loop = !automatic;

    function loadAndPlay(url) {
      if (video.getAttribute('src') !== url) video.src = url;
      else if (!automatic && video.readyState > 0) video.currentTime = 0;
      video.play().catch(error => {
        if (entry.playback !== playback) return;
        if (url === hd && (error.name === 'NotSupportedError' || video.error)) {
          entry.hdFailed = true;
          loadAndPlay(compact);
          return;
        }
        if (automatic) {
          if (error.name === 'NotAllowedError') autoplayBlocked = true;
          else entry.failed = true;
        }
        stop(entry);
      });
    }
    loadAndPlay(automatic ? mobile : useHd ? hd : compact);
  }

  function refreshMode() {
    for (const entry of entries.values()) stop(entry);
    playVisible();
  }

  const observer = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(changes => {
      for (const change of changes) {
        const entry = entries.get(change.target);
        entry.visible = change.isIntersecting && change.intersectionRatio >= visibleThreshold;
        if (!change.isIntersecting) stop(entry);
      }
      playVisible();
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
      if (event.pointerType === 'mouse' && desktopActive === entry && !link.matches(':focus-visible')) stop(entry);
    });
    link.addEventListener('focus', () => {
      if (finePointer.matches && link.matches(':focus-visible')) play(entry);
    });
    link.addEventListener('blur', () => {
      if (desktopActive === entry && !card.matches(':hover')) stop(entry);
    });

    video.addEventListener('playing', () => {
      if (entry.playback) card.dataset.motion = 'playing';
      else video.pause();
    });
    video.addEventListener('ended', () => {
      if (!entry.playback?.automatic) return;
      entry.finished = true;
      stop(entry);
      video.removeAttribute('src');
      video.load();
    });
    observer?.observe(card);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      for (const entry of entries.values()) stop(entry);
    } else {
      playVisible();
    }
  });
  reducedMotion.addEventListener('change', refreshMode);
  finePointer.addEventListener('change', refreshMode);
})();
