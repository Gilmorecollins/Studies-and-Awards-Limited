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

// Footer newsletter box — no backend on this site, so "subscribing" opens
// the visitor's own mail client with the address pre-filled, same as every
// other call-to-action on the site.
(function () {
  'use strict';

  var form = document.getElementById('footer-subscribe-form');
  if (!form) return;

  var input = document.getElementById('footer-subscribe-email');

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var email = input.value.trim();
    if (!email) return;

    var subject = encodeURIComponent('Newsletter Signup');
    var body = encodeURIComponent('Please add this email address to the newsletter list: ' + email);
    window.location.href = 'mailto:admissions@studiesandawardsltd.com?subject=' + subject + '&body=' + body;

    form.classList.add('is-sent');
    input.value = 'Check your mail app to send it';
  });
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

// Destination pages: "Want to see another destination?" boarding-pass card.
// Suggests the next destination in the journey order defined in
// destinations-data.js (wrapping round at the end). Accepting flies a small
// plane along the route and then takes the visitor there; declining folds the
// card down to a one-line shortcut for the rest of the session.
//
// Progressive enhancement: the accept button is a real link, so opening it in
// a new tab, middle-click, or running with JS blocked all still work. The
// "Other destinations" pills below stay as the no-JS fallback.
(function () {
  'use strict';

  var mount = document.getElementById('next-destination');
  var list = window.DESTINATIONS;
  if (!mount || !list || list.length < 2) return;

  var fromIndex = -1;
  list.forEach(function (d, i) {
    if (d.slug === mount.getAttribute('data-current')) fromIndex = i;
  });
  if (fromIndex < 0) return;

  var toIndex = (fromIndex + 1) % list.length;
  var from = list[fromIndex];
  var to = list[toIndex];
  var href = to.slug + '.html';
  var wrapped = toIndex < fromIndex;

  var DISMISS_KEY = 'sa-next-destination-dismissed';
  var FLIGHT_MS = 900;
  var LEAVE_MS = 220;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // Session storage can throw (private mode, blocked site data) — the card
  // must render and work either way, so every access is guarded.
  function readDismissed() {
    try { return window.sessionStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; }
  }
  function writeDismissed() {
    try { window.sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) { /* ignore */ }
  }

  var arrowIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12h15M13.5 6l6 6-6 6"/></svg>';
  var planeIcon = '<svg class="next-dest-plane-icon" viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>';

  mount.innerHTML = [
    '<div class="next-dest" data-state="' + (readDismissed() ? 'compact' : 'expanded') + '">',
    '  <div class="next-dest-fold next-dest-fold-pass">',
    '    <div class="next-dest-clip">',
    '      <div class="next-dest-pass">',
    '        <span class="next-dest-mark" aria-hidden="true">' + esc(to.code) + '</span>',
    '        <div class="next-dest-main">',
    '          <span class="eyebrow next-dest-eyebrow">' + (wrapped ? 'Full circle' : 'Next stop') + ' &middot; ' + pad(toIndex + 1) + ' / ' + pad(list.length) + '</span>',
    '          <h2 class="next-dest-title">Want to see another destination?</h2>',
    '          <p class="next-dest-lead">Next on the route is <strong>' + esc(to.name) + '</strong> &mdash; <em>' + esc(to.welcome) + '</em>.</p>',
    '          <p class="next-dest-tagline">' + esc(to.tagline) + '</p>',
    '          <div class="next-dest-route" aria-hidden="true">',
    '            <div class="next-dest-stop"><span class="next-dest-stop-code">' + esc(from.code) + '</span><span class="next-dest-stop-name">' + esc(from.name) + '</span></div>',
    '            <div class="next-dest-track"><span class="next-dest-trail"></span><span class="next-dest-plane">' + planeIcon + '</span></div>',
    '            <div class="next-dest-stop is-to"><span class="next-dest-stop-code">' + esc(to.code) + '</span><span class="next-dest-stop-name">' + esc(to.name) + '</span></div>',
    '          </div>',
    '        </div>',
    '        <div class="next-dest-stub">',
    '          <span class="next-dest-stub-label" aria-hidden="true">Boarding pass</span>',
    '          <a class="btn btn-primary next-dest-go" href="' + esc(href) + '"><span class="next-dest-go-label">Yes, take me to ' + esc(to.name) + '</span>' + arrowIcon + '</a>',
    '          <button type="button" class="next-dest-later">Not now</button>',
    '          <span class="next-dest-barcode" aria-hidden="true"></span>',
    '        </div>',
    '      </div>',
    '    </div>',
    '  </div>',
    '  <div class="next-dest-fold next-dest-fold-compact">',
    '    <div class="next-dest-clip">',
    '      <a class="next-dest-compact" href="' + esc(href) + '">',
    '        <span class="next-dest-compact-code" aria-hidden="true">' + esc(to.code) + '</span>',
    '        <span class="next-dest-compact-text">Next stop: <strong>' + esc(to.name) + '</strong></span>',
    '        ' + arrowIcon,
    '      </a>',
    '    </div>',
    '  </div>',
    '  <p class="sr-only" role="status" aria-live="polite"></p>',
    '</div>'
  ].join('\n');

  var root = mount.querySelector('.next-dest');
  var goLink = root.querySelector('.next-dest-go');
  var goLabel = root.querySelector('.next-dest-go-label');
  var laterBtn = root.querySelector('.next-dest-later');
  var compactLink = root.querySelector('.next-dest-compact');
  var status = root.querySelector('[role="status"]');
  var goLabelText = goLabel.textContent;

  // --- Reveal on scroll + prefetch -----------------------------------------
  // The next page is a few KB of HTML; fetching it while the visitor reads the
  // card (or the moment they show intent) makes accepting feel instant.
  var prefetched = false;
  function prefetch() {
    if (prefetched) return;
    var conn = window.navigator.connection;
    if (conn && conn.saveData) return;
    prefetched = true;
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'document';
    link.href = href;
    document.head.appendChild(link);
  }

  function reveal() {
    root.classList.add('is-visible');
    prefetch();
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        reveal();
        observer.disconnect();
      }
    }, { threshold: 0.25 });
    observer.observe(root);
  } else {
    reveal();
  }

  ['pointerenter', 'focusin', 'touchstart'].forEach(function (type) {
    root.addEventListener(type, prefetch, { passive: true });
  });

  // --- Accept: fly, then go --------------------------------------------------
  var departing = false;
  var timers = [];

  function clearTimers() {
    timers.forEach(function (id) { window.clearTimeout(id); });
    timers = [];
  }

  goLink.addEventListener('click', function (event) {
    // A second click while airborne skips the wait: let the link navigate.
    if (departing) { clearTimers(); return; }
    // Leave new-tab / new-window clicks and reduced-motion visitors alone.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (reduceMotion) return;

    event.preventDefault();
    departing = true;
    root.classList.add('is-departing');
    goLabel.textContent = 'Boarding…';
    status.textContent = 'Boarding. Taking you to ' + to.name + '.';

    timers.push(window.setTimeout(function () {
      document.documentElement.classList.add('is-leaving');
      timers.push(window.setTimeout(function () { window.location.assign(href); }, LEAVE_MS));
    }, FLIGHT_MS));
  });

  // Coming back via the browser's back button can restore this page from the
  // back/forward cache exactly as we left it — mid-flight. Put it back on the
  // runway.
  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    clearTimers();
    departing = false;
    root.classList.remove('is-departing');
    document.documentElement.classList.remove('is-leaving');
    goLabel.textContent = goLabelText;
    status.textContent = '';
  });

  // --- Decline: fold down to a one-line shortcut -----------------------------
  laterBtn.addEventListener('click', function () {
    root.setAttribute('data-state', 'compact');
    writeDismissed();
    status.textContent = 'Suggestion dismissed. A shortcut to ' + to.name + ' is still here if you change your mind.';
    compactLink.focus({ preventScroll: true });
  });
})();

