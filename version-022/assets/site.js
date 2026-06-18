
(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  const siteRoot = location.pathname.includes('/movie/') ? '../' : '';

  function posterClass(movie) {
    return `poster-${movie.poster % 12}`;
  }

  function cardHtml(movie, compact = false) {
    const title = escapeHtml(movie.title);
    const meta = [movie.year, movie.region, movie.genre].filter(Boolean).join(" · ");
    const excerpt = escapeHtml(movie.oneLine || movie.summaryShort || "");
    const shortTag = escapeHtml((movie.tags || []).slice(0, 3).join(" / "));
    const sizeClass = compact ? "h-40" : "h-52";
    return `
      <a href="${siteRoot}${movie.path}" class="movie-card group block h-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/20 hover:border-cyan-400/40">
        <div class="poster ${posterClass(movie)} ${sizeClass} flex flex-col justify-between p-4">
          <div class="flex items-center justify-between text-xs text-white/90">
            <span class="rounded-full bg-black/20 px-2 py-1 backdrop-blur-sm">${escapeHtml(movie.category)}</span>
            <span class="rounded-full bg-black/20 px-2 py-1 backdrop-blur-sm">${escapeHtml(movie.year)}</span>
          </div>
          <div>
            <div class="text-5xl font-black leading-none text-white/95 drop-shadow">${escapeHtml(movie.title.slice(0, 2))}</div>
            <div class="mt-3 text-sm text-white/90">${escapeHtml(movie.region)} · ${escapeHtml(movie.genre)}</div>
          </div>
        </div>
        <div class="space-y-3 p-4">
          <div class="flex items-start justify-between gap-3">
            <h3 class="clamp-2 text-lg font-semibold text-white group-hover:text-cyan-300">${title}</h3>
          </div>
          <p class="clamp-2 text-sm leading-6 text-slate-300">${excerpt}</p>
          <div class="flex flex-wrap gap-2 text-xs text-slate-400">
            <span class="rounded-full bg-white/5 px-2 py-1">${escapeHtml(movie.category)}</span>
            <span class="rounded-full bg-white/5 px-2 py-1">${escapeHtml(movie.year)}</span>
            <span class="rounded-full bg-white/5 px-2 py-1">${shortTag}</span>
          </div>
          <div class="flex items-center justify-between pt-1 text-sm text-cyan-300">
            <span>查看详情</span>
            <span class="transition-transform group-hover:translate-x-1">→</span>
          </div>
        </div>
      </a>
    `;
  }

  function setActiveNav() {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    $$("[data-nav-link]").forEach((el) => {
      const href = el.getAttribute("href") || "";
      const normalized = href.replace(/\/+$/, "") || "/";
      const active = path === normalized || (normalized !== "/" && path.startsWith(normalized));
      el.classList.toggle("text-cyan-300", active);
      el.classList.toggle("text-white", active);
    });
  }

  function initSearchForms() {
    $$("[data-search-form]").forEach((form) => {
      const input = $('[data-search-input]', form);
      if (!input) return;
      const pageQuery = new URLSearchParams(location.search).get("q");
      if (pageQuery && !input.value) input.value = pageQuery;

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = input.value.trim();
        const url = q ? `${siteRoot}search.html?q=${encodeURIComponent(q)}` : `${siteRoot}search.html`;
        location.href = url;
      });
    });
  }

  function initFilterPanels() {
    $$("[data-filter-panel]").forEach((panel) => {
      const input = $('[data-filter-input]', panel);
      const cards = $$("[data-card-item]", panel);
      const count = $('[data-filter-count]', panel);
      if (!input || !cards.length) return;

      function applyFilter() {
        const q = input.value.trim().toLowerCase();
        let visible = 0;
        cards.forEach((card) => {
          const text = (card.getAttribute("data-filter-text") || card.textContent || "").toLowerCase();
          const show = !q || text.includes(q);
          card.style.display = show ? "" : "none";
          if (show) visible += 1;
        });
        if (count) count.textContent = String(visible);
      }

      input.addEventListener("input", applyFilter);
      applyFilter();
    });
  }

  function initPlayer() {
    const video = $("[data-hls-src]");
    if (!video) return;

    const hlsUrl = video.dataset.hlsSrc;
    const mp4Url = video.dataset.mp4Src;
    const playButton = $("[data-player-play]");
    const spinner = $("[data-player-spinner]");
    const titleEl = $("[data-player-title]");

    function hideSpinner() {
      if (spinner) spinner.classList.add("hidden");
    }

    function showSpinner() {
      if (spinner) spinner.classList.remove("hidden");
    }

    showSpinner();

    video.addEventListener("canplay", hideSpinner);
    video.addEventListener("playing", hideSpinner);
    video.addEventListener("loadeddata", hideSpinner);
    video.addEventListener("error", () => {
      if (mp4Url && video.src !== mp4Url) {
        video.src = mp4Url;
        video.load();
        video.play().catch(() => {});
      }
      hideSpinner();
    });

    const hasNativeHls = video.canPlayType && video.canPlayType("application/vnd.apple.mpegurl");
    if (window.Hls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, function (_, data) {
        if (data && data.fatal && mp4Url) {
          video.src = mp4Url;
          video.load();
          video.play().catch(() => {});
          hideSpinner();
        }
      });
    } else if (hasNativeHls) {
      video.src = hlsUrl;
      video.load();
    } else if (mp4Url) {
      video.src = mp4Url;
      video.load();
    } else {
      video.src = hlsUrl;
      video.load();
    }

    const startPlayback = () => {
      showSpinner();
      video.play().catch(() => {});
    };

    if (playButton) {
      playButton.addEventListener("click", startPlayback);
    }

    video.addEventListener("click", () => {
      if (video.paused) {
        startPlayback();
      } else {
        video.pause();
      }
    });

    if (titleEl) {
      titleEl.textContent = titleEl.textContent.trim();
    }
  }

  function renderSearchResults() {
    const root = $("[data-search-results]");
    if (!root || !window.MOVIES) return;

    const params = new URLSearchParams(location.search);
    const qInput = $('[data-search-query]');
    const sortSelect = $('[data-search-sort]');
    const categorySelect = $('[data-search-category]');
    const regionSelect = $('[data-search-region]');
    const yearSelect = $('[data-search-year]');
    const summary = $('[data-search-summary]');
    const pager = $('[data-search-pager]');
    const pageSize = 24;

    const state = {
      q: params.get("q") || "",
      category: params.get("category") || "",
      region: params.get("region") || "",
      year: params.get("year") || "",
      sort: params.get("sort") || "relevance",
      page: Math.max(parseInt(params.get("page") || "1", 10), 1),
    };

    if (qInput) qInput.value = state.q;
    if (sortSelect) sortSelect.value = state.sort;
    if (categorySelect) categorySelect.value = state.category;
    if (regionSelect) regionSelect.value = state.region;
    if (yearSelect) yearSelect.value = state.year;

    function matches(movie) {
      const q = state.q.trim().toLowerCase();
      const hay = [
        movie.title, movie.region, movie.genre, movie.type, movie.oneLine,
        movie.summaryShort, movie.category, ...(movie.tags || [])
      ].join(" ").toLowerCase();

      if (q && !hay.includes(q)) return false;
      if (state.category && movie.categorySlug !== state.category) return false;
      if (state.region && movie.region !== state.region) return false;
      if (state.year && String(movie.year) !== state.year) return false;
      return true;
    }

    function score(movie) {
      const q = state.q.trim().toLowerCase();
      let s = 0;
      if (!q) s += 5;
      const title = movie.title.toLowerCase();
      const one = (movie.oneLine || "").toLowerCase();
      const sum = (movie.summaryShort || "").toLowerCase();
      if (q && title.includes(q)) s += 100;
      if (q && one.includes(q)) s += 70;
      if (q && sum.includes(q)) s += 35;
      s += Number(movie.year) || 0;
      s += (movie.score % 1000) / 1000;
      return s;
    }

    function sortList(list) {
      const copy = list.slice();
      const sort = state.sort;
      if (sort === "year-desc") {
        copy.sort((a, b) => (b.year - a.year) || (b.score - a.score));
      } else if (sort === "year-asc") {
        copy.sort((a, b) => (a.year - b.year) || (b.score - a.score));
      } else if (sort === "title") {
        copy.sort((a, b) => a.title.localeCompare(b.title, "zh-Hans-CN"));
      } else {
        copy.sort((a, b) => score(b) - score(a));
      }
      return copy;
    }

    function renderPage() {
      const filtered = sortList(window.MOVIES.filter(matches));
      const total = filtered.length;
      const totalPages = Math.max(Math.ceil(total / pageSize), 1);
      state.page = Math.min(state.page, totalPages);
      const start = (state.page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);

      if (summary) {
        summary.textContent = total
          ? `共找到 ${total} 部影片，当前第 ${state.page} / ${totalPages} 页。`
          : "没有找到匹配的影片。";
      }

      root.innerHTML = items.length
        ? items.map((movie) => cardHtml(movie)).join("")
        : `
          <div class="col-span-full rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
            没有找到相关影片
          </div>
        `;

      if (pager) {
        const prev = Math.max(state.page - 1, 1);
        const next = Math.min(state.page + 1, totalPages);
        const windowPages = [];
        const maxShown = 7;
        let startPage = Math.max(1, state.page - Math.floor(maxShown / 2));
        let endPage = Math.min(totalPages, startPage + maxShown - 1);
        startPage = Math.max(1, endPage - maxShown + 1);
        for (let p = startPage; p <= endPage; p += 1) windowPages.push(p);

        pager.innerHTML = `
          <a class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300" href="${makeUrl({ page: prev })}">上一页</a>
          ${startPage > 1 ? '<span class="px-2 text-slate-500">…</span>' : ""}
          ${windowPages.map((p) => `
            <a class="rounded-full px-4 py-2 text-sm transition ${p === state.page ? "bg-cyan-400 text-slate-950" : "border border-white/10 bg-white/5 text-slate-200 hover:border-cyan-400/40 hover:text-cyan-300"}" href="${makeUrl({ page: p })}">${p}</a>
          `).join("")}
          ${endPage < totalPages ? '<span class="px-2 text-slate-500">…</span>' : ""}
          <a class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300" href="${makeUrl({ page: next })}">下一页</a>
        `;
      }
    }

    function makeUrl(overrides = {}) {
      const params = new URLSearchParams(location.search);
      const current = {
        q: state.q,
        category: state.category,
        region: state.region,
        year: state.year,
        sort: state.sort,
        page: state.page,
      };
      Object.assign(current, overrides);
      params.set("q", current.q || "");
      params.set("category", current.category || "");
      params.set("region", current.region || "");
      params.set("year", current.year || "");
      params.set("sort", current.sort || "relevance");
      params.set("page", String(current.page || 1));
      for (const key of Array.from(params.keys())) {
        if (!params.get(key)) params.delete(key);
      }
      const query = params.toString();
      return query ? `${siteRoot}search.html?${query}` : `${siteRoot}search.html`;
    }

    function updateFromInputs() {
      state.q = qInput ? qInput.value.trim() : state.q;
      state.sort = sortSelect ? sortSelect.value : state.sort;
      state.category = categorySelect ? categorySelect.value : state.category;
      state.region = regionSelect ? regionSelect.value : state.region;
      state.year = yearSelect ? yearSelect.value : state.year;
      state.page = 1;
      location.href = makeUrl();
    }

    [qInput, sortSelect, categorySelect, regionSelect, yearSelect].forEach((el) => {
      if (!el) return;
      el.addEventListener("change", updateFromInputs);
      if (el === qInput) {
        el.form && el.form.addEventListener("submit", (e) => {
          e.preventDefault();
          updateFromInputs();
        });
      }
    });

    renderPage();
  }

  function initCategorySortLinks() {
    $$("[data-sort-link]").forEach((el) => {
      el.addEventListener("click", (e) => {
        const sort = el.dataset.sortLink;
        const url = new URL(location.href);
        url.searchParams.set("sort", sort);
        location.href = url.toString();
        e.preventDefault();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setActiveNav();
    initSearchForms();
    initFilterPanels();
    initPlayer();
    renderSearchResults();
    initCategorySortLinks();
  });
})();
