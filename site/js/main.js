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

// Team section: horizontal member slider — the leftmost card is always the
// active (full-colour) member, everything after it sits in halftone until
// it slides into place — plus the "view more" bio modal.
(function () {
  'use strict';

  var section = document.getElementById('team-slider');
  var members = window.TEAM_MEMBERS;
  if (!section || !members || !members.length) return;

  var viewport = document.getElementById('team-strip-viewport');
  var strip = document.getElementById('team-strip');
  var counterEl = document.getElementById('team-counter');
  var bioEl = document.getElementById('team-bio');
  var nameEl = document.getElementById('team-active-name');
  var roleEl = document.getElementById('team-active-role');
  var progressEl = document.getElementById('team-progress');
  var prevBtn = document.getElementById('team-prev');
  var nextBtn = document.getElementById('team-next');
  var liveEl = document.getElementById('team-live');
  var viewMoreBtn = document.getElementById('team-view-more');

  var count = members.length;
  var activeIndex = 0;
  var animating = false;
  var ANIM_MS = 700;

  members.forEach(function (member, i) {
    var li = document.createElement('li');
    li.className = 'team-card';
    li.setAttribute('role', 'group');
    li.setAttribute('aria-roledescription', 'slide');
    li.setAttribute('aria-label', (i + 1) + ' of ' + count);

    var photo = document.createElement('div');
    photo.className = 'team-card-photo';

    var img = document.createElement('img');
    img.className = 'team-card-photo-img';
    img.src = member.photo;
    img.alt = member.name;
    img.loading = i < 5 ? 'eager' : 'lazy';

    var dots = document.createElement('div');
    dots.className = 'team-card-dots';
    dots.setAttribute('aria-hidden', 'true');

    photo.appendChild(img);
    photo.appendChild(dots);
    li.appendChild(photo);
    strip.appendChild(li);
  });

  var cards = strip.querySelectorAll('.team-card');

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function stepWidth() {
    if (!cards.length) return 0;
    var style = window.getComputedStyle(strip);
    var gap = parseFloat(style.columnGap || style.gap || '0') || 0;
    return cards[0].getBoundingClientRect().width + gap;
  }

  // Fades a set of text elements out, swaps their content, then fades them
  // back in — used for the name/role/bio crossfade on every slide change.
  function crossfadeText(els, texts, silent) {
    if (silent) {
      els.forEach(function (el, i) { el.textContent = texts[i]; });
      return;
    }
    els.forEach(function (el) { el.classList.add('is-swapping'); });
    window.setTimeout(function () {
      els.forEach(function (el, i) {
        el.textContent = texts[i];
        el.classList.remove('is-swapping');
      });
    }, 220);
  }

  function render(index, opts) {
    var silent = !!(opts && opts.silent);
    var member = members[index];

    cards.forEach(function (card, i) { card.classList.toggle('is-active', i === index); });

    strip.style.transition = silent ? 'none' : '';
    strip.style.transform = 'translateX(-' + (index * stepWidth()) + 'px)';

    progressEl.style.transition = silent ? 'none' : '';
    progressEl.style.width = (100 / count) + '%';
    progressEl.style.transform = 'translateX(' + (index * 100) + '%)';

    counterEl.textContent = pad(index + 1) + ' / ' + pad(count);
    crossfadeText([nameEl, roleEl, bioEl], [member.name, member.role, member.shortBio], silent);

    liveEl.textContent = member.name + ', ' + member.role;
  }

  function goTo(index, opts) {
    var silent = !!(opts && opts.silent);
    if (!silent) {
      if (animating || index === activeIndex) return;
      animating = true;
      window.setTimeout(function () { animating = false; }, ANIM_MS);
    }
    activeIndex = ((index % count) + count) % count;
    render(activeIndex, opts);
  }

  function next() { goTo(activeIndex + 1); }
  function prev() { goTo(activeIndex - 1); }

  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  viewport.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); prev(); }
  });

  // Touch swipe (mobile): a clear enough horizontal drag advances the slide.
  var touchStartX = null;
  viewport.addEventListener('touchstart', function (event) {
    touchStartX = event.touches[0].clientX;
  }, { passive: true });
  viewport.addEventListener('touchend', function (event) {
    if (touchStartX === null) return;
    var dx = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) { next(); } else { prev(); }
  });

  // Card width is responsive (%-based), so re-measure and re-position after
  // a resize instead of leaving the strip mis-aligned at the old width.
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      render(activeIndex, { silent: true });
    }, 120);
  });

  render(0, { silent: true });

  // ---- "View more" bio modal ----
  var overlay = document.getElementById('team-modal-overlay');
  var modal = document.getElementById('team-modal');
  var modalClose = document.getElementById('team-modal-close');
  var modalName = document.getElementById('team-modal-name');
  var modalRole = document.getElementById('team-modal-role');
  var modalPhoto = document.getElementById('team-modal-photo');
  var modalLinkedin = document.getElementById('team-modal-linkedin');
  var modalBio = document.getElementById('team-modal-bio');
  var lastFocused = null;

  function trapFocus(event) {
    if (event.key === 'Escape') { closeModal(); return; }
    if (event.key !== 'Tab') return;
    var focusable = modal.querySelectorAll('a[href], button:not([disabled])');
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openModal() {
    var member = members[activeIndex];
    modalName.textContent = member.name;
    modalRole.textContent = member.role;
    modalPhoto.src = member.photo;
    modalPhoto.alt = member.name;

    if (member.linkedin) {
      modalLinkedin.href = member.linkedin;
      modalLinkedin.hidden = false;
    } else {
      modalLinkedin.hidden = true;
    }

    modalBio.innerHTML = '';
    (member.fullBio || []).forEach(function (paragraph) {
      var p = document.createElement('p');
      p.textContent = paragraph;
      modalBio.appendChild(p);
    });

    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    modal.focus();
    document.addEventListener('keydown', trapFocus);
  }

  function closeModal() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', trapFocus);
    window.setTimeout(function () { overlay.hidden = true; }, 260);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  viewMoreBtn.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) closeModal();
  });
})();