// Destination pages: the "View partners & courses" dialog. A city panel's button
// opens a searchable list of that city's partner institutions and the courses
// each offers, read from js/partners-<country>.js (generated from
// tools/data/partner-institutions.json). Behaves like the team bio modal —
// Escape / overlay click / close button, focus trap, body scroll lock, focus
// returned to the button — and pauses the city slideshow while it's open.
(function () {
  'use strict';

  var overlay = document.getElementById('partners-overlay');
  var scroller = document.getElementById('city-scroller');
  var all = window.PARTNERS;
  if (!overlay || !scroller || !all) return;

  var cities = all[Object.keys(all)[0]]; // a destination page loads exactly one country's data
  if (!cities) return;

  var modal = document.getElementById('partners-modal');
  var closeBtn = document.getElementById('partners-close');
  var titleEl = document.getElementById('partners-title');
  var searchInput = document.getElementById('partners-search-input');
  var countEl = document.getElementById('partners-count');
  var bodyEl = document.getElementById('partners-body');
  var playToggle = scroller.querySelector('.city-play-toggle');

  var MAIL = 'admissions@studiesandawardsltd.com';
  var chevron = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  var built = {};         // city -> { items, emptyEl }, built once on first open
  var current = null;     // the city being shown
  var lastFocused = null;
  var pausedSlideshow = false;
  var hideTimer = null;

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  // Writes `text` into `el`, wrapping the first occurrence of `term` in <mark>.
  function highlight(el, text, term) {
    el.textContent = '';
    var i = term ? text.toLowerCase().indexOf(term) : -1;
    if (i < 0) { el.textContent = text; return; }
    var mark = document.createElement('mark');
    mark.textContent = text.slice(i, i + term.length);
    el.appendChild(document.createTextNode(text.slice(0, i)));
    el.appendChild(mark);
    el.appendChild(document.createTextNode(text.slice(i + term.length)));
  }

  function build(city) {
    return cities[city].map(function (inst) {
      var details = document.createElement('details');
      details.className = 'partners-item';

      var summary = document.createElement('summary');
      var name = document.createElement('span');
      name.className = 'partners-item-name';
      name.textContent = inst.name;
      var meta = document.createElement('span');
      meta.className = 'partners-item-meta';
      meta.innerHTML = '<span>' + (inst.courses.length ? plural(inst.courses.length, 'course', 'courses') : 'Courses on request') + '</span>' + chevron;
      summary.appendChild(name);
      summary.appendChild(meta);
      details.appendChild(summary);

      var chips = [];
      if (inst.courses.length) {
        var ul = document.createElement('ul');
        ul.className = 'partners-courses';
        inst.courses.forEach(function (course) {
          var li = document.createElement('li');
          li.className = 'partners-course';
          li.textContent = course;
          ul.appendChild(li);
          chips.push({ el: li, text: course });
        });
        details.appendChild(ul);
      } else {
        var note = document.createElement('p');
        note.className = 'partners-nocourses';
        var subject = encodeURIComponent('Course enquiry - ' + inst.name + ' (' + city + ')');
        note.innerHTML = 'The course list for this institution isn’t published here yet. <a href="mailto:' + MAIL + '?subject=' + subject + '">Ask a counsellor</a> which programs it offers.';
        details.appendChild(note);
      }
      return { el: details, nameEl: name, name: inst.name, chips: chips };
    });
  }

  function render(city) {
    if (!built[city]) {
      var empty = document.createElement('p');
      empty.className = 'partners-empty';
      empty.hidden = true;
      built[city] = { items: build(city), emptyEl: empty };
    }
    bodyEl.textContent = '';
    built[city].items.forEach(function (it) { bodyEl.appendChild(it.el); });
    bodyEl.appendChild(built[city].emptyEl);
  }

  // Filters by institution name or course. Institutions whose *courses* match are
  // opened and the matching courses highlighted, so a search for "nursing" shows
  // where it can be studied.
  function applyFilter() {
    var term = searchInput.value.trim().toLowerCase();
    var data = built[current];
    var shown = 0;
    data.items.forEach(function (it) {
      var nameHit = !term || it.name.toLowerCase().indexOf(term) > -1;
      var chipHits = 0;
      it.chips.forEach(function (chip) {
        var hit = !!term && chip.text.toLowerCase().indexOf(term) > -1;
        if (hit) chipHits++;
        chip.el.classList.toggle('is-match', hit);
        highlight(chip.el, chip.text, hit ? term : '');
      });
      var visible = nameHit || chipHits > 0;
      it.el.hidden = !visible;
      it.el.open = !!term && chipHits > 0;
      highlight(it.nameEl, it.name, term && nameHit ? term : '');
      if (visible) shown++;
    });
    var total = data.items.length;
    countEl.textContent = term
      ? 'Showing ' + shown + ' of ' + plural(total, 'institution', 'institutions')
      : plural(total, 'partner institution', 'partner institutions') + ' · select one to see its courses';
    data.emptyEl.hidden = shown > 0;
    if (!shown) data.emptyEl.textContent = 'No institution or course in ' + current + ' matches “' + searchInput.value.trim() + '”. Try a broader word, such as “nursing” or “business”.';
  }

  // Elements a keyboard user can actually reach: visible, and not tucked inside a
  // collapsed institution (only its summary row is focusable while it's closed).
  function focusables() {
    return Array.prototype.filter.call(modal.querySelectorAll('button, input, summary, a[href]'), function (el) {
      if (el.offsetParent === null) return false;
      return el.tagName === 'SUMMARY' || !el.closest('details:not([open])');
    });
  }

  function trapKeys(event) {
    if (event.key === 'Escape') { close(); return; }
    if (event.key !== 'Tab') return;
    var focusable = focusables();
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === modal)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function open(city, trigger) {
    if (!cities[city]) return;
    current = city;
    titleEl.textContent = city;
    searchInput.value = '';
    render(city);
    applyFilter();
    bodyEl.scrollTop = 0;

    // the slideshow would keep rotating behind the dialog — pause it, resume on close
    if (playToggle && scroller.classList.contains('is-playing')) { playToggle.click(); pausedSlideshow = true; }

    window.clearTimeout(hideTimer);
    lastFocused = trigger || document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    modal.focus();
    document.addEventListener('keydown', trapKeys);
  }

  function close() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', trapKeys);
    hideTimer = window.setTimeout(function () { overlay.hidden = true; }, 260);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    if (pausedSlideshow && playToggle) { playToggle.click(); pausedSlideshow = false; }
  }

  Array.prototype.forEach.call(scroller.querySelectorAll('.partners-open'), function (btn) {
    btn.addEventListener('click', function () { open(btn.getAttribute('data-partners-city'), btn); });
  });
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) close();
  });
  searchInput.addEventListener('input', applyFilter);
})();

