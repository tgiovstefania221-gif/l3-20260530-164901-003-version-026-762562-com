(function () {
  var form = document.querySelector("[data-search-form]");
  var input = document.querySelector("[data-search-input]");
  var results = document.querySelector("[data-search-results]");
  var summary = document.querySelector("[data-search-summary]");
  var params = new URLSearchParams(window.location.search);
  var initial = params.get("q") || "";

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      if (char === "&") {
        return "&amp;";
      }
      if (char === "<") {
        return "&lt;";
      }
      if (char === ">") {
        return "&gt;";
      }
      if (char === '"') {
        return "&quot;";
      }
      if (char === "'") {
        return "&#39;";
      }
      return char;
    });
  }


  function card(movie) {
    return [
      '<article class="movie-card">',
      '<a href="' + escapeHtml(movie.url) + '" class="movie-cover">',
      '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '<span class="play-badge">▶</span>',
      '</a>',
      '<div class="movie-info">',
      '<h3><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>',
      '<p class="movie-line">' + escapeHtml(movie.line) + '</p>',
      '<div class="movie-meta">',
      '<span>' + escapeHtml(movie.year) + '</span>',
      '<span>' + escapeHtml(movie.region) + '</span>',
      '<span>' + escapeHtml(movie.type) + '</span>',
      '</div>',
      '</div>',
      '</article>'
    ].join("");
  }

  function run(query) {
    var q = query.trim().toLowerCase();
    var data = Array.isArray(window.SEARCH_MOVIES) ? window.SEARCH_MOVIES : [];
    var matched = q ? data.filter(function (movie) {
      return [movie.title, movie.year, movie.region, movie.genre, movie.type, movie.line].join(" ").toLowerCase().indexOf(q) !== -1;
    }) : data.slice(0, 24);
    var shown = matched.slice(0, 80);
    if (summary) {
      summary.textContent = q ? "已显示匹配内容" : "为你展示精选内容";
    }
    if (results) {
      results.innerHTML = shown.map(card).join("");
    }
  }

  if (input) {
    input.value = initial;
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var q = input ? input.value : "";
      var url = new URL(window.location.href);
      if (q.trim()) {
        url.searchParams.set("q", q.trim());
      } else {
        url.searchParams.delete("q");
      }
      window.history.replaceState({}, "", url.toString());
      run(q);
    });
  }

  if (input) {
    input.addEventListener("input", function () {
      run(input.value);
    });
  }

  run(initial);
})();