// Reusable cursor-follower component: a small circle that trails the mouse
// with lerped easing, scales over interactive targets, and can be told to
// stay visible (in an alternate style) while something like a modal is open.
// Returns { destroy() } so callers can tear down listeners/rAF cleanly.
function createCursorFollower(options) {
  var container = options.container;
  var hoverSelector = options.hoverSelector || 'a, button';
  var openState = options.openState; // optional: { isOpen(): boolean }
  var lerpFactor = typeof options.lerp === 'number' ? options.lerp : 0.15;
  var noop = function () {};

  var supportsFineHover = window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!container || !supportsFineHover || reduceMotion) {
    return { destroy: noop };
  }

  var el = document.createElement('div');
  el.className = 'cursor-follower';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);

  var mouseX = 0;
  var mouseY = 0;
  var curX = 0;
  var curY = 0;
  var started = false;
  var isDown = false;
  var isHover = false;
  var rafId = null;

  function scaleFor() {
    if (isDown) return 0.8;
    if (isHover) return 1.6;
    return 1;
  }

  function tick() {
    curX += (mouseX - curX) * lerpFactor;
    curY += (mouseY - curY) * lerpFactor;
    el.style.transform = 'translate3d(' + curX + 'px, ' + curY + 'px, 0) translate(-50%, -50%) scale(' + scaleFor() + ')';
    rafId = window.requestAnimationFrame(tick);
  }

  function isWithinContainer(x, y) {
    var rect = container.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function refreshVisibility() {
    var modalOpen = !!(openState && openState.isOpen());
    var shouldShow = modalOpen || isWithinContainer(mouseX, mouseY);

    el.classList.toggle('is-modal-open', modalOpen);
    el.classList.toggle('is-visible', shouldShow);

    if (shouldShow && !rafId) {
      if (!started) { curX = mouseX; curY = mouseY; started = true; }
      rafId = window.requestAnimationFrame(tick);
    } else if (!shouldShow && rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
      isHover = false;
    }
  }

  function onMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
    refreshVisibility();
  }
  function onOver(event) {
    isHover = !!(event.target.closest && event.target.closest(hoverSelector));
  }
  function onDown() { isDown = true; }
  function onUp() { isDown = false; }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseover', onOver);
  document.addEventListener('mousedown', onDown);
  document.addEventListener('mouseup', onUp);

  var modalObserver = null;
  if (openState && openState.watchEl && window.MutationObserver) {
    modalObserver = new MutationObserver(refreshVisibility);
    modalObserver.observe(openState.watchEl, { attributes: true, attributeFilter: ['class'] });
  }

  return {
    destroy: function () {
      if (rafId) window.cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      if (modalObserver) modalObserver.disconnect();
      if (el.parentNode) el.parentNode.removeChild(el);
    }
  };
}

// Team section: mount the cursor follower over the slider, keeping it
// visible (in its white variant) for as long as the bio modal is open.
(function () {
  'use strict';

  var section = document.getElementById('team-slider');
  var modalOverlay = document.getElementById('team-modal-overlay');
  if (!section) return;

  createCursorFollower({
    container: section,
    hoverSelector: '.team-slider a, .team-slider button, .team-card-photo, .team-modal a, .team-modal button',
    openState: modalOverlay ? {
      watchEl: modalOverlay,
      isOpen: function () { return modalOverlay.classList.contains('is-open'); }
    } : null
  });
})();