// Site-wide "Book Free Consultation": instead of opening an email, the button
// opens a chooser of our staff (from js/team-data.js) — pick who to talk to and
// go straight to their WhatsApp with a message ready to send. People are listed
// in the same order as the Team page, can be narrowed by department, and a
// person flagged `startHere` is offered first for visitors who aren't sure.
//
// It takes over any link whose address is the consultation email (so all the
// existing buttons work without being edited), plus anything marked
// data-consult. Progressive enhancement: until at least one person has a
// `whatsapp` number in team-data.js, it steps aside and the buttons keep opening
// an email, exactly as before — and the email link stays the fallback for
// new-tab clicks and for visitors without JavaScript.
(function () {
  'use strict';

  var members = window.TEAM_MEMBERS;
  if (!members || !members.length) return;

  var OFFICE_TEL = '+254721796500';
  var OFFICE_TEL_LABEL = '+254 721 796500';
  var OFFICE_MAIL = 'admissions@studiesandawardsltd.com';
  var TRIGGER = 'a[href*="subject=Free%20Consultation"], a[data-consult], button[data-consult]';
  var preview = /[?&]consultPreview(=|&|$)/.test(window.location.search);
  var order = window.CONSULT_DEPARTMENTS || [];

  var overlay = null;
  var modal = null;
  var body = null;
  var grid = null;
  var filters = null;
  var filtersWrap = null;
  var countEl = null;
  var topicEl = null;
  var startEl = null;
  var labelEl = null;
  var lastFocused = null;
  var hideTimer = null;
  var activeDept = '';
  var topic = '';

  // "0712 345 678", "+254 712 345 678", "254712345678" -> "254712345678".
  // A leading 0 is read as Kenya. Anything that isn't a plausible number -> ''.
  function normalize(raw) {
    var text = String(raw || '').trim();
    var digits = text.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.indexOf('00') === 0) digits = digits.slice(2);
    else if (digits.charAt(0) === '0') digits = '254' + digits.slice(1);
    else if (text.charAt(0) !== '+' && digits.length === 9) digits = '254' + digits;
    return digits.length >= 11 && digits.length <= 15 ? digits : '';
  }

  function pretty(digits) {
    if (digits.indexOf('254') === 0 && digits.length === 12) return '+254 ' + digits.slice(3, 6) + ' ' + digits.slice(6, 9) + ' ' + digits.slice(9);
    return '+' + digits;
  }

  function firstName(member) { return String(member.name).split(' ')[0]; }

  function hasContacts() {
    return members.some(function (m) { return normalize(m.whatsapp); });
  }

  // Who's shown: everyone with a working number (plus, in ?consultPreview mode,
  // everyone else too, greyed out), in the same order as the Team page.
  function people() {
    return members.map(function (m) { return { m: m, number: normalize(m.whatsapp) }; })
      .filter(function (p) { return p.number || preview; });
  }

  // The department filters: the order set by CONSULT_DEPARTMENTS (front-line
  // first), then any other department in the order it first appears.
  function departmentsOf(list) {
    var names = [];
    list.forEach(function (p) { if (p.m.department && names.indexOf(p.m.department) < 0) names.push(p.m.department); });
    function rank(name) { var r = order.indexOf(name); return r < 0 ? order.length : r; }
    return names.map(function (name, i) { return { name: name, i: i }; })
      .sort(function (a, b) { return rank(a.name) - rank(b.name) || a.i - b.i; })
      .map(function (x) { return x.name; });
  }

  // What the visitor is asking about: from the button (data-consult, or the
  // country in its email subject), else the destination page they're on.
  function topicFor(trigger) {
    var explicit = trigger.getAttribute('data-consult');
    if (explicit) return explicit;
    var match = /subject=([^&]*)/.exec(trigger.getAttribute('href') || '');
    if (match) {
      try {
        var country = /Free Consultation Request - (.+)$/.exec(decodeURIComponent(match[1]));
        if (country) return country[1];
      } catch (e) { /* malformed subject: fall through */ }
    }
    var mount = document.getElementById('next-destination');
    if (mount && window.DESTINATIONS) {
      for (var i = 0; i < window.DESTINATIONS.length; i++) {
        if (window.DESTINATIONS[i].slug === mount.getAttribute('data-current')) return window.DESTINATIONS[i].name;
      }
    }
    return '';
  }

  function messageFor(member) {
    return 'Hello ' + firstName(member) + ', I’d like to book a free consultation' +
      (topic ? ' about studying in ' + topic : '') + '. (Sent from the Studies and Awards website)';
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function icon(paths, size, width) {
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="' + width + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  }
  var whatsappIcon = icon('<path d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2Z"/><path d="M9.2 8.6c.2 2.6 2.7 5.1 5.3 5.4l1.1-1.3-1.9-.9-.8.6a3.9 3.9 0 0 1-1.4-1.4l.6-.8-.9-1.9-2 .3Z"/>', 18, 1.8);
  var phoneIcon = icon('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>', 18, 1.8);
  var mailIcon = icon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', 18, 1.8);
  var checkIcon = icon('<path d="M5 12.5l4.5 4.5L19 7"/>', 16, 2);
  var closeIcon = icon('<path d="M6 6l12 12M18 6L6 18"/>', 20, 2);
  var chevronLeft = icon('<path d="m15 6-6 6 6 6"/>', 18, 2);
  var chevronRight = icon('<path d="m9 6 6 6-6 6"/>', 18, 2);

  function buildShell() {
    overlay = el('div', 'consult-overlay');
    overlay.id = 'consult-overlay';
    overlay.hidden = true;
    overlay.innerHTML = [
      '<div class="consult-modal" role="dialog" aria-modal="true" aria-labelledby="consult-title" aria-describedby="consult-sub" id="consult-modal" tabindex="-1">',
      '  <button type="button" class="consult-close" aria-label="Close">' + closeIcon + '</button>',
      '  <div class="consult-head">',
      '    <span class="eyebrow">FREE CONSULTATION</span>',
      '    <h2 class="consult-title" id="consult-title">Who would you like to talk to?</h2>',
      '    <p class="consult-sub" id="consult-sub">Pick the person who fits what you need. WhatsApp opens with your message already written, and you can edit it before you send.</p>',
      '    <p class="consult-topic" hidden><span>Asking about</span><strong></strong></p>',
      '    <p class="consult-assure">' + checkIcon + 'Free initial consultation &middot; no obligation</p>',
      '  </div>',
      '  <div class="consult-main">',
      '    <div class="consult-toolbar">',
      '      <p class="consult-count" role="status" aria-live="polite"></p>',
      '      <div class="consult-filters-wrap">',
      '        <button type="button" class="consult-scroll consult-scroll-prev" tabindex="-1" aria-hidden="true">' + chevronLeft + '</button>',
      '        <div class="consult-filters" role="group" aria-label="Filter by department"></div>',
      '        <button type="button" class="consult-scroll consult-scroll-next" tabindex="-1" aria-hidden="true">' + chevronRight + '</button>',
      '      </div>',
      '    </div>',
      '    <div class="consult-body"></div>',
      '  </div>',
      '  <div class="consult-foot">',
      '    <p class="consult-foot-title">Prefer another way?</p>',
      '    <a class="consult-foot-link" href="tel:' + OFFICE_TEL + '">' + phoneIcon + '<span>Call the office <b class="consult-foot-detail">' + OFFICE_TEL_LABEL + '</b></span></a>',
      '    <a class="consult-foot-link" href="mailto:' + OFFICE_MAIL + '?subject=Free%20Consultation%20Request" data-consult-fallback>' + mailIcon + '<span>Email <b class="consult-foot-detail">' + OFFICE_MAIL + '</b></span></a>',
      '  </div>',
      '</div>'
    ].join('\n');
    document.body.appendChild(overlay);
    modal = overlay.querySelector('.consult-modal');
    body = overlay.querySelector('.consult-body');
    filters = overlay.querySelector('.consult-filters');
    filtersWrap = overlay.querySelector('.consult-filters-wrap');
    countEl = overlay.querySelector('.consult-count');
    topicEl = overlay.querySelector('.consult-topic');

    overlay.querySelector('.consult-close').addEventListener('click', close);
    overlay.addEventListener('click', function (event) { if (event.target === overlay) close(); });
    filters.addEventListener('click', function (event) {
      var chip = event.target.closest('.consult-chip');
      if (!chip) return;
      activeDept = chip.getAttribute('data-dept');
      applyDepartment();
      chip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: scrollBehavior() });
    });
    // the filter row is one line; arrows (mouse users) and the edge fade show there's more
    filters.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll);
    overlay.querySelector('.consult-scroll-prev').addEventListener('click', function () { nudge(-1); });
    overlay.querySelector('.consult-scroll-next').addEventListener('click', function () { nudge(1); });
  }

  function scrollBehavior() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }

  function nudge(direction) {
    filters.scrollBy({ left: direction * Math.round(filters.clientWidth * 0.7), behavior: scrollBehavior() });
  }

  function updateScroll() {
    if (!filters || !filtersWrap || filtersWrap.hidden) return;
    var max = filters.scrollWidth - filters.clientWidth;
    filtersWrap.classList.toggle('can-left', filters.scrollLeft > 4);
    filtersWrap.classList.toggle('can-right', filters.scrollLeft < max - 4);
  }

  function photoFor(member, size) {
    var photo = el('img', 'consult-photo');
    photo.src = member.thumb || member.photo; // the small pre-framed portrait; the big photo only if a thumb is missing
    photo.alt = '';
    photo.width = size;
    photo.height = size;
    photo.loading = 'lazy';
    photo.decoding = 'async';
    return photo;
  }

  // The green button. Its ::after stretches over the whole row, so the entire
  // row is one big tap target (the call button sits above it).
  function whatsappLink(p, className, label) {
    var link = el('a', className);
    link.href = 'https://wa.me/' + p.number + '?text=' + encodeURIComponent(messageFor(p.m));
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.innerHTML = whatsappIcon + '<span></span>';
    link.querySelector('span').textContent = label;
    link.setAttribute('aria-label', 'Chat with ' + firstName(p.m) + ' on WhatsApp (opens in a new tab)');
    return link;
  }

  function callLink(p) {
    var link = el('a', 'consult-call');
    link.href = 'tel:+' + p.number;
    link.title = 'Call ' + pretty(p.number);
    link.setAttribute('aria-label', 'Call ' + firstName(p.m) + ' on ' + pretty(p.number));
    link.innerHTML = phoneIcon;
    return link;
  }

  function identity(m) {
    var info = el('div', 'consult-info');
    info.appendChild(el('h3', 'consult-name', m.name));
    info.appendChild(el('p', 'consult-role', m.role || m.department));
    return info;
  }

  function row(p, index) {
    var m = p.m;
    var card = el('li', 'consult-card' + (p.number ? '' : ' is-pending'));
    card.setAttribute('data-dept', m.department || '');
    card.style.setProperty('--i', String(Math.min(index, 10)));
    card.appendChild(photoFor(m, 56));
    card.appendChild(identity(m));
    if (m.helpsWith) card.appendChild(el('p', 'consult-help', m.helpsWith));

    var actions = el('div', 'consult-actions');
    if (p.number) {
      actions.appendChild(whatsappLink(p, 'consult-wa', 'WhatsApp'));
      actions.appendChild(callLink(p));
    } else {
      actions.appendChild(el('span', 'consult-pending', 'Number coming soon'));
    }
    card.appendChild(actions);
    return card;
  }

  // For visitors who don't know who to ask: the person flagged `startHere`.
  function startCard(p) {
    var m = p.m;
    var box = el('section', 'consult-start');
    box.setAttribute('aria-labelledby', 'consult-start-tag');
    var tag = el('span', 'consult-start-tag', 'Not sure who to pick? Start here');
    tag.id = 'consult-start-tag';
    box.appendChild(tag);

    var inner = el('div', 'consult-start-body');
    inner.appendChild(photoFor(m, 64));
    inner.appendChild(identity(m));
    if (m.helpsWith) inner.appendChild(el('p', 'consult-help', m.helpsWith));
    inner.appendChild(whatsappLink(p, 'consult-start-wa', 'Chat with ' + firstName(m) + ' on WhatsApp'));
    box.appendChild(inner);
    return box;
  }

  function applyDepartment() {
    Array.prototype.forEach.call(filters.querySelectorAll('.consult-chip'), function (chip) {
      var on = chip.getAttribute('data-dept') === activeDept;
      chip.classList.toggle('is-active', on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var cards = grid.querySelectorAll('.consult-card');
    var shown = 0;
    Array.prototype.forEach.call(cards, function (card) {
      var hide = !!activeDept && card.getAttribute('data-dept') !== activeDept;
      card.hidden = hide;
      if (!hide) shown++;
    });
    // the "start here" shortcut belongs to the unfiltered view
    if (startEl) startEl.hidden = !!activeDept;
    if (labelEl) labelEl.hidden = !!activeDept;

    countEl.textContent = activeDept
      ? shown + (shown === 1 ? ' person' : ' people') + ' in ' + activeDept
      : cards.length + ' people to talk to';
    body.scrollTop = 0;
  }

  function render() {
    var list = people();
    body.textContent = '';
    filters.textContent = '';

    if (topic) {
      topicEl.hidden = false;
      topicEl.querySelector('strong').textContent = 'Studying in ' + topic;
    } else {
      topicEl.hidden = true;
    }

    if (preview) {
      body.appendChild(el('p', 'consult-preview', 'Preview mode: people who don’t have a WhatsApp number yet are shown greyed out. Visitors won’t see them until a number is added in js/team-data.js.'));
    }

    var start = null;
    list.forEach(function (p) { if (!start && p.m.startHere && p.number) start = p; });
    startEl = start ? startCard(start) : null;
    labelEl = start ? el('p', 'consult-label', 'Or choose someone specific') : null;
    if (startEl) { body.appendChild(startEl); body.appendChild(labelEl); }

    grid = el('ul', 'consult-grid');
    list.forEach(function (p, i) { grid.appendChild(row(p, i)); });
    body.appendChild(grid);

    // department filters — only worth showing when there's a real choice to narrow
    var departments = departmentsOf(list);
    var counts = {};
    list.forEach(function (p) { counts[p.m.department] = (counts[p.m.department] || 0) + 1; });
    filtersWrap.hidden = !(list.length > 4 && departments.length > 1);
    filters.scrollLeft = 0;
    ['All'].concat(departments).forEach(function (name, i) {
      var chip = el('button', 'consult-chip');
      chip.type = 'button';
      chip.setAttribute('data-dept', i === 0 ? '' : name);
      chip.appendChild(document.createTextNode(name));
      chip.appendChild(el('span', 'consult-chip-count', String(i === 0 ? list.length : counts[name])));
      filters.appendChild(chip);
    });
    activeDept = '';
    applyDepartment();
  }

  function focusables() {
    return Array.prototype.filter.call(modal.querySelectorAll('button, a[href]'), function (node) {
      return node.offsetParent !== null && !node.closest('[hidden]') && node.getAttribute('tabindex') !== '-1';
    });
  }

  function trapKeys(event) {
    if (event.key === 'Escape') { close(); return; }
    if (event.key !== 'Tab') return;
    var items = focusables();
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === modal)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function open(trigger) {
    if (!overlay) buildShell();
    topic = topicFor(trigger);
    render();

    window.clearTimeout(hideTimer);
    lastFocused = trigger;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    updateScroll();
    window.requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    modal.focus();
    document.addEventListener('keydown', trapKeys);
  }

  function close() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', trapKeys);
    hideTimer = window.setTimeout(function () { overlay.hidden = true; }, 260);
    if (lastFocused && typeof lastFocused.focus === 'function' && document.contains(lastFocused)) lastFocused.focus();
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest ? event.target.closest(TRIGGER) : null;
    if (!trigger || event.defaultPrevented) return;
    // the chooser's own "Email" link must really open the email app
    if (trigger.hasAttribute('data-consult-fallback')) return;
    // leave new-tab / new-window clicks to the browser
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // nobody to choose from yet: let the email link do its job
    if (!hasContacts() && !preview) return;
    event.preventDefault();
    open(trigger);
  });
})();

