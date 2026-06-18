(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function initNavigation() {
    var toggle = $('[data-role="nav-toggle"]');
    var menu = $('[data-role="mobile-menu"]');
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
    });
  }

  function initHero() {
    var carousel = $('[data-role="hero-carousel"]');
    if (!carousel) {
      return;
    }
    var slides = $all('.hero-slide', carousel);
    var dots = $all('[data-hero-index]');
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        window.clearInterval(timer);
        show(Number(dot.getAttribute('data-hero-index')) || 0);
        start();
      });
    });

    start();
  }

  function initFilters() {
    var search = $('[data-role="site-search"]');
    var year = $('[data-role="year-filter"]');
    var type = $('[data-role="type-filter"]');
    var items = $all('.filter-item');
    if (!items.length || (!search && !year && !type)) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get('q');
    if (query && search) {
      search.value = query;
    }

    function filter() {
      var q = search ? search.value.trim().toLowerCase() : '';
      var y = year ? year.value : '';
      var t = type ? type.value : '';
      items.forEach(function (item) {
        var text = [
          item.getAttribute('data-title'),
          item.getAttribute('data-genre'),
          item.getAttribute('data-region'),
          item.getAttribute('data-year'),
          item.getAttribute('data-type')
        ].join(' ').toLowerCase();
        var matchQuery = !q || text.indexOf(q) !== -1;
        var matchYear = !y || item.getAttribute('data-year') === y;
        var matchType = !t || item.getAttribute('data-type') === t;
        item.classList.toggle('hidden', !(matchQuery && matchYear && matchType));
      });
    }

    [search, year, type].forEach(function (control) {
      if (control) {
        control.addEventListener('input', filter);
        control.addEventListener('change', filter);
      }
    });
    filter();
  }

  window.setupPlayer = function (url) {
    var video = document.getElementById('movie-player');
    var button = $('[data-role="play-button"]');
    if (!video || !button || !url) {
      return;
    }
    var hlsInstance = null;
    var loaded = false;

    function load() {
      if (loaded) {
        return Promise.resolve();
      }
      loaded = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(video);
      } else {
        video.src = url;
      }
      return Promise.resolve();
    }

    function play() {
      button.classList.add('hidden');
      load().then(function () {
        var attempt = video.play();
        if (attempt && typeof attempt.catch === 'function') {
          attempt.catch(function () {
            button.classList.remove('hidden');
          });
        }
      });
    }

    button.addEventListener('click', play);
    video.addEventListener('click', function () {
      if (video.paused) {
        play();
      }
    });
    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initHero();
    initFilters();
  });
})();
