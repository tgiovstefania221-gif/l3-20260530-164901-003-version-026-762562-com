(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('is-open');
      menuButton.textContent = mobilePanel.classList.contains('is-open') ? '×' : '☰';
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var index = 0;

    function showSlide(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, position) {
        slide.classList.toggle('is-active', position === index);
      });
      dots.forEach(function (dot, position) {
        dot.classList.toggle('is-active', position === index);
      });
    }

    dots.forEach(function (dot, position) {
      dot.addEventListener('click', function () {
        showSlide(position);
      });
    });

    if (slides.length > 1) {
      setInterval(function () {
        showSlide(index + 1);
      }, 5600);
    }
  }

  var filterPanel = document.querySelector('[data-filter-panel]');

  if (filterPanel) {
    var input = filterPanel.querySelector('[data-filter-input]');
    var clear = filterPanel.querySelector('[data-filter-clear]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
    var activeType = '';
    var activeYear = '';

    function normalize(value) {
      return String(value || '').toLowerCase().replace(/\s+/g, '');
    }

    function applyFilter() {
      var keyword = normalize(input ? input.value : '');
      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-year'),
          card.getAttribute('data-genre')
        ].join(' '));
        var typeOk = !activeType || card.getAttribute('data-type') === activeType;
        var yearOk = !activeYear || card.getAttribute('data-year') === activeYear;
        var keywordOk = !keyword || haystack.indexOf(keyword) !== -1;
        card.classList.toggle('is-hidden', !(typeOk && yearOk && keywordOk));
      });
    }

    filterPanel.querySelectorAll('[data-filter-type]').forEach(function (button) {
      button.addEventListener('click', function () {
        activeType = button.getAttribute('data-filter-type') || '';
        filterPanel.querySelectorAll('[data-filter-type]').forEach(function (item) {
          item.classList.toggle('is-active', item === button);
        });
        applyFilter();
      });
    });

    filterPanel.querySelectorAll('[data-filter-year]').forEach(function (button) {
      button.addEventListener('click', function () {
        activeYear = button.getAttribute('data-filter-year') || '';
        filterPanel.querySelectorAll('[data-filter-year]').forEach(function (item) {
          item.classList.toggle('is-active', item === button);
        });
        applyFilter();
      });
    });

    if (input) {
      input.addEventListener('input', applyFilter);
    }

    if (clear) {
      clear.addEventListener('click', function () {
        if (input) {
          input.value = '';
        }
        activeType = '';
        activeYear = '';
        filterPanel.querySelectorAll('[data-filter-type], [data-filter-year]').forEach(function (button) {
          button.classList.toggle('is-active', !button.getAttribute('data-filter-type') && !button.getAttribute('data-filter-year'));
        });
        applyFilter();
      });
    }
  }

  var resultMount = document.querySelector('[data-search-results]');

  if (resultMount && typeof movieSearchItems !== 'undefined') {
    var params = new URLSearchParams(location.search);
    var query = params.get('q') || '';
    var searchInput = document.querySelector('[data-search-query]');
    var searchTitle = document.querySelector('[data-search-title]');

    if (searchInput) {
      searchInput.value = query;
    }

    function escapeHtml(value) {
      return String(value || '').replace(/[&<>"']/g, function (character) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[character];
      });
    }

    function normalizeSearch(value) {
      return String(value || '').toLowerCase().replace(/\s+/g, '');
    }

    function makeCard(movie) {
      var tags = (movie.tags || []).slice(0, 4).map(function (tag) {
        return '<span class="pill">' + escapeHtml(tag) + '</span>';
      }).join('');

      return '<article class="movie-card">' +
        '<a class="poster-wrap" href="' + escapeHtml(movie.url) + '">' +
        '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
        '<span class="poster-gradient"></span>' +
        '<span class="poster-badge">' + escapeHtml(movie.year) + '</span>' +
        '</a>' +
        '<div class="movie-card-body">' +
        '<div class="card-meta">' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.type) + '</div>' +
        '<h3><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>' +
        '<p>' + escapeHtml(movie.oneLine) + '</p>' +
        '<div class="tag-row">' + tags + '</div>' +
        '</div>' +
        '</article>';
    }

    var normalizedQuery = normalizeSearch(query);
    var list = movieSearchItems.filter(function (movie) {
      if (!normalizedQuery) {
        return true;
      }
      var haystack = normalizeSearch([
        movie.title,
        movie.region,
        movie.type,
        movie.year,
        movie.genre,
        movie.oneLine,
        (movie.tags || []).join(' ')
      ].join(' '));
      return haystack.indexOf(normalizedQuery) !== -1;
    }).slice(0, normalizedQuery ? 120 : 48);

    if (searchTitle) {
      searchTitle.textContent = normalizedQuery ? '相关内容' : '推荐内容';
    }

    resultMount.innerHTML = list.map(makeCard).join('');
  }
})();
