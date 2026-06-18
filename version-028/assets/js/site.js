(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
  var currentSlide = 0;
  var heroTimer = null;

  function setHeroSlide(index) {
    if (!slides.length) {
      return;
    }

    currentSlide = (index + slides.length) % slides.length;

    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('active', slideIndex === currentSlide);
    });

    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('active', dotIndex === currentSlide);
    });
  }

  function startHeroTimer() {
    if (heroTimer) {
      window.clearInterval(heroTimer);
    }

    if (slides.length > 1) {
      heroTimer = window.setInterval(function () {
        setHeroSlide(currentSlide + 1);
      }, 5200);
    }
  }

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      var index = Number(dot.getAttribute('data-hero-dot')) || 0;
      setHeroSlide(index);
      startHeroTimer();
    });
  });

  startHeroTimer();

  Array.prototype.slice.call(document.querySelectorAll('[data-search-form]')).forEach(function (form) {
    form.addEventListener('submit', function (event) {
      var input = form.querySelector('input[name="q"]');
      if (!input || !input.value.trim()) {
        event.preventDefault();
        window.location.href = 'search.html';
      }
    });
  });

  var liveSearchInput = document.querySelector('[data-search-input]');
  var searchGrid = document.querySelector('[data-search-grid]');
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var selectedFilter = '全部';

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function cardText(card) {
    return normalize([
      card.getAttribute('data-title'),
      card.getAttribute('data-type'),
      card.getAttribute('data-region'),
      card.getAttribute('data-genre'),
      card.getAttribute('data-tags'),
      card.textContent
    ].join(' '));
  }

  function runFilter() {
    if (!searchGrid) {
      return;
    }

    var query = liveSearchInput ? normalize(liveSearchInput.value) : '';
    var filter = normalize(selectedFilter);
    var cards = Array.prototype.slice.call(searchGrid.querySelectorAll('.movie-card'));

    cards.forEach(function (card) {
      var text = cardText(card);
      var matchesQuery = !query || text.indexOf(query) !== -1;
      var matchesFilter = filter === '全部' || !filter || text.indexOf(filter) !== -1;
      card.classList.toggle('is-hidden', !(matchesQuery && matchesFilter));
    });
  }

  if (liveSearchInput) {
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q');

    if (initialQuery) {
      liveSearchInput.value = initialQuery;
    }

    liveSearchInput.addEventListener('input', runFilter);
    runFilter();
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      selectedFilter = button.getAttribute('data-filter') || '全部';
      filterButtons.forEach(function (item) {
        item.classList.toggle('active', item === button);
      });
      runFilter();
    });
  });

  if (filterButtons.length) {
    filterButtons[0].classList.add('active');
  }
})();