// Home page: the "What people say" section, fed by js/testimonials-data.js.
//
// Real quotes are always shown. Entries marked `sample: true` are stand-ins for
// reviewing the design: they show only on a developer's own copy (a file, or
// localhost) or when ?testimonialsPreview is added to the address, and never on
// a real website address — so a forgotten sample can't reach visitors. With
// nothing to show, the section stays hidden. An incomplete entry (no quote or
// no name) is skipped rather than shown half-empty.
(function () {
  'use strict';

  var section = document.getElementById('testimonials');
  var grid = document.getElementById('testimonial-grid');
  var all = window.TESTIMONIALS;
  if (!section || !grid || !all || !all.length) return;

  var here = window.location;
  var ownCopy = here.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(here.hostname);
  var allowSamples = ownCopy || /[?&]testimonialsPreview(=|&|$)/.test(here.search);

  var quoteIcon = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#FFB800" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-bottom:16px;"><path d="M9.5 7C7 8 5.5 10 5.5 13v4h5v-5h-2.2c0-1.6.9-2.7 2.2-3.4L9.5 7Zm8 0c-2.5 1-4 3-4 6v4h5v-5h-2.2c0-1.6.9-2.7 2.2-3.4L17.5 7Z"/></svg>';

  function add(tag, className, text) {
    var node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }

  var shown = 0;
  var samples = 0;
  all.forEach(function (t) {
    if (!t || !t.quote || !t.name) return;
    if (t.sample && !allowSamples) return;
    var card = document.createElement('article');
    card.className = 'testimonial-card' + (t.sample ? ' is-sample' : '');
    if (t.sample) {
      card.appendChild(add('span', 'testimonial-sample', 'Sample — replace before launch'));
      samples++;
    }
    card.insertAdjacentHTML('beforeend', quoteIcon);
    card.appendChild(add('p', 'testimonial-quote', '“' + t.quote + '”'));
    card.appendChild(add('div', 'testimonial-meta', t.name));
    if (t.detail) card.appendChild(add('div', 'testimonial-role', t.detail));
    grid.appendChild(card);
    shown++;
  });
  if (!shown) return;

  if (samples) {
    var note = add('p', 'consult-preview', 'Sample quotes are showing so you can review the layout. Visitors on the live site will not see them: replace them with real quotes in js/testimonials-data.js before you deploy.');
    note.style.margin = '0 auto 24px';
    note.style.maxWidth = '640px';
    grid.parentNode.insertBefore(note, grid);
  }
  section.hidden = false;
})();

