(function () {
    var depth = Number(window.SITE_DEPTH || 0);
    var prefix = depth === 0 ? "./" : "../".repeat(depth);

    function escapeHTML(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function prefixed(path) {
        return prefix + String(path || "").replace(/^\.\//, "").replace(/^\//, "");
    }

    function setupMenu() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var nav = document.querySelector("[data-mobile-nav]");
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener("click", function () {
            nav.classList.toggle("is-open");
        });
    }

    function setupBackTop() {
        var button = document.querySelector("[data-back-top]");
        if (!button) {
            return;
        }
        window.addEventListener("scroll", function () {
            button.classList.toggle("is-visible", window.scrollY > 600);
        });
        button.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    function setupHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === index);
            });
        }

        function start() {
            if (slides.length < 2) {
                return;
            }
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5000);
        }

        function restart(nextIndex) {
            if (timer) {
                window.clearInterval(timer);
            }
            show(nextIndex);
            start();
        }

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener("click", function () {
                restart(dotIndex);
            });
        });
        if (prev) {
            prev.addEventListener("click", function () {
                restart(index - 1);
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                restart(index + 1);
            });
        }
        show(0);
        start();
    }

    function matchMovie(movie, query) {
        var text = [movie.title, movie.year, movie.region, movie.type, movie.genre, movie.tags, movie.oneLine].join(" ").toLowerCase();
        return text.indexOf(query) !== -1;
    }

    function setupSearch() {
        var data = window.MOVIE_SEARCH_INDEX || [];
        var forms = Array.prototype.slice.call(document.querySelectorAll(".site-search"));
        forms.forEach(function (form) {
            var input = form.querySelector("input[type='search']");
            var panel = form.querySelector("[data-search-panel]");
            if (!input || !panel) {
                return;
            }

            function render() {
                var query = input.value.trim().toLowerCase();
                if (!query) {
                    panel.classList.remove("is-open");
                    panel.innerHTML = "";
                    return;
                }
                var results = data.filter(function (movie) {
                    return matchMovie(movie, query);
                }).slice(0, 10);
                if (!results.length) {
                    panel.innerHTML = '<p class="search-empty">暂无匹配作品</p>';
                    panel.classList.add("is-open");
                    return;
                }
                panel.innerHTML = results.map(function (movie) {
                    return '<a class="search-result" href="' + escapeHTML(prefixed(movie.url)) + '">' +
                        '<img src="' + escapeHTML(prefixed(movie.cover)) + '" alt="' + escapeHTML(movie.title) + '">' +
                        '<span><strong>' + escapeHTML(movie.title) + '</strong>' +
                        '<span>' + escapeHTML(movie.year + " · " + movie.region + " · " + movie.type) + '</span></span>' +
                        '</a>';
                }).join("");
                panel.classList.add("is-open");
            }

            input.addEventListener("input", render);
            input.addEventListener("focus", render);
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var query = input.value.trim().toLowerCase();
                if (!query) {
                    return;
                }
                var first = data.find(function (movie) {
                    return matchMovie(movie, query);
                });
                if (first) {
                    window.location.href = prefixed(first.url);
                } else {
                    render();
                }
            });
            document.addEventListener("click", function (event) {
                if (!form.contains(event.target)) {
                    panel.classList.remove("is-open");
                }
            });
        });
    }

    function setupCatalog() {
        var catalog = document.querySelector("[data-catalog]");
        if (!catalog) {
            return;
        }
        var search = catalog.querySelector("[data-filter-search]");
        var type = catalog.querySelector("[data-filter-type]");
        var year = catalog.querySelector("[data-filter-year]");
        var sort = catalog.querySelector("[data-sort]");
        var list = catalog.querySelector("[data-card-list]");
        var empty = catalog.querySelector("[data-empty-state]");
        var cards = Array.prototype.slice.call(catalog.querySelectorAll(".movie-card"));

        function value(node) {
            return node ? node.value.trim().toLowerCase() : "";
        }

        function apply() {
            var keyword = value(search);
            var typeValue = value(type);
            var yearValue = value(year);
            var visible = 0;
            cards.forEach(function (card) {
                var text = [card.dataset.title, card.dataset.genre, card.dataset.tags, card.dataset.region, card.dataset.type, card.dataset.year].join(" ").toLowerCase();
                var ok = true;
                if (keyword && text.indexOf(keyword) === -1) {
                    ok = false;
                }
                if (typeValue && String(card.dataset.type || "").toLowerCase() !== typeValue) {
                    ok = false;
                }
                if (yearValue && String(card.dataset.year || "") !== yearValue) {
                    ok = false;
                }
                card.style.display = ok ? "" : "none";
                if (ok) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.classList.toggle("is-open", visible === 0);
            }
        }

        function reorder() {
            if (!list || !sort) {
                return;
            }
            var mode = sort.value;
            cards.sort(function (a, b) {
                if (mode === "year-asc") {
                    return Number(a.dataset.year || 0) - Number(b.dataset.year || 0);
                }
                if (mode === "title-asc") {
                    return String(a.dataset.title || "").localeCompare(String(b.dataset.title || ""), "zh-Hans-CN");
                }
                return Number(b.dataset.year || 0) - Number(a.dataset.year || 0);
            });
            cards.forEach(function (card) {
                list.appendChild(card);
            });
            apply();
        }

        [search, type, year].forEach(function (node) {
            if (node) {
                node.addEventListener("input", apply);
                node.addEventListener("change", apply);
            }
        });
        if (sort) {
            sort.addEventListener("change", reorder);
        }
        apply();
    }

    function setupPlayer() {
        var shells = Array.prototype.slice.call(document.querySelectorAll(".player-shell"));
        shells.forEach(function (shell) {
            var video = shell.querySelector("video.movie-player");
            var overlay = shell.querySelector("[data-player-start]");
            if (!video) {
                return;
            }
            var stream = video.getAttribute("data-stream");
            var ready = false;
            var hls = null;

            function prepare() {
                if (ready || !stream) {
                    return;
                }
                ready = true;
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = stream;
                } else if (window.Hls && window.Hls.isSupported()) {
                    hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                    hls.loadSource(stream);
                    hls.attachMedia(video);
                } else {
                    video.src = stream;
                }
            }

            function start() {
                prepare();
                if (overlay) {
                    overlay.classList.add("is-hidden");
                }
                var attempt = video.play();
                if (attempt && typeof attempt.catch === "function") {
                    attempt.catch(function () {});
                }
            }

            if (overlay) {
                overlay.addEventListener("click", start);
            }
            video.addEventListener("click", function () {
                if (!ready || video.paused) {
                    start();
                }
            });
            video.addEventListener("play", function () {
                if (overlay) {
                    overlay.classList.add("is-hidden");
                }
            });
            window.addEventListener("beforeunload", function () {
                if (hls) {
                    hls.destroy();
                }
            });
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        setupMenu();
        setupBackTop();
        setupHero();
        setupSearch();
        setupCatalog();
        setupPlayer();
    });
})();
