(function () {
  var blocks = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));

  blocks.forEach(function (block) {
    var video = block.querySelector("video");
    var button = block.querySelector("[data-play-button]");
    var message = block.querySelector("[data-player-message]");
    var stream = block.getAttribute("data-stream");
    var ready = false;
    var hls = null;

    function setMessage(text) {
      if (message) {
        message.textContent = text || "";
      }
    }

    function attach() {
      if (!video || !stream || ready) {
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
        ready = true;
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(stream);
        hls.attachMedia(video);
        ready = true;
        return;
      }
      video.src = stream;
      ready = true;
    }

    function start() {
      attach();
      if (button) {
        button.classList.add("is-hidden");
      }
      if (video) {
        var playTask = video.play();
        if (playTask && typeof playTask.catch === "function") {
          playTask.catch(function () {
            setMessage("请再次点击播放");
            if (button) {
              button.classList.remove("is-hidden");
            }
          });
        }
      }
    }

    if (button) {
      button.addEventListener("click", start);
    }

    if (video) {
      video.addEventListener("click", function () {
        if (video.paused) {
          start();
        }
      });
      video.addEventListener("play", function () {
        if (button) {
          button.classList.add("is-hidden");
        }
        setMessage("");
      });
      video.addEventListener("error", function () {
        setMessage("播放暂时无法加载，请稍后再试");
      });
    }

    window.addEventListener("beforeunload", function () {
      if (hls && typeof hls.destroy === "function") {
        hls.destroy();
      }
    });
  });
})();
