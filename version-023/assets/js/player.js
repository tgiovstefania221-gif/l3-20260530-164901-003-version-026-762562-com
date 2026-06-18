(function () {
  var players = Array.prototype.slice.call(document.querySelectorAll('.video-player'));

  players.forEach(function (video) {
    var shell = video.closest('.player-shell');
    var overlay = shell ? shell.querySelector('.player-overlay') : null;
    var stream = video.getAttribute('data-stream');
    var hlsInstance = null;
    var attached = false;

    function attachSource(done) {
      if (attached) {
        done();
        return;
      }

      attached = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
        done();
        return;
      }

      if (globalThis.Hls && globalThis.Hls.isSupported()) {
        hlsInstance = new globalThis.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
        hlsInstance.on(globalThis.Hls.Events.MANIFEST_PARSED, function () {
          done();
        });
        return;
      }

      video.src = stream;
      done();
    }

    function startPlayback() {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      attachSource(function () {
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {});
        }
      });
    }

    if (overlay) {
      overlay.addEventListener('click', startPlayback);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        startPlayback();
      }
    });

    video.addEventListener('play', function () {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
    });

    video.addEventListener('emptied', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
        attached = false;
      }
    });
  });
})();
