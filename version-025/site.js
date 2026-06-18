
import { H as Hls } from './hls-vendor-bbsaiqh1.js';

const onReady = (fn) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
};

const normalize = (value) => (value || '')
  .toString()
  .trim()
  .toLowerCase()
  .replace(/\s+/g, ' ');

const createDebounce = (fn, delay = 120) => {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
};

function setupMobileMenu() {
  const button = document.querySelector('[data-menu-button]');
  const drawer = document.querySelector('[data-mobile-drawer]');
  if (!button || !drawer) return;

  button.addEventListener('click', () => {
    const open = drawer.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
  });

  drawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    });
  });
}

function setupBackToTop() {
  const button = document.querySelector('[data-back-top]');
  if (!button) return;
  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function matchesQuery(card, query) {
  if (!query) return true;
  const haystack = normalize([
    card.dataset.title,
    card.dataset.region,
    card.dataset.type,
    card.dataset.genre,
    card.dataset.tags,
    card.dataset.year,
    card.dataset.summary
  ].join(' '));
  return haystack.includes(query);
}

function setupLocalFilters() {
  document.querySelectorAll('[data-filter-input]').forEach((input) => {
    const targetSelector = input.getAttribute('data-filter-target');
    if (!targetSelector) return;

    const target = document.querySelector(targetSelector);
    if (!target) return;

    const cards = Array.from(target.querySelectorAll('[data-filter-card]'));
    const emptyState = target.querySelector('[data-empty-state]');
    const apply = createDebounce(() => {
      const query = normalize(input.value);
      let visible = 0;

      cards.forEach((card) => {
        const show = matchesQuery(card, query);
        card.classList.toggle('is-hidden', !show);
        if (show) visible += 1;
      });

      if (emptyState) {
        emptyState.classList.toggle('is-hidden', visible !== 0);
      }
    }, 80);

    input.addEventListener('input', apply);
    apply();
  });
}

async function setupGlobalSearch() {
  const input = document.querySelector('[data-global-search-input]');
  const results = document.querySelector('[data-global-search-results]');
  if (!input || !results) return;

  let catalog = [];
  try {
    const response = await fetch('assets/catalog.json', { cache: 'force-cache' });
    catalog = await response.json();
  } catch (error) {
    results.innerHTML = '<p class="muted">搜索数据暂时无法载入，请稍后重试。</p>';
    return;
  }

  const pageQuery = new URLSearchParams(window.location.search).get('q') || '';
  input.value = pageQuery;

  const render = (query) => {
    const value = normalize(query);
    const filtered = !value
      ? catalog.slice(0, 60)
      : catalog.filter((item) => normalize([
          item.title,
          item.region,
          item.type,
          item.genre,
          item.tags.join(' '),
          item.summary
        ].join(' ')).includes(value));

    const list = filtered.slice(0, 120).map((item, index) => {
      const tags = item.tags.slice(0, 3).map((tag) => `<span class="tag">${tag}</span>`).join('');
      return `
        <a class="movie-card" data-filter-card href="${item.href}">
          <div class="poster">
            <img loading="lazy" src="${item.poster}" alt="${item.title}">
            <div class="poster-badge">${item.year}</div>
            <div class="poster-number">${String(index + 1).padStart(2, '0')}</div>
          </div>
          <div class="card-body">
            <h3 class="movie-title">${item.title}</h3>
            <div class="movie-meta">
              <span>${item.region}</span>
              <span>${item.type}</span>
              <span>${item.genre}</span>
            </div>
            <p class="movie-desc">${item.summary || item.one_line || ''}</p>
            <div class="movie-tags">${tags}</div>
          </div>
        </a>`;
    }).join('');

    results.innerHTML = list || '<p class="muted">没有找到匹配结果。</p>';
  };

  const update = createDebounce(() => {
    const params = new URLSearchParams(window.location.search);
    const value = input.value.trim();
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    history.replaceState(null, '', next);
    render(value);
  }, 90);

  input.addEventListener('input', update);
  render(pageQuery);
}

function setupPlayer() {
  const shell = document.querySelector('[data-player-shell]');
  const video = document.querySelector('[data-hls-player]');
  if (!shell || !video) return;

  const primary = video.getAttribute('data-hls-source') || '';
  const fallback = video.getAttribute('data-hls-fallback') || '';
  const overlay = shell.querySelector('[data-player-overlay]');
  const button = shell.querySelector('[data-player-button]');

  const hideOverlay = () => {
    shell.classList.remove('ready');
  };

  const showOverlay = () => {
    shell.classList.add('ready');
  };

  const activate = async () => {
    try {
      await video.play();
      hideOverlay();
    } catch (error) {
      showOverlay();
    }
  };

  if (button) {
    button.addEventListener('click', activate);
  }

  video.addEventListener('play', hideOverlay);
  video.addEventListener('pause', showOverlay);
  video.addEventListener('ended', showOverlay);
  video.addEventListener('error', () => {
    if (fallback && video.dataset.triedFallback !== '1') {
      video.dataset.triedFallback = '1';
      attachSource(fallback);
    } else {
      showOverlay();
    }
  });

  const attachSource = (src) => {
    if (!src) return;
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false
      });
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data || !data.fatal) return;
        if (fallback && video.dataset.triedFallback !== '1') {
          video.dataset.triedFallback = '1';
          hls.destroy();
          attachSource(fallback);
          return;
        }
        showOverlay();
      });

      video.dataset.hlsAttached = '1';
      video.dataset.hlsInstance = '1';
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }

    if (fallback && src !== fallback) {
      attachSource(fallback);
    }
  };

  showOverlay();
  attachSource(primary);

  if (overlay) {
    overlay.addEventListener('click', activate);
  }
}

function setupCopyButtons() {
  document.querySelectorAll('[data-copy-text]').forEach((button) => {
    button.addEventListener('click', async () => {
      const text = button.getAttribute('data-copy-text') || '';
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = '已复制';
        window.setTimeout(() => {
          button.textContent = '复制链接';
        }, 1200);
      } catch (error) {
        button.textContent = '复制失败';
        window.setTimeout(() => {
          button.textContent = '复制链接';
        }, 1200);
      }
    });
  });
}

onReady(() => {
  setupMobileMenu();
  setupBackToTop();
  setupLocalFilters();
  setupPlayer();
  setupCopyButtons();
  setupGlobalSearch();
});
