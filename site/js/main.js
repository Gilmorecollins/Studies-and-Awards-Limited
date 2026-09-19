(function () {
  'use strict';

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');

  if (toggle && nav) {
    var closeNav = function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    var openNav = function () {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', function () {
      if (nav.classList.contains('is-open')) {
        closeNav();
      } else {
        openNav();
      }
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeNav();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeNav();
    });

    var mq = window.matchMedia('(min-width: 769px)');
    var handleViewportChange = function (event) {
      if (event.matches) closeNav();
    };
    if (mq.addEventListener) {
      mq.addEventListener('change', handleViewportChange);
    } else if (mq.addListener) {
      mq.addListener(handleViewportChange);
    }
  }

  var yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

// Transparent header over a full-bleed hero photo — turns solid once the
// page scrolls past the hero so nav text stays readable over lighter content.
(function () {
  'use strict';

  var header = document.querySelector('.site-header.header-overlay');
  if (!header) return;

  var updateScrolled = function () {
    if (window.scrollY > 40) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  updateScrolled();
  window.addEventListener('scroll', updateScrolled, { passive: true });
})();

// Destination page: full-screen autoplaying city slideshow — crossfades
// to the next city on a timer, or on demand via the dots/pause button.
(function () {
  'use strict';

  var scroller = document.getElementById('city-scroller');
  if (!scroller) return;

  var images = scroller.querySelectorAll('.city-img');
  var panels = scroller.querySelectorAll('.city-panel');
  var dots = scroller.querySelectorAll('.city-dot');
  var playToggle = scroller.querySelector('.city-play-toggle');
  var count = images.length;
  if (!count) return;

  var interval = parseInt(scroller.getAttribute('data-interval'), 10) || 6000;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var activeIndex = -1;
  var timer = null;
  var playing = false;

  // Lazy-load each background image only once, right before it's needed —
  // avoids fetching every city photo (potentially 9+ full-screen images) on load.
  function loadImage(el) {
    if (!el || el.dataset.loaded) return;
    var src = el.getAttribute('data-src');
    if (!src) return;
    el.style.backgroundImage = "url('" + src + "')";
    el.dataset.loaded = 'true';
  }

  function restartDotFill(index) {
    dots.forEach(function (dot, i) {
      var fill = dot.querySelector('.city-dot-fill');
      if (!fill) return;
      dot.classList.toggle('is-done', i < index);
      if (i === index) {
        fill.style.animation = 'none';
        // force reflow so the animation restarts from 0% each time
        // eslint-disable-next-line no-unused-expressions
        fill.offsetHeight;
        fill.style.animation = playing ? 'city-dot-progress ' + interval + 'ms linear forwards' : 'none';
      } else {
        fill.style.animation = 'none';
      }
    });
  }

  function setActive(index) {
    if (index === activeIndex) return;
    var prevIndex = activeIndex;
    activeIndex = index;
    loadImage(images[index]);
    loadImage(images[(index + 1) % count]); // preload the next one for a seamless crossfade

    // The outgoing image is mid-way through its slow Ken Burns zoom. Simply
    // removing .is-active kills that animation instantly, snapping the scale
    // back to its 1.08 starting point right as the crossfade begins — freeze
    // it at its current computed scale instead so the fade-out stays smooth.
    if (prevIndex > -1 && images[prevIndex]) {
      var outgoing = images[prevIndex];
      var computed = window.getComputedStyle(outgoing).transform;
      outgoing.style.transform = computed && computed !== 'none' ? computed : '';
      outgoing.style.animation = 'none';
    }

    images.forEach(function (el, i) {
      if (i === index) {
        // Clear any freeze left over from a previous cycle so the zoom
        // animation restarts cleanly from the beginning.
        el.style.transform = '';
        el.style.animation = '';
      }
      el.classList.toggle('is-active', i === index);
    });
    panels.forEach(function (el, i) {
      el.classList.toggle('is-active', i === index);
      el.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
    dots.forEach(function (el, i) { el.classList.toggle('is-active', i === index); });
    restartDotFill(index);
  }

  function goTo(index) {
    setActive(((index % count) + count) % count);
  }

  function next() { goTo(activeIndex + 1); }

  function play() {
    if (playing) return;
    playing = true;
    scroller.classList.add('is-playing');
    if (playToggle) playToggle.setAttribute('aria-label', 'Pause slideshow');
    restartDotFill(activeIndex);
    timer = window.setInterval(next, interval);
  }

  function pause() {
    playing = false;
    scroller.classList.remove('is-playing');
    if (playToggle) playToggle.setAttribute('aria-label', 'Play slideshow');
    if (timer) window.clearInterval(timer);
    restartDotFill(activeIndex);
  }

  setActive(0);

  // Respect reduced-motion: never auto-advance content for those users —
  // the slideshow becomes fully manual (dots / pause-play button still work).
  if (!reduceMotion) {
    play();
  } else if (playToggle) {
    playToggle.setAttribute('aria-label', 'Play slideshow');
  }

  if (playToggle) {
    playToggle.addEventListener('click', function () {
      if (playing) { pause(); } else { play(); }
    });
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      pause();
      goTo(i);
    });
  });
})();
