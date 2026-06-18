document.addEventListener("DOMContentLoaded", function () {
  setupMobileMenu();
  setupHeroSlider();
  setupSearchForms();
  setupFilterPanels();
});

function setupMobileMenu() {
  var button = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-mobile-menu]");

  if (!button || !menu) {
    return;
  }

  button.addEventListener("click", function () {
    menu.classList.toggle("is-open");
  });
}

function setupHeroSlider() {
  var slider = document.querySelector("[data-hero-slider]");

  if (!slider) {
    return;
  }

  var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
  var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
  var current = 0;
  var timer = null;

  function activate(index) {
    current = (index + slides.length) % slides.length;

    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle("is-active", slideIndex === current);
    });

    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle("is-active", dotIndex === current);
    });
  }

  function start() {
    stop();
    timer = window.setInterval(function () {
      activate(current + 1);
    }, 5200);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener("click", function () {
      activate(index);
      start();
    });
  });

  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);

  activate(0);
  start();
}

function setupSearchForms() {
  var forms = Array.prototype.slice.call(document.querySelectorAll("[data-site-search-form]"));

  forms.forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var input = form.querySelector("input[type='search']");
      var query = input ? input.value.trim() : "";
      var target = form.getAttribute("data-search-target") || "search.html";
      var glue = target.indexOf("?") === -1 ? "?" : "&";

      if (query) {
        window.location.href = target + glue + "q=" + encodeURIComponent(query);
      } else {
        window.location.href = target;
      }
    });
  });
}

function setupFilterPanels() {
  var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));

  panels.forEach(function (panel) {
    var targetSelector = panel.getAttribute("data-target");
    var grid = targetSelector ? document.querySelector(targetSelector) : null;

    if (!grid) {
      return;
    }

    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-movie-card]"));
    var searchInput = panel.querySelector("[data-card-search]");
    var typeSelect = panel.querySelector("[data-type-filter]");
    var sortSelect = panel.querySelector("[data-sort-select]");
    var emptyState = document.querySelector("[data-empty-state]");
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q");

    if (query && searchInput) {
      searchInput.value = query;
    }

    function normalize(value) {
      return String(value || "").toLowerCase().replace(/\s+/g, "");
    }

    function applyFilter() {
      var searchValue = normalize(searchInput ? searchInput.value : "");
      var typeValue = typeSelect ? typeSelect.value : "";
      var visibleCount = 0;

      cards.forEach(function (card) {
        var cardText = normalize(card.getAttribute("data-search"));
        var cardType = card.getAttribute("data-type") || "";
        var matchSearch = !searchValue || cardText.indexOf(searchValue) !== -1;
        var matchType = !typeValue || cardType === typeValue;
        var shouldShow = matchSearch && matchType;

        card.hidden = !shouldShow;

        if (shouldShow) {
          visibleCount += 1;
        }
      });

      if (emptyState) {
        emptyState.classList.toggle("is-visible", visibleCount === 0);
      }
    }

    function applySort() {
      var value = sortSelect ? sortSelect.value : "year-desc";

      cards.sort(function (a, b) {
        var yearA = Number(a.getAttribute("data-year")) || 0;
        var yearB = Number(b.getAttribute("data-year")) || 0;
        var hotA = Number(a.getAttribute("data-hot")) || 0;
        var hotB = Number(b.getAttribute("data-hot")) || 0;

        if (value === "year-asc") {
          return yearA - yearB;
        }

        if (value === "hot-desc") {
          return hotB - hotA;
        }

        return yearB - yearA;
      });

      cards.forEach(function (card) {
        grid.appendChild(card);
      });
    }

    function update() {
      applySort();
      applyFilter();
    }

    if (searchInput) {
      searchInput.addEventListener("input", update);
    }

    if (typeSelect) {
      typeSelect.addEventListener("change", update);
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", update);
    }

    update();
  });
}
