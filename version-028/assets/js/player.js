(function () {
  function initializeMoviePlayer(streamUrl) {
    var video = document.getElementById('movie-player');
    var playButton = document.querySelector('[data-play-button]');
    var hlsInstance = null;

    if (!video || !streamUrl) {
      return;
    }

    function hideButton() {
      if (playButton) {
        playButton.classList.add('hidden');
      }
    }

    function attachSource() {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.ERROR, function (_, data) {
          if (!data || !data.fatal) {
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
        return;
      }

      video.src = streamUrl;
    }

    attachSource();

    video.addEventListener('play', hideButton);
    video.addEventListener('playing', hideButton);

    if (playButton) {
      playButton.addEventListener('click', function () {
        hideButton();
        var playPromise = video.play();

        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            playButton.classList.remove('hidden');
          });
        }
      });
    }

    window.addEventListener('pagehide', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  window.initializeMoviePlayer = initializeMoviePlayer;
})();