// Home page: the dashed zigzag connector behind the "How it works" steps.
// Drawn from the actual on-screen position of each step's dot rather than
// fixed coordinates, so it stays correct whatever the card heights turn out
// to be (text length, font loading, viewport width) and self-corrects on
// resize instead of drifting out of alignment.
(function () {
  'use strict';

  var wrap = document.querySelector('.journey-wrap');
  var svg = wrap && wrap.querySelector('.journey-line');
  var path = svg && svg.querySelector('path');
  var dots = wrap && [].slice.call(wrap.querySelectorAll('.journey-dot'));
  if (!wrap || !path || !dots || dots.length < 2) return;

  function draw() {
    var box = wrap.getBoundingClientRect();
    svg.setAttribute('width', box.width);
    svg.setAttribute('height', box.height);

    var points = dots.map(function (dot) {
      var r = dot.getBoundingClientRect();
      return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
    });

    var d = 'M' + points[0].x + ' ' + points[0].y;
    for (var i = 1; i < points.length; i++) {
      var a = points[i - 1], b = points[i];
      var midX = (a.x + b.x) / 2;
      d += ' C' + midX + ' ' + a.y + ' ' + midX + ' ' + b.y + ' ' + b.x + ' ' + b.y;
    }
    path.setAttribute('d', d);
  }

  draw();
  window.addEventListener('load', draw);

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(draw, 120);
  });
})();
