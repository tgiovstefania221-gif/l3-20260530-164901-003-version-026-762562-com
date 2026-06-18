(function () {
  const ready = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  };

  function initFilters() {
    const form = document.querySelector('[data-filter-form]');
    const cards = Array.from(document.querySelectorAll('[data-card]'));
    if (!form || !cards.length) return;

    const input = form.querySelector('[data-search]');
    const selects = Array.from(form.querySelectorAll('select'));
    const tags = Array.from(document.querySelectorAll('[data-quick-tag]'));

    const apply = () => {
      const q = (input?.value || '').trim().toLowerCase();
      const criteria = {};
      for (const select of selects) {
        criteria[select.name] = (select.value || '').trim().toLowerCase();
      }

      let visible = 0;
      for (const card of cards) {
        const text = (card.dataset.title + ' ' + card.dataset.region + ' ' + card.dataset.type + ' ' + card.dataset.genre + ' ' + card.dataset.tags + ' ' + card.dataset.year).toLowerCase();
        const matchQuery = !q || text.includes(q);
        const matchGenre = !criteria.genre || card.dataset.genre.toLowerCase().includes(criteria.genre);
        const matchRegion = !criteria.region || card.dataset.region.toLowerCase().includes(criteria.region);
        const matchType = !criteria.type || card.dataset.type.toLowerCase().includes(criteria.type);
        const matchYear = !criteria.year || card.dataset.year === criteria.year;
        const ok = matchQuery && matchGenre && matchRegion && matchType && matchYear;
        card.classList.toggle('hidden', !ok);
        if (ok) visible += 1;
      }

      const counter = document.querySelector('[data-result-count]');
      if (counter) counter.textContent = String(visible);
    };

    input?.addEventListener('input', apply);
    selects.forEach((sel) => sel.addEventListener('change', apply));

    tags.forEach((tag) => {
      tag.addEventListener('click', () => {
        const value = tag.dataset.value || '';
        const active = tag.classList.contains('active');
        tags.forEach((t) => t.classList.remove('active'));
        if (!active && input) {
          input.value = value;
          tag.classList.add('active');
        } else if (input) {
          input.value = '';
        }
        apply();
      });
    });

    apply();
  }

  function initPlayer() {
    const video = document.querySelector('[data-player]');
    if (!video) return;
    const overlay = document.querySelector('[data-play-overlay]');
    const button = document.querySelector('[data-play-button]');
    const hlsUrl = video.dataset.hls;
    const mp4Url = video.dataset.mp4;
    let hls = null;
    let usingHls = false;

    const hideOverlay = () => {
      if (overlay) overlay.classList.add('hidden');
    };

    const showOverlay = () => {
      if (overlay) overlay.classList.remove('hidden');
    };

    const startMp4 = () => {
      if (mp4Url && video.src !== mp4Url) {
        video.src = mp4Url;
      }
    };

    const tryPlay = async () => {
      try {
        await video.play();
        hideOverlay();
      } catch (err) {
        startMp4();
        try {
          await video.play();
          hideOverlay();
        } catch (err2) {
          showOverlay();
        }
      }
    };

    if (window.Hls && hlsUrl) {
      if (window.Hls.isSupported()) {
        hls = new window.Hls({
          lowLatencyMode: false,
          enableWorker: true
        });
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        usingHls = true;
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            try {
              hls.destroy();
            } catch (e) {}
            usingHls = false;
            startMp4();
            tryPlay();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
        usingHls = true;
      } else {
        startMp4();
      }
    } else {
      startMp4();
    }

    video.addEventListener('play', hideOverlay);
    video.addEventListener('pause', () => {
      if (video.currentTime > 0) showOverlay();
    });
    video.addEventListener('ended', showOverlay);

    button?.addEventListener('click', () => {
      tryPlay();
    });

    overlay?.addEventListener('click', () => {
      tryPlay();
    });

    // Preload metadata
    if (video.preload !== 'metadata') {
      video.preload = 'metadata';
    }
  }

  function initScrollShadow() {
    const header = document.querySelector('.header');
    if (!header) return;
    const apply = () => {
      header.style.boxShadow = window.scrollY > 8 ? '0 18px 44px rgba(0,0,0,0.28)' : 'none';
    };
    apply();
    window.addEventListener('scroll', apply, { passive: true });
  }

  function initHeroTrack() {
    const track = document.querySelector('[data-hero-track]');
    if (!track) return;
    let wheelLock = false;
    track.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        track.scrollLeft += event.deltaY;
        event.preventDefault();
      }
    }, { passive: false });
  }

  ready(function () {
    initFilters();
    initPlayer();
    initScrollShadow();
    initHeroTrack();
  });
})();
