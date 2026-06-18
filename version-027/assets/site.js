(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
      return;
    }
    document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var mobileNav = document.querySelector('[data-mobile-nav]');
    if (menuButton && mobileNav) {
      menuButton.addEventListener('click', function () {
        mobileNav.classList.toggle('is-open');
      });
    }

    var backTop = document.querySelector('[data-back-top]');
    if (backTop) {
      window.addEventListener('scroll', function () {
        backTop.classList.toggle('is-visible', window.scrollY > 480);
      });
      backTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    var hero = document.querySelector('[data-hero]');
    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
      var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
      var current = 0;
      var show = function (index) {
        if (!slides.length) {
          return;
        }
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle('is-active', i === current);
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === current);
        });
      };
      dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
          show(Number(dot.getAttribute('data-hero-dot')) || 0);
        });
      });
      window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    var searchInput = document.querySelector('[data-search-input]');
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-movie-card]'));
    var currentFilter = 'all';
    var applyCards = function () {
      var keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
      cards.forEach(function (card) {
        var index = card.getAttribute('data-index') || '';
        var category = card.getAttribute('data-category') || '';
        var filterOk = currentFilter === 'all' || category === currentFilter || index.indexOf(currentFilter) !== -1;
        var searchOk = !keyword || index.indexOf(keyword) !== -1;
        card.classList.toggle('is-hidden-card', !(filterOk && searchOk));
      });
    };
    if (searchInput) {
      var params = new URLSearchParams(window.location.search);
      var q = params.get('q');
      if (q) {
        searchInput.value = q;
      }
      searchInput.addEventListener('input', applyCards);
      applyCards();
    }
    filterButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        currentFilter = button.getAttribute('data-filter') || 'all';
        filterButtons.forEach(function (item) {
          item.classList.toggle('is-active', item === button);
        });
        applyCards();
      });
    });

    Array.prototype.slice.call(document.querySelectorAll('.js-player')).forEach(function (player) {
      var source = player.getAttribute('data-play');
      var video = player.querySelector('video');
      var button = player.querySelector('.play-trigger');
      var hlsInstance = null;
      var started = false;
      var start = function () {
        if (!video || !source) {
          return;
        }
        if (!started) {
          if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
            hlsInstance.loadSource(source);
            hlsInstance.attachMedia(video);
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
              video.play().catch(function () {});
            });
            hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
              if (!data || !data.fatal || !hlsInstance) {
                return;
              }
              if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                hlsInstance.startLoad();
              } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                hlsInstance.recoverMediaError();
              } else {
                hlsInstance.destroy();
              }
            });
          } else {
            video.src = source;
            video.addEventListener('loadedmetadata', function () {
              video.play().catch(function () {});
            }, { once: true });
          }
          started = true;
        }
        if (button) {
          button.classList.add('is-hidden');
        }
        video.play().catch(function () {});
      };
      if (button) {
        button.addEventListener('click', start);
      }
      if (video) {
        video.addEventListener('click', function () {
          if (video.paused) {
            start();
          }
        });
      }
      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  });
})();
