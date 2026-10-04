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

    document.addEventListener('click', function (event) {
      if (nav.classList.contains('is-open') && !nav.contains(event.target) && !toggle.contains(event.target)) closeNav();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeNav();
    });

    // the desktop menu's breakpoint, as rewritten for the laptop fit in styles.css
    var mq = window.matchMedia('(min-width: 1181px), (min-width: 1024px) and (pointer: fine)');
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
  var status = document.createElement('p');
  status.className = 'footer-subscribe-status';
  status.setAttribute('role', 'status');
  form.parentNode.insertBefore(status, form.nextSibling);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var email = input.value.trim();
    if (!email) return;

    var subject = encodeURIComponent('Newsletter Signup');
    var body = encodeURIComponent('Please add this email address to the newsletter list: ' + email);
    window.location.href = 'mailto:admissions@studiesandawardsltd.com?subject=' + subject + '&body=' + body;

    status.textContent = 'Your email app should open with the request ready. Just press send.';
  });
})();

// Transparent header over a full-bleed hero photo (.header-overlay, the
// destination pages) or over the home page hero (.header-clear). It turns
// solid once the page scrolls, so nav text stays readable over the content below.
(function () {
  'use strict';

  var header = document.querySelector('.site-header.header-overlay, .site-header.header-clear');
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

// Destination page: full-screen autoplaying city slideshow. It crossfades
// to the next city on a timer, or on demand via the progress bars along the
// bottom (.city-dot, one per city) and the pause button.
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
  // Phones and portrait tablets get the 3:4 crop (data-src-portrait): they only
  // ever see the middle of the wide photo, and the crop is far lighter.
  var portrait = window.matchMedia && window.matchMedia('(max-aspect-ratio: 3/4)');
  function loadImage(el) {
    if (!el || el.dataset.loaded) return;
    var src = (portrait && portrait.matches && el.getAttribute('data-src-portrait')) || el.getAttribute('data-src');
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
      // the other cities' buttons are invisible: keep them out of the Tab order too
      el.inert = i !== index;
    });
    dots.forEach(function (el, i) {
      el.classList.toggle('is-active', i === index);
      if (i === index) { el.setAttribute('aria-current', 'true'); } else { el.removeAttribute('aria-current'); }
    });
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

  // Hold still while someone is using the current city: keyboard focus on its
  // buttons, or the pointer over its partner card. Otherwise the city could
  // change mid-read (and take the focused button away). Carries on afterwards
  // if it was playing.
  var focusHeld = false, hoverHeld = false, holding = false, resumeAfterHold = false;
  function updateHold() {
    var hold = focusHeld || hoverHeld;
    if (hold && !holding) {
      holding = true;
      resumeAfterHold = playing;
      if (playing) pause();
    } else if (!hold && holding) {
      holding = false;
      if (resumeAfterHold && !playing) play();
    }
  }
  panels.forEach(function (panel) {
    panel.addEventListener('focusin', function () { focusHeld = true; updateHold(); });
    panel.addEventListener('focusout', function (event) {
      // still here, or gone into the partner list or consultation pop-up it opened
      var to = event.relatedTarget;
      if (to && (panel.contains(to) || to.closest('#partners-overlay, #consult-overlay'))) return;
      focusHeld = false; updateHold();
    });
    var card = panel.querySelector('.city-panel-info');
    if (card) {
      card.addEventListener('pointerenter', function (event) { if (event.pointerType === 'mouse') { hoverHeld = true; updateHold(); } });
      card.addEventListener('pointerleave', function () { hoverHeld = false; updateHold(); });
    }
  });
  // pressing play/pause, or picking a city, is the visitor taking over
  if (playToggle) playToggle.addEventListener('click', function () { resumeAfterHold = playing; });
})();

// A team member's portrait for the Team page, its department sections and the
// consultation cards. `kind` is 'photo' (the big portrait), 'thumb' (small
// square) or 'card' (5:4). Someone whose photo hasn't arrived yet (blank in
// team-data.js) gets a plain silhouette, so no page ever shows a broken image.
(function () {
  'use strict';

  var silhouette = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">' +
    '<rect width="400" height="500" fill="#EEF1F8"/>' +
    '<circle cx="200" cy="190" r="72" fill="#C3CCE0"/>' +
    '<path d="M60 500c0-92 62-150 140-150s140 58 140 150z" fill="#C3CCE0"/></svg>');

  window.teamPortrait = function (member, kind) {
    var order = kind === 'card' ? ['card', 'thumb', 'photo'] : kind === 'thumb' ? ['thumb', 'photo'] : ['photo'];
    for (var i = 0; i < order.length; i++) {
      if (member[order[i]]) return member[order[i]];
    }
    return silhouette;
  };
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
  var prevBtn = document.getElementById('team-prev');
  var nextBtn = document.getElementById('team-next');
  var liveEl = document.getElementById('team-live');
  var viewMoreBtn = document.getElementById('team-view-more');
  var chipsEl = document.getElementById('team-chips');
  var askEl = document.getElementById('team-ask');
  var deptCards = {}; // the "Our departments" cards, by department name (built below)

  var count = members.length;
  var activeIndex = 0;
  var animating = false;
  var ANIM_MS = 700;

  // The strip holds the team twice: the second copy (hidden from screen
  // readers) lets "Next" on the last person slide on to the first again
  // instead of rewinding. Once it lands, the strip silently jumps back to the
  // identical card in the first copy.
  function buildCard(member, i, isClone) {
    var card = document.createElement('div');
    card.className = 'team-card';
    if (isClone) {
      card.setAttribute('aria-hidden', 'true');
    } else {
      card.setAttribute('role', 'group');
      card.setAttribute('aria-roledescription', 'slide');
      card.setAttribute('aria-label', (i + 1) + ' of ' + count);
    }

    var photo = document.createElement('div');
    photo.className = 'team-card-photo';

    var img = document.createElement('img');
    img.className = 'team-card-photo-img';
    img.src = window.teamPortrait(member, 'photo');
    img.alt = isClone ? '' : member.name;
    img.loading = i < 5 ? 'eager' : 'lazy';

    var dots = document.createElement('div');
    dots.className = 'team-card-dots';
    dots.setAttribute('aria-hidden', 'true');

    photo.appendChild(img);
    photo.appendChild(dots);
    card.appendChild(photo);
    return card;
  }

  members.forEach(function (member, i) { strip.appendChild(buildCard(member, i, false)); });
  members.forEach(function (member, i) { strip.appendChild(buildCard(member, i, true)); });

  var cards = strip.querySelectorAll('.team-card');

  // Department chips above the strip: one per department, in the order the
  // team is listed; a chip jumps the strip to the first person in it, and the
  // current person's department is the one filled in.
  var chips = [];
  if (chipsEl) {
    members.forEach(function (member, i) {
      var dep = member.department;
      if (!dep || chips.some(function (c) { return c.getAttribute('data-dep') === dep; })) return;
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'team-chip';
      chip.setAttribute('data-dep', dep);
      chip.setAttribute('aria-pressed', 'false');
      chip.textContent = dep;
      chip.addEventListener('click', function () { goTo(i); });
      chipsEl.appendChild(chip);
      chips.push(chip);
    });
  }

  // Clicking a photo in the strip brings that person to the front.
  cards.forEach(function (card, k) {
    card.addEventListener('click', function () { goTo(k % count); });
  });
  var pos = 0; // leftmost card's position in the strip, 0 .. 2 * count - 1

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  // Both halves must be LAYOUT pixels. `:root` carries a CSS zoom (see the
  // ladder in css/styles.css), and under `zoom` getBoundingClientRect()
  // reports the zoomed visual size while columnGap stays a layout length.
  // Adding the two mixed units under-shifted every step, so the coloured
  // card drifted further right of the left edge the further you paged.
  function stepWidth() {
    if (!cards.length) return 0;
    var style = window.getComputedStyle(strip);
    var gap = parseFloat(style.columnGap || style.gap || '0') || 0;
    return cards[0].offsetWidth + gap;
  }

  // Moves the strip so card `p` is leftmost (and the one in colour). Without
  // animation it also switches off the photo transitions for that frame, so
  // the jump between the two identical copies can't be seen.
  function setPosition(p, animate) {
    if (!animate) {
      strip.classList.add('is-snapping');
      strip.style.transition = 'none';
    }
    cards.forEach(function (card, i) { card.classList.toggle('is-active', i === p); });
    strip.style.transform = 'translateX(-' + (p * stepWidth()) + 'px)';
    if (!animate) {
      // eslint-disable-next-line no-unused-expressions
      strip.offsetHeight;
      strip.style.transition = '';
      strip.classList.remove('is-snapping');
    }
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

  function renderInfo(index, silent) {
    var member = members[index];


    counterEl.textContent = pad(index + 1) + ' / ' + pad(count);
    crossfadeText([nameEl, roleEl, bioEl, askEl],
      [member.name, member.role, member.shortBio, member.helpsWith || ''], silent);
    chips.forEach(function (chip) {
      var on = chip.getAttribute('data-dep') === member.department;
      chip.classList.toggle('is-active', on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      // on phones the chips are one row to swipe: keep the current one in view
      if (on && chipsEl.scrollWidth > chipsEl.clientWidth) {
        var left = chip.offsetLeft - (chipsEl.clientWidth - chip.offsetWidth) / 2;
        chipsEl.scrollTo({ left: Math.max(0, left), behavior: silent ? 'auto' : 'smooth' });
      }
    });
    Object.keys(deptCards).forEach(function (dept) {
      deptCards[dept].classList.toggle('is-current', dept === (member.department || ''));
    });

    liveEl.textContent = member.name + ', ' + member.role;
    if (!silent && window.history.replaceState) window.history.replaceState(null, '', '#' + member.id);
  }

  // Clicks that land mid-slide are queued rather than dropped, so pressing
  // Next three times quickly moves three people (up to MAX_QUEUED extra, so a
  // burst of clicks can't leave the strip sliding on for seconds).
  var MAX_QUEUED = 3;
  var queuedSteps = 0;
  var queuedIndex = -1;

  function finishSlide() {
    animating = false;
    if (pos >= count) {
      pos -= count;
      setPosition(pos, false);
    }
    if (queuedIndex >= 0) {
      var target = queuedIndex;
      queuedIndex = -1;
      goTo(target);
    } else if (queuedSteps) {
      var step = queuedSteps > 0 ? 1 : -1;
      queuedSteps -= step;
      move(step);
    }
  }

  function move(step) {
    if (animating) {
      queuedIndex = -1;
      queuedSteps = Math.max(-MAX_QUEUED, Math.min(MAX_QUEUED, queuedSteps + step));
      return;
    }
    animating = true;
    // Going back from the first person: jump to their twin in the second copy,
    // so the strip can slide back on to the last person.
    if (step < 0 && pos === 0) {
      pos = count;
      setPosition(pos, false);
    }
    pos += step;
    activeIndex = pos % count;
    setPosition(pos, true);
    renderInfo(activeIndex, false);
    window.setTimeout(finishSlide, ANIM_MS);
  }

  function next() { move(1); }
  function prev() { move(-1); }

  // Slides forward (wrapping round the end) until `index` is the active card.
  function goTo(index) {
    if (animating) {
      queuedSteps = 0;
      queuedIndex = index;
      return;
    }
    if (index === activeIndex) return;
    animating = true;
    pos = index > pos ? index : index + count;
    activeIndex = index;
    setPosition(pos, true);
    renderInfo(activeIndex, false);
    window.setTimeout(finishSlide, ANIM_MS);
  }

  // "Our departments": a card for each department, in the order its people
  // first appear in team-data.js, listing its people. Choosing a person opens
  // their bio, the same one as "View more". The card for the person showing
  // in the slider is marked (renderInfo).
  var deptList = document.getElementById('team-depts');
  if (deptList) {
    var depts = [];
    var byDept = {};
    members.forEach(function (m) {
      var dept = m.department || '';
      if (!byDept[dept]) {
        byDept[dept] = [];
        depts.push(dept);
      }
      byDept[dept].push(m);
    });
    var add = function (tag, className, text) {
      var node = document.createElement(tag);
      node.className = className;
      if (text != null) node.textContent = text;
      return node;
    };
    depts.forEach(function (dept, i) {
      var people = byDept[dept];
      var item = add('li', 'team-dept');
      var head = add('div', 'team-dept-head');
      head.appendChild(add('span', 'team-dept-num', pad(i + 1)));
      head.appendChild(add('h3', 'team-dept-name', dept));
      head.appendChild(add('span', 'team-dept-count', people.length + (people.length === 1 ? ' person' : ' people')));
      item.appendChild(head);
      var list = add('ul', 'team-dept-people');
      people.forEach(function (m) {
        var btn = add('button', 'team-dept-person');
        btn.type = 'button';
        btn.setAttribute('aria-label', m.name + ', ' + m.role + '. Read more');
        var img = document.createElement('img');
        img.src = window.teamPortrait(m, 'thumb');
        img.alt = '';
        img.width = 52;
        img.height = 52;
        img.loading = 'lazy';
        btn.appendChild(img);
        var text = add('span', 'team-dept-person-text');
        text.appendChild(add('span', 'team-dept-person-name', m.name));
        text.appendChild(add('span', 'team-dept-person-role', m.role));
        btn.appendChild(text);
        btn.addEventListener('click', function () { openModal(m, btn); });
        var li = document.createElement('li');
        li.appendChild(btn);
        list.appendChild(li);
      });
      item.appendChild(list);
      deptList.appendChild(item);
      deptCards[dept] = item;
    });
    deptList.closest('section').hidden = false;
  }

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
    resizeTimer = window.setTimeout(function () { setPosition(pos, false); }, 120);
  });

  // A link like team.html#miki opens on that person, and moving through the
  // team keeps the address on whoever is showing, so it can be copied and sent.
  function indexFromHash() {
    var id = '';
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (e) { /* malformed: ignore */ }
    for (var i = 0; i < count; i++) if (members[i].id === id) return i;
    return -1;
  }
  var linked = indexFromHash();
  pos = activeIndex = Math.max(0, linked);
  setPosition(pos, false);
  renderInfo(activeIndex, true);
  if (linked > -1) {
    var header = document.querySelector('.site-header');
    var top = section.getBoundingClientRect().top + window.pageYOffset - (header ? header.getBoundingClientRect().height : 0);
    window.scrollTo(0, Math.max(0, top));
  }
  window.addEventListener('hashchange', function () {
    var i = indexFromHash();
    if (i > -1) goTo(i);
  });

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
  var hideTimer = null;

  function trapFocus(event) {
    if (event.key === 'Escape') { closeModal(); return; }
    if (event.key !== 'Tab') return;
    // Filtered by visibility, like focusables() above: an element hidden with
    // display:none is still matched by querySelectorAll but cannot take focus,
    // which would break the wrap-around at either end of the modal.
    var focusable = Array.prototype.filter.call(
      modal.querySelectorAll('a[href], button:not([disabled])'),
      function (el) { return el.offsetParent !== null; }
    );
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

  // the bio of `member` (from the department sections), else of whoever the
  // slider is showing; closing it goes back to `trigger`, the button that
  // opened it (a mouse click does not focus a button in every browser)
  function openModal(member, trigger) {
    if (!member || !member.name) member = members[activeIndex];
    modalName.textContent = member.name;
    modalRole.textContent = member.role;
    modalPhoto.src = window.teamPortrait(member, 'photo');
    modalPhoto.alt = member.name;

    if (/^https?:\/\//.test(member.linkedin || '')) {
      modalLinkedin.href = member.linkedin;
      modalLinkedin.hidden = false;
    } else {
      // Drop the href as well as hiding it: the template ships href="#", and
      // with target="_blank" that opened a duplicate of this same page.
      modalLinkedin.removeAttribute('href');
      modalLinkedin.hidden = true;
    }

    modalBio.innerHTML = '';
    (member.fullBio || []).forEach(function (paragraph) {
      var p = document.createElement('p');
      p.textContent = paragraph;
      modalBio.appendChild(p);
    });

    window.clearTimeout(hideTimer);
    lastFocused = trigger || document.activeElement;
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
    hideTimer = window.setTimeout(function () { overlay.hidden = true; }, 260);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  viewMoreBtn.addEventListener('click', function () { openModal(members[activeIndex], viewMoreBtn); });
  modalClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) closeModal();
  });
})();

// The page's CSS zoom: the "laptop fit" in styles.css scales the whole page
// down in narrow laptop windows. Mouse positions arrive in real screen pixels,
// so anything placed at a mouse position divides by this first.
function pageZoom() {
  return parseFloat(window.getComputedStyle(document.documentElement).zoom) || 1;
}

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
  var zoom = pageZoom();
  function onResize() { zoom = pageZoom(); }
  window.addEventListener('resize', onResize);

  function scaleFor() {
    if (isDown) return 0.8;
    if (isHover) return 1.6;
    return 1;
  }

  function tick() {
    curX += (mouseX - curX) * lerpFactor;
    curY += (mouseY - curY) * lerpFactor;
    el.style.transform = 'translate3d(' + curX / zoom + 'px, ' + curY / zoom + 'px, 0) translate(-50%, -50%) scale(' + scaleFor() + ')';
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
      window.removeEventListener('resize', onResize);
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
    '          <p class="next-dest-lead">Next on the route is <strong>' + esc(to.name) + '</strong>, <em>' + esc(to.welcome) + '</em>.</p>',
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
    if (!shown) data.emptyEl.textContent = 'No institution or course in ' + current + ' matches “' + searchInput.value.trim() + '”. Try a shorter or different word, or ask a counsellor what’s available.';
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
// data-consult; data-consult-dept opens it on one department. Progressive enhancement: until at least one person has a
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
  var startTag = null;
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
  var whatsappIcon = '<svg class="wa-logo" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>';
  var phoneIcon = icon('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>', 18, 1.8);
  var mailIcon = icon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', 18, 1.8);
  var checkIcon = icon('<path d="M5 12.5l4.5 4.5L19 7"/>', 16, 2);
  var clockIcon = icon('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', 16, 2);
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
      '    <span class="consult-eyebrow">Free consultation</span>',
      '    <h2 class="consult-title" id="consult-title">Who would you like to talk to?</h2>',
      '    <p class="consult-sub" id="consult-sub">Pick the person who fits what you need. WhatsApp opens with your message already written, and you can edit it before you send.</p>',
      '    <p class="consult-topic" hidden><span>Asking about</span><strong></strong></p>',
      '    <p class="consult-assure">' + checkIcon + '<span>Free initial consultation &middot; no obligation</span></p>',
      '    <p class="consult-assure consult-hours">' + clockIcon + '<span>Office open Mon&ndash;Fri, 8am&ndash;5pm</span></p>',
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
      '    <a class="consult-foot-link" href="tel:' + OFFICE_TEL + '"><span class="consult-foot-icon">' + phoneIcon + '</span><span class="consult-foot-text"><b>Call the office</b><span class="consult-foot-detail">' + OFFICE_TEL_LABEL + '</span></span></a>',
      '    <a class="consult-foot-link" href="mailto:' + OFFICE_MAIL + '?subject=Free%20Consultation%20Request" data-consult-fallback><span class="consult-foot-icon">' + mailIcon + '</span><span class="consult-foot-text"><b>Email us</b><span class="consult-foot-detail">' + OFFICE_MAIL.replace('@', '@<wbr>') + '</span></span></a>',
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

  function photoFor(member) {
    var photo = el('img', 'consult-photo');
    photo.src = window.teamPortrait(member, 'card'); // the framed 5:4 card portrait; the smaller or bigger photo only if it's missing
    photo.alt = '';
    photo.width = 480;
    photo.height = 384;
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

  // One portrait card: photo, name, role, what to ask them about, then
  // WhatsApp and call. `start` marks the person offered to the undecided;
  // `match` someone who looks after the destination being asked about.
  function row(p, index, start, match) {
    var m = p.m;
    var card = el('li', 'consult-card' + (p.number ? '' : ' is-pending') + (start ? ' is-start' : '') + (match ? ' is-match' : ''));
    card.setAttribute('data-dept', m.department || '');
    card.style.setProperty('--i', String(Math.min(index, 10)));
    var figure = el('div', 'consult-card-photo');
    figure.appendChild(photoFor(m));
    card.appendChild(figure);
    var content = el('div', 'consult-card-body');
    card.appendChild(content);
    if (match) content.appendChild(el('p', 'consult-start-tag consult-match-tag', 'Best for ' + topic));
    else if (start) content.appendChild(el('p', 'consult-start-tag', 'Not sure? Start here'));
    content.appendChild(identity(m));
    if (m.helpsWith) content.appendChild(el('p', 'consult-help', m.helpsWith));

    var actions = el('div', 'consult-actions');
    if (p.number) {
      actions.appendChild(whatsappLink(p, 'consult-wa', 'WhatsApp'));
      actions.appendChild(callLink(p));
    } else {
      actions.appendChild(el('span', 'consult-pending', 'Number coming soon'));
    }
    content.appendChild(actions);
    return card;
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
    // the "start here" tag belongs to the unfiltered view
    if (startTag) startTag.hidden = !!activeDept;

    var total = activeDept ? shown : cards.length;
    countEl.textContent = '';
    countEl.appendChild(el('span', 'consult-count-num', String(total)));
    countEl.appendChild(el('span', 'consult-count-label', activeDept
      ? (total === 1 ? ' person in ' : ' people in ') + activeDept
      : ' people to talk to'));
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

    // Asked from a destination page: whoever lists that country in their
    // `destinations` goes first, tagged "Best for <country>". Then the person
    // flagged `startHere` (with a number), tagged for visitors who don't know
    // who to ask; everyone else keeps the Team page order.
    var matches = topic ? list.filter(function (p) { return (p.m.destinations || []).indexOf(topic) > -1; }) : [];
    var start = null;
    list.forEach(function (p) { if (!start && p.m.startHere && p.number && matches.indexOf(p) < 0) start = p; });
    var lead = matches.concat(start ? [start] : []);
    var ordered = lead.concat(list.filter(function (p) { return lead.indexOf(p) < 0; }));

    grid = el('ul', 'consult-grid');
    ordered.forEach(function (p, i) { grid.appendChild(row(p, i, p === start, matches.indexOf(p) > -1)); });
    body.appendChild(grid);
    startTag = grid.querySelector('.is-start .consult-start-tag');

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

  // A button with data-consult-dept="Visa" opens on that department's people
  // (the Services page's "Ask about visas"), when its filter is on show.
  function chipFor(trigger) {
    var dept = trigger.getAttribute('data-consult-dept');
    if (!dept || filtersWrap.hidden) return null;
    var chips = filters.querySelectorAll('.consult-chip');
    for (var i = 0; i < chips.length; i++) {
      if (chips[i].getAttribute('data-dept') === dept) return chips[i];
    }
    return null;
  }

  function open(trigger) {
    if (!overlay) buildShell();
    topic = topicFor(trigger);
    render();
    var chip = chipFor(trigger);
    if (chip) {
      activeDept = chip.getAttribute('data-dept');
      applyDepartment();
    }

    window.clearTimeout(hideTimer);
    lastFocused = trigger;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    // bring its filter into view: scroll only the filter row (scrollIntoView
    // would scroll the page behind the chooser too)
    if (chip) {
      var row = filters.getBoundingClientRect();
      var box = chip.getBoundingClientRect();
      filters.scrollLeft += (box.left + box.width / 2) - (row.left + row.width / 2);
    }
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

// Home page: the testimonials: a card for each student, side by side in a row
// (three across on a laptop, two on a tablet, one on a phone). When there are
// more than fit, the row scrolls sideways (a swipe, a trackpad, or the arrow
// keys once it has focus) and the dots below appear, one for each place it
// can stop; the current one is longer. It also plays gently by itself, with a
// pause button, holding whenever the visitor is reading or using it (see
// "motion" below). The cards rise in the first time the section comes into
// view, and the average rating counts up.
//
// The testimonials come from the Supabase database (js/supabase-config.js),
// where they are added and switched on in the admin page (admin/index.html):
// only the ones switched on are shown, in the order set there. When there are
// none, or the database can't be reached, the section stays hidden, except on
// a developer's own copy (a file, or localhost) or with ?testimonialsPreview
// in the address, where the samples in js/testimonials-data.js show instead,
// tagged as samples, so the layout can be reviewed. An incomplete entry (no
// quote or no name) is skipped rather than shown half-empty.
//
// A student who gave a rating gets a rating box on their card: their own
// score, beside the average of the ratings on show once there are two or more.
(function () {
  'use strict';

  var section = document.getElementById('testimonials');
  var row = document.getElementById('testimonial-row');
  var dotsBox = document.getElementById('testimonial-dots');
  if (!section || !row || !dotsBox) return;

  var here = window.location;
  var ownCopy = here.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(here.hostname);
  var allowSamples = ownCopy || /[?&]testimonialsPreview(=|&|$)/.test(here.search);
  var cfg = window.SUPABASE_CONFIG;
  if (!window.TestimonialCard) return;

  // the switched-on testimonials, in their order; null if the database can't be
  // reached (or hasn't answered within 8 seconds)
  function fromDatabase() {
    if (!cfg || !cfg.url || !cfg.key || !window.fetch) return Promise.resolve(null);
    var url = cfg.url + '/rest/v1/testimonials?select=name,detail,quote,story,rating,photo_path' +
      '&published=eq.true&order=position.asc,created_at.asc';
    var options = { headers: { apikey: cfg.key, Authorization: 'Bearer ' + cfg.key } };
    if (window.AbortController) {
      var stop = new AbortController();
      window.setTimeout(function () { stop.abort(); }, 8000);
      options.signal = stop.signal;
    }
    return window.fetch(url, options)
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (rows) {
        return rows.map(function (r) {
          return {
            name: r.name,
            detail: r.detail,
            quote: r.quote,
            story: r.story,
            rating: r.rating,
            photo: r.photo_path ? cfg.url + '/storage/v1/object/public/' + cfg.photoBucket + '/' + encodeURIComponent(r.photo_path) : ''
          };
        });
      })
      .catch(function () { return null; });
  }

  // everything in js/testimonials-data.js is a sample, whatever it says
  function samples() {
    return (window.TESTIMONIALS || []).map(function (t) {
      var copy = {};
      for (var k in t) if (Object.prototype.hasOwnProperty.call(t, k)) copy[k] = t[k];
      copy.sample = true;
      return copy;
    });
  }

  fromDatabase().then(function (real) {
    var list = real && real.length ? real : (allowSamples ? samples() : []);
    var people = list.filter(function (t) { return t && t.quote && t.name; });
    if (people.length) render(people);
  });

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // the cards themselves are built by js/testimonial-card.js
  function render(people) {
    var average = window.TestimonialCard.average(people);
    var sampleCount = 0;
    people.forEach(function (t) {
      if (t.sample) sampleCount++;
      row.appendChild(window.TestimonialCard.build(t, average));
    });

    if (sampleCount) {
      var note = el('p', 'consult-preview testi-preview', 'Sample quotes are showing because no testimonials are switched on yet. Visitors on the live site never see samples. Add real ones on the admin page (admin/index.html).');
      row.parentNode.insertBefore(note, row);
    }
    section.hidden = false;

    // The places the row can stop, with a dot for each: the start of every
    // card, but never past the end of the row. So three cards on a laptop, all
    // in view, give one place and no dots; five give three.
    var cards = Array.prototype.slice.call(row.children);
    var stops = [];
    var dots = [];
    var current = -1;
    var still = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    function measure() {
      var pad = parseFloat(getComputedStyle(row).paddingLeft) || 0;
      var end = row.scrollWidth - row.clientWidth;
      var found = [];
      cards.forEach(function (card, i) {
        var at = Math.max(0, Math.min(Math.round(card.offsetLeft - pad), end));
        if (!found.length || at - found[found.length - 1].at > 2) found.push({ at: at, name: people[i].name });
      });
      stops = found;
      if (dots.length !== stops.length) {
        dotsBox.textContent = '';
        dots = stops.map(function (stop, i) {
          var dot = el('button', 'testi-dot');
          dot.type = 'button';
          dot.addEventListener('click', function () {
            row.scrollTo({ left: stops[i].at, behavior: still && still.matches ? 'auto' : 'smooth' });
          });
          dotsBox.appendChild(dot);
          return dot;
        });
        current = -1;
      }
      stops.forEach(function (stop, i) { dots[i].setAttribute('aria-label', 'Show ' + stop.name); });
      var scrolls = stops.length > 1;
      dotsBox.hidden = !scrolls;
      // the row takes Tab (to scroll with the arrow keys) only when it can scroll
      if (scrolls) row.setAttribute('tabindex', '0');
      else row.removeAttribute('tabindex');
      update();
      syncPlay();
    }

    // the current dot: the place nearest to where the row is now; and which
    // edges have cards past them, to fade (styles.css)
    function update() {
      var x = row.scrollLeft;
      var end = row.scrollWidth - row.clientWidth;
      row.classList.toggle('is-past-start', x > 2);
      row.classList.toggle('is-before-end', x < end - 2);
      var best = 0;
      stops.forEach(function (stop, i) {
        if (Math.abs(stop.at - x) < Math.abs(stops[best].at - x)) best = i;
      });
      if (best === current) return;
      if (dots[current]) {
        dots[current].classList.remove('is-active');
        dots[current].removeAttribute('aria-current');
      }
      dots[best].classList.add('is-active');
      dots[best].setAttribute('aria-current', 'true');
      current = best;
    }

    var ticking = false;
    row.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        update();
      });
    }, { passive: true });

    // ---- motion: the cards rise in, the average counts up, and the row plays ----
    // Auto-play: while the section is in view, the current dot fills up over
    // 6 seconds and the row then moves on one place, looping back to the start.
    // The fill (styles.css) is the clock, so holding the fill holds the play.
    // It holds while the mouse is over the cards or dots or they have the
    // focus, stops for good once the visitor moves the row themselves (a click,
    // drag, swipe, key, sideways wheel or dot), and the button pauses and
    // plays it. It only plays when there are more cards than fit, and never
    // for visitors who ask for reduced motion.
    var playBtn = document.getElementById('testimonial-play');
    var playing = true;
    var hovering = false;
    var focused = false;
    var inView = !window.IntersectionObserver;
    var canPlay = false;
    var reduced = function () { return !!(still && still.matches); };

    function syncPlay() {
      canPlay = !!playBtn && stops.length > 1 && !reduced();
      if (playBtn) {
        playBtn.hidden = !canPlay;
        playBtn.classList.toggle('is-stopped', !playing);
        playBtn.setAttribute('aria-label', playing ? 'Pause the testimonials' : 'Play the testimonials');
      }
      dotsBox.classList.toggle('is-playing', canPlay && playing);
      dotsBox.classList.toggle('is-held', hovering || focused || !inView);
    }

    function stopPlaying() {
      if (!playing) return;
      playing = false;
      syncPlay();
    }

    dotsBox.addEventListener('animationend', function (event) {
      if (event.animationName !== 'testi-fill' || !canPlay || !playing || !stops.length) return;
      row.scrollTo({ left: stops[(current + 1) % stops.length].at, behavior: 'smooth' });
    });
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        playing = !playing;
        syncPlay();
      });
    }
    row.addEventListener('pointerdown', stopPlaying);
    row.addEventListener('keydown', stopPlaying);
    row.addEventListener('wheel', function (event) {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) stopPlaying();
    }, { passive: true });
    dotsBox.addEventListener('click', stopPlaying);
    [row, dotsBox].forEach(function (area) {
      area.addEventListener('mouseenter', function () { hovering = true; syncPlay(); });
      area.addEventListener('mouseleave', function () { hovering = false; syncPlay(); });
      area.addEventListener('focusin', function () { focused = true; syncPlay(); });
      area.addEventListener('focusout', function (event) {
        var to = event.relatedTarget;
        focused = !!(to && (row.contains(to) || dotsBox.contains(to)));
        syncPlay();
      });
    });
    if (still) {
      if (still.addEventListener) still.addEventListener('change', syncPlay);
      else if (still.addListener) still.addListener(syncPlay);
    }

    // the average rating counts up from 0 to itself
    function countUp() {
      Array.prototype.forEach.call(row.querySelectorAll('.testi-score-avg .testi-score-num'), function (num) {
        var text = num.firstChild;
        if (!text || text.nodeType !== 3) return;
        var target = text.nodeValue;
        var value = parseFloat(target);
        if (!(value > 0)) return;
        var decimals = (target.split('.')[1] || '').length;
        var start = null;
        text.nodeValue = (0).toFixed(decimals);
        window.requestAnimationFrame(function frame(now) {
          if (start === null) start = now;
          var k = Math.min(1, (now - start) / 1200);
          text.nodeValue = k < 1 ? (value * (1 - Math.pow(1 - k, 3))).toFixed(decimals) : target;
          if (k < 1) window.requestAnimationFrame(frame);
        });
      });
    }

    // the first time the section comes into view: the cards rise in, one after
    // another, and the average counts up; being in view also lets it play
    if (window.IntersectionObserver) {
      if (!reduced()) {
        row.classList.add('is-waiting');
        cards.forEach(function (card, i) { card.style.setProperty('--i', Math.min(i, 5)); });
      }
      var arrived = false;
      new IntersectionObserver(function (entries) {
        inView = entries[entries.length - 1].isIntersecting;
        if (inView && !arrived) {
          arrived = true;
          row.classList.remove('is-waiting');
          if (!reduced()) {
            row.classList.add('is-in');
            countUp();
          }
        }
        syncPlay();
      }, { threshold: 0.25 }).observe(row);
    }

    measure();
    if (window.ResizeObserver) new ResizeObserver(measure).observe(row);
    else window.addEventListener('resize', measure);
  }
})();

// "Check your eligibility for Australia" ([data-ai-checker], on the Australia
// page): the AI eligibility checker, built as its own app
// (the Studies-and-Awards-AI project). Until it is live the button opens a
// short "coming soon" note with a way to book a consultation instead. Once it
// is live, put its address in AI_CHECKER_URL: the "Coming soon" tag goes and
// the button takes visitors straight there.
(function () {
  'use strict';

  var AI_CHECKER_URL = '';

  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-ai-checker]'));
  if (!buttons.length) return;

  if (AI_CHECKER_URL) {
    buttons.forEach(function (button) {
      var tag = button.querySelector('.ai-check-tag');
      if (tag) tag.hidden = true;
      button.addEventListener('click', function () { window.location.href = AI_CHECKER_URL; });
    });
    return;
  }

  var note = null;
  function build() {
    note = document.createElement('dialog');
    note.className = 'ai-soon';
    note.setAttribute('aria-labelledby', 'ai-soon-title');
    note.innerHTML =
      '<button type="button" class="ai-soon-close" aria-label="Close">&times;</button>' +
      '<span class="ai-check-tag">Coming soon</span>' +
      '<h2 id="ai-soon-title">Check your eligibility for Australia</h2>' +
      '<p>We&rsquo;re building an online checker that compares your KCSE results with the entry requirements of Australian universities and colleges, and shows the courses you could apply for.</p>' +
      '<p>Until it&rsquo;s ready, our counsellors will check this with you at a free consultation.</p>' +
      '<a href="mailto:admissions@studiesandawardsltd.com?subject=Free%20Consultation%20Request%20-%20Australia" class="btn btn-primary">Book a free consultation</a>';
    note.querySelector('.ai-soon-close').addEventListener('click', function () { note.close(); });
    // the consultation chooser opens over the page, so the note steps aside first
    note.querySelector('.btn').addEventListener('click', function () { note.close(); });
    document.body.appendChild(note);
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      if (!note) build();
      if (note.showModal) note.showModal();
      else window.location.href = note.querySelector('.btn').href;
    });
  });
})();

// Home page: "Why fly with us" pass. Clicking "Book a free consultation" flies
// the plane from EDL to UNI first, then replays the click so the consultation
// chooser (or the email fallback) handles it as usual. When the chooser
// closes, the plane turns round and flies back to EDL for next time.
(function () {
  'use strict';

  var pass = document.querySelector('.promise-pass');
  var go = pass && pass.querySelector('.promise-pass-go');
  if (!go) return;

  var FLIGHT_MS = 600;
  var TURN_MS = 150;
  var NO_CHOOSER_RETURN_MS = 1500;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var replaying = false;
  var busy = false;

  function flyBack() {
    pass.classList.add('is-returning');
    window.setTimeout(function () {
      pass.classList.remove('is-flown');
      window.setTimeout(function () {
        pass.classList.remove('is-returning');
        busy = false;
      }, FLIGHT_MS);
    }, TURN_MS);
  }

  function returnWhenClosed() {
    var overlay = document.getElementById('consult-overlay');
    if (!overlay || overlay.hidden || !window.MutationObserver) {
      window.setTimeout(flyBack, NO_CHOOSER_RETURN_MS);
      return;
    }
    var observer = new MutationObserver(function () {
      if (overlay.classList.contains('is-open')) return;
      observer.disconnect();
      flyBack();
    });
    observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
  }

  go.addEventListener('click', function (event) {
    if (replaying || reduceMotion) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    busy = true;
    pass.classList.add('is-flown');
    window.setTimeout(function () {
      replaying = true;
      go.click();
      replaying = false;
      returnWhenClosed();
    }, FLIGHT_MS);
  });
})();

// About page: the counsellor count in the hero, and each department's
// headcount in the "Inside Studies & Awards" mosaic, both from
// js/team-data.js so the numbers never drift from the real team. (The tile
// sizes, one square per person, are laid out in styles.css: a department
// that grows or shrinks needs its grid area changed there too.)
(function () {
  'use strict';

  var members = window.TEAM_MEMBERS;
  if (!members || !members.length) return;

  var countEl = document.getElementById('about-team-count');
  if (countEl) countEl.textContent = members.length;

  var counts = {};
  members.forEach(function (m) {
    counts[m.department] = (counts[m.department] || 0) + 1;
  });

  Array.prototype.forEach.call(document.querySelectorAll('.dept-tile[data-dept]'), function (tile) {
    var n = counts[tile.getAttribute('data-dept')];
    var el = tile.querySelector('.dept-tile-count');
    if (n && el) el.textContent = n + (n === 1 ? ' person' : ' people');
  });
})();

// Find Us page: the lift. Pressing M1 on the lift's panel opens the doors onto
// our reception and the text beside the lift moves on to the next floor; G
// takes it back down.
(function () {
  'use strict';

  var hero = document.querySelector('[data-lift]');
  if (!hero) return;

  var FLOORS = {
    G: {
      hint: 'PRESS M1 TO GO UP',
      title: 'Ground floor: come to Daima Towers',
      text: 'Look for the tall tower with the curved glass front. The main entrance is under the red “The Eldoret Daima Towers” sign.'
    },
    M1: {
      hint: 'YOU’VE ARRIVED',
      title: 'Mezzanine 1: say hello at reception',
      text: 'Tell us you’re here about studying abroad and we’ll introduce you to the right counsellor.'
    }
  };
  var hint = hero.querySelector('[data-lift-hint]');
  var title = hero.querySelector('[data-lift-title]');
  var text = hero.querySelector('[data-lift-text]');
  var floorEl = hero.querySelector('[data-lift-floor]');
  var buttons = document.querySelectorAll('[data-floor-go]');

  // Hidden copies of every floor's text, laid under the live one (see
  // .lift-now in styles.css), keep the block as tall as the longest text.
  var box = hero.querySelector('.lift-now');
  Object.keys(FLOORS).forEach(function (key) {
    var copy = document.createElement('div');
    copy.className = 'lift-now-state lift-now-sizer';
    copy.setAttribute('aria-hidden', 'true');
    ['label', 'title', 'text'].forEach(function (part) {
      var el = document.createElement(part === 'title' ? 'strong' : 'span');
      el.className = 'lift-now-' + part;
      el.textContent = FLOORS[key][part === 'label' ? 'hint' : part];
      copy.appendChild(el);
    });
    box.appendChild(copy);
  });

  function goTo(floor) {
    var info = FLOORS[floor];
    hero.setAttribute('data-floor', floor);
    floorEl.textContent = floor;
    hint.textContent = info.hint;
    title.textContent = info.title;
    text.textContent = info.text;
    hero.querySelectorAll('.lift-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-floor-go') === floor ? 'true' : 'false');
    });
  }

  var autoTimer = null, touched = false;
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      touched = true;
      window.clearTimeout(autoTimer);
      goTo(b.getAttribute('data-floor-go'));
    });
  });

  // A second after the lift comes into view, it goes up to Mezzanine 1 and
  // the doors open by themselves (unless the visitor has already pressed a
  // button). It waits until the lift is on screen, so on a phone, where the lift
  // is below the text, it doesn't open before anyone can see it. The text change
  // isn't announced this time: a screen reader shouldn't speak up unprompted.
  var AUTO_OPEN_MS = 1000;
  var live = hero.querySelector('.lift-now [aria-live]');
  function autoOpen() {
    if (touched) return;
    if (live) live.setAttribute('aria-live', 'off');
    goTo('M1');
    if (live) window.setTimeout(function () { live.setAttribute('aria-live', 'polite'); }, 1000);
  }
  var lift = hero.querySelector('.lift-car');
  if ('IntersectionObserver' in window && lift) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (!autoTimer && !touched) autoTimer = window.setTimeout(autoOpen, AUTO_OPEN_MS);
          seen.disconnect();
        }
      });
    }, { threshold: 0.6 });
    seen.observe(lift);
  } else {
    autoTimer = window.setTimeout(autoOpen, AUTO_OPEN_MS);
  }
})();

// Find Us page: the photo carousel (building, entrance, reception).
(function () {
  'use strict';

  var box = document.querySelector('[data-loc-carousel]');
  if (!box) return;
  var slides = box.querySelectorAll('.loc-slide');
  var dots = box.querySelectorAll('.loc-dot');
  var current = 0;

  function show(i) {
    current = (i + slides.length) % slides.length;
    slides.forEach(function (sl, k) {
      var on = k === current;
      sl.classList.toggle('is-active', on);
      if (on) { sl.removeAttribute('aria-hidden'); sl.inert = false; }
      else { sl.setAttribute('aria-hidden', 'true'); sl.inert = true; }
    });
    dots.forEach(function (d, k) {
      d.classList.toggle('is-active', k === current);
      if (k === current) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
  }

  // Rotates by itself every few seconds, round and round, including while the
  // pointer is over it (clicking through the photos then leaving the mouse
  // there looked like it had stopped). It holds while keyboard focus is inside
  // it and while it's off screen; the pause button stops it. Visitors who ask
  // their device for reduced motion get it paused from the start.
  var ROTATE_MS = 5000;
  var toggle = box.querySelector('[data-photos-toggle]');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var playing = !reduceMotion, focused = false, inView = false, timer = null;

  function schedule() {
    window.clearTimeout(timer);
    if (playing && inView && !focused && !document.hidden) {
      timer = window.setTimeout(function () { show(current + 1); schedule(); }, ROTATE_MS);
    }
  }
  function setPlaying(on) {
    playing = on;
    box.classList.toggle('is-paused', !on);
    if (toggle) toggle.setAttribute('aria-label', on ? 'Pause the photos' : 'Play the photos');
    schedule();
  }
  setPlaying(playing);
  if (toggle) toggle.addEventListener('click', function () { setPlaying(!playing); });

  // only keyboard focus holds it (a mouse click focuses the button too), and never
  // the pause/play button itself, or pressing Play would leave it held
  box.addEventListener('focusin', function (event) {
    focused = event.target !== toggle && event.target.matches(':focus-visible');
    schedule();
  });
  box.addEventListener('focusout', function (event) { if (!box.contains(event.relatedTarget)) { focused = false; schedule(); } });
  document.addEventListener('visibilitychange', schedule);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; schedule(); }, { threshold: 0.4 }).observe(box);
  } else {
    inView = true; schedule();
  }

  box.addEventListener('click', function (event) {
    var stepBtn = event.target.closest('[data-slide-step]');
    if (stepBtn) { show(current + parseInt(stepBtn.getAttribute('data-slide-step'), 10)); schedule(); return; }
    var dot = event.target.closest('[data-slide-go]');
    if (dot) { show(parseInt(dot.getAttribute('data-slide-go'), 10)); schedule(); }
  });
  box.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') { show(current - 1); schedule(); }
    else if (event.key === 'ArrowRight') { show(current + 1); schedule(); }
  });

  // swipe on touch screens (vertical scrolling still passes through: touch-action: pan-y)
  var startX = null, startY = 0;
  box.addEventListener('pointerdown', function (event) {
    if (event.pointerType === 'mouse' || event.target.closest('button')) return;
    startX = event.clientX; startY = event.clientY;
  });
  box.addEventListener('pointerup', function (event) {
    if (startX === null) return;
    var dx = event.clientX - startX, dy = event.clientY - startY;
    startX = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { show(current + (dx < 0 ? 1 : -1)); schedule(); }
  });
  box.addEventListener('pointercancel', function () { startX = null; });
})();

// Route maps (about and destinations pages): hovering or focusing a country,
// in a list, on a card or on its tag on the map, shows its route from Eldoret
// and fades the rest. Buttons also keep their route shown when clicked or
// tapped, until clicked again; Escape clears it. Links marked
// data-route-preview (the About page's countries) open their page on a click,
// but on a touch screen, which can't hover, the first tap shows the route and
// a second tap on the same country opens it.
//   [data-route-scope]      wraps the map and everything that controls it
//   [data-route-line=CODE]  one route drawn on the map
//   [data-route=CODE]       anything that shows that route
(function () {
  'use strict';

  Array.prototype.forEach.call(document.querySelectorAll('[data-route-scope]'), function (scope) {
    var controls = scope.querySelectorAll('[data-route]');
    var lines = scope.querySelectorAll('[data-route-line]');
    var hovered = null, pinned = null;

    function render() {
      var active = hovered || pinned;
      if (active) scope.setAttribute('data-route-active', active);
      else scope.removeAttribute('data-route-active');
      Array.prototype.forEach.call(lines, function (el) {
        el.classList.toggle('is-active', el.getAttribute('data-route-line') === active);
      });
      Array.prototype.forEach.call(controls, function (el) {
        var code = el.getAttribute('data-route');
        el.classList.toggle('is-active', code === active);
        if (el.tagName === 'BUTTON') el.setAttribute('aria-pressed', code === pinned ? 'true' : 'false');
      });
    }

    Array.prototype.forEach.call(controls, function (el) {
      var code = el.getAttribute('data-route');
      el.addEventListener('mouseenter', function () { hovered = code; render(); });
      el.addEventListener('mouseleave', function () { if (hovered === code) { hovered = null; render(); } });
      el.addEventListener('focus', function () { if (el.matches(':focus-visible')) { hovered = code; render(); } });
      el.addEventListener('blur', function () { if (hovered === code) { hovered = null; render(); } });
      if (el.hasAttribute('data-route-preview')) {
        var touch = false;
        el.addEventListener('pointerdown', function (event) { touch = event.pointerType === 'touch' || event.pointerType === 'pen'; });
        el.addEventListener('click', function (event) {
          if (!touch || pinned === code) return; // mouse, keyboard, or a second tap: follow the link
          event.preventDefault();
          pinned = code;
          hovered = null;
          render();
        });
        return;
      }
      if (el.tagName !== 'BUTTON') return;
      el.addEventListener('click', function () {
        pinned = pinned === code ? null : code;
        // a tap also fires mouseenter/focus; let the pinned state decide what shows
        hovered = null;
        render();
      });
    });

    // Pointing at a drawn route shows it too (and lights up its card or list
    // entry). Each line has a wide invisible copy to catch the pointer; where
    // routes run close together (Sydney and Auckland, the three European ones)
    // the one nearest the pointer wins, not whichever happens to be drawn on top.
    var svg = scope.querySelector('.map-lines');
    if (svg && lines.length) {
      var samples = Array.prototype.map.call(lines, function (line) {
        var path = line.querySelector('path:not(.map-line-hit)');
        var len = path.getTotalLength(), pts = [];
        for (var i = 0; i <= 60; i++) pts.push(path.getPointAtLength(len * i / 60));
        return { code: line.getAttribute('data-route-line'), pts: pts };
      });
      var nearest = function (event) {
        var m = svg.getScreenCTM(); if (!m) return null;
        var pt = svg.createSVGPoint(); pt.x = event.clientX; pt.y = event.clientY;
        var p = pt.matrixTransform(m.inverse()), best = null, bestD = Infinity;
        samples.forEach(function (s) {
          s.pts.forEach(function (q) { var d = (q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y); if (d < bestD) { bestD = d; best = s.code; } });
        });
        return best;
      };
      svg.addEventListener('pointermove', function (event) {
        if (!event.target.classList.contains('map-line-hit')) return;
        var code = nearest(event);
        if (code && code !== hovered) { hovered = code; render(); }
      });
      svg.addEventListener('pointerout', function (event) {
        var to = event.relatedTarget;
        if (event.target.classList.contains('map-line-hit') && !(to && to.classList && to.classList.contains('map-line-hit'))) {
          hovered = null; render();
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && (pinned || hovered)) { pinned = hovered = null; render(); }
    });
  });
})();

// Services page: the people who look after each step. Each list names them by
// id (data-people="rahab dennis") and they're filled in from js/team-data.js,
// so a new photo, name or role there shows here too; each one links to their
// card on the Team page. Someone missing from the team data is left out.
(function () {
  'use strict';

  var lists = document.querySelectorAll('.svc-people[data-people]');
  var members = window.TEAM_MEMBERS;
  if (!lists.length || !members) return;

  var byId = {};
  members.forEach(function (m) { byId[m.id] = m; });

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  Array.prototype.forEach.call(lists, function (list) {
    list.getAttribute('data-people').split(/\s+/).forEach(function (id) {
      var m = byId[id];
      if (!m) return;
      var link = el('a', 'svc-person');
      link.href = 'team.html#' + encodeURIComponent(m.id);
      var img = el('img');
      img.src = window.teamPortrait ? window.teamPortrait(m, 'thumb') : m.thumb;
      img.alt = '';
      img.width = 48;
      img.height = 48;
      img.loading = 'lazy';
      img.decoding = 'async';
      link.appendChild(img);
      var text = el('span', 'svc-person-text');
      text.appendChild(el('span', 'svc-person-name', m.name));
      text.appendChild(el('span', 'svc-person-role', m.role || m.department));
      link.appendChild(text);
      var item = el('li');
      item.appendChild(link);
      list.appendChild(item);
    });
  });
})();

// Services page: the motion (the look is in styles.css, "services: the
// motion"). As the visitor scrolls, a gold line fills down the steps' line
// to a reading line 60% of the way down the window, with a small document
// riding its tip: their file moving from one department to the next. Each
// dot the line reaches turns gold with a tick, with one soft ring when it's
// reached on the way down; scrolling back up undoes them. Each step eases in
// the first time it comes on screen, a dashed arc round step 2 shows the way
// round it for students who have already sat IELTS elsewhere, the six steps at the top appear one
// after another, and a step reached from a link on the page glows for a
// moment. With reduced motion it shows the finished picture (the whole line
// gold, every dot ticked) and nothing moves; without this script the steps
// simply show as they are.
(function () {
  'use strict';

  var list = document.querySelector('.svc-steps');
  if (!list) return;
  var steps = Array.prototype.slice.call(list.querySelectorAll('.svc-step'));
  var dots = steps.map(function (step) { return step.querySelector('.svc-step-dot'); });
  if (steps.length < 2 || dots.indexOf(null) > -1) return;

  var still = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() { return !!(still && still.matches); }

  var READING_LINE = 0.6; // of the window's height
  var SVG = 'http://www.w3.org/2000/svg';
  var last = steps.length - 1;

  var fill = document.createElement('span');
  fill.className = 'svc-fill';
  fill.setAttribute('aria-hidden', 'true');
  var file = document.createElement('span');
  file.className = 'svc-file';
  file.setAttribute('aria-hidden', 'true');
  file.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';
  list.appendChild(fill);
  list.appendChild(file);
  list.classList.add('is-live');

  // the arc round the step marked has-shortcut (language classes, which
  // students who have already sat IELTS elsewhere go round), from the dot
  // before it into the dot after
  var shortcut = -1;
  steps.forEach(function (step, i) { if (shortcut < 0 && step.classList.contains('has-shortcut') && i > 0 && i < last) shortcut = i; });
  var skip = null;
  var arc = null;
  var head = null;
  if (shortcut > -1) {
    skip = document.createElementNS(SVG, 'svg');
    skip.setAttribute('class', 'svc-skip');
    skip.setAttribute('aria-hidden', 'true');
    arc = document.createElementNS(SVG, 'path');
    arc.setAttribute('class', 'svc-skip-arc');
    head = document.createElementNS(SVG, 'path');
    skip.appendChild(arc);
    skip.appendChild(head);
    list.appendChild(skip);
  }

  // where things are, in the list's own CSS pixels (the laptop fit zooms
  // the page, and positions on screen come back zoomed)
  var centres = [];
  var lineX = 0;
  var radius = 0;
  var room = 0; // from the window's left edge to the line

  function measure() {
    var z = pageZoom();
    var box = list.getBoundingClientRect();
    centres = dots.map(function (dot) {
      var r = dot.getBoundingClientRect();
      return (r.top + r.height / 2 - box.top) / z;
    });
    var first = dots[0].getBoundingClientRect();
    lineX = (first.left + first.width / 2 - box.left) / z;
    radius = first.width / 2 / z;
    room = (first.left + first.width / 2) / z;
    fill.style.left = lineX + 'px';
    fill.style.top = centres[0] + 'px';
    file.style.left = lineX + 'px';
    if (skip) drawSkip();
  }

  // the arc bows out to the left of the line, as far as the window allows
  function drawSkip() {
    var bulge = Math.max(16, Math.min(Math.round(radius * 2), Math.floor(room - 8)));
    var top = centres[shortcut - 1] + radius + 6;
    var bottom = centres[shortcut + 1] - radius - 6;
    var height = Math.max(0, bottom - top);
    var width = bulge + 8;
    var x = width - 1; // the line, at the svg's right edge
    skip.style.left = (lineX - x) + 'px';
    skip.style.top = top + 'px';
    skip.setAttribute('width', width);
    skip.setAttribute('height', height);
    skip.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    // control points level with the ends make a round bow whose widest
    // point, halfway down, is `bulge` from the line
    var cx = x - bulge * 4 / 3;
    arc.setAttribute('d', 'M' + x + ' 0C' + cx + ' 0 ' + cx + ' ' + height + ' ' + x + ' ' + height);
    // the arrowhead, pointing back in to the line just above the next dot
    head.setAttribute('d', 'M' + (x - 7) + ' ' + (height - 5) + 'L' + x + ' ' + height + 'L' + (x - 7) + ' ' + (height + 5));
  }

  function pulse(dot) {
    dot.classList.remove('is-pulse');
    void dot.offsetWidth; // restart the ring if it's still going
    dot.classList.add('is-pulse');
  }
  dots.forEach(function (dot) {
    dot.addEventListener('animationend', function (e) {
      if (e.animationName === 'svc-pulse') dot.classList.remove('is-pulse');
    });
  });

  var lastTip = null;
  var ticking = false;

  function update() {
    ticking = false;
    var z = pageZoom();
    var finished = reduced();
    var tip = finished ? centres[last] : (window.innerHeight * READING_LINE - list.getBoundingClientRect().top) / z;
    var shownTip = Math.max(centres[0], Math.min(centres[last], tip));
    fill.style.height = (shownTip - centres[0]) + 'px';
    file.style.top = shownTip + 'px';
    // the file shows on the way between dots, slipping into each one it passes
    var inDot = centres.some(function (c) { return Math.abs(shownTip - c) < radius + 8; });
    file.classList.toggle('is-shown', !finished && !inDot && tip > centres[0] && tip < centres[last]);
    var goingDown = lastTip !== null && tip > lastTip;
    steps.forEach(function (step, i) {
      var done = tip >= centres[i] - 0.5;
      if (done === step.classList.contains('is-done')) return;
      step.classList.toggle('is-done', done);
      if (done && goingDown && !finished) pulse(dots[i]);
    });
    lastTip = tip;
  }

  function later() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }

  measure();
  update();
  window.addEventListener('scroll', later, { passive: true });
  window.addEventListener('resize', function () { measure(); later(); });
  // the steps change height as fonts and photos arrive
  if (window.ResizeObserver) new ResizeObserver(function () { measure(); later(); }).observe(list);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); later(); });
  if (still) {
    var onChange = function () { measure(); update(); if (skip && reduced()) skip.classList.add('is-drawn'); };
    if (still.addEventListener) still.addEventListener('change', onChange);
    else if (still.addListener) still.addListener(onChange);
  }

  // each step eases in the first time it comes on screen; the arc draws as
  // its step comes into view
  if (window.IntersectionObserver && !reduced()) {
    steps.forEach(function (step) {
      step.classList.add('is-waiting');
      Array.prototype.forEach.call(step.querySelectorAll('.svc-people li'), function (li, i) {
        li.style.setProperty('--i', String(Math.min(i, 6)));
      });
    });
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var step = entry.target;
        seen.unobserve(step);
        step.classList.remove('is-waiting');
        step.classList.add('is-in');
        if (skip && step === steps[shortcut]) skip.classList.add('is-drawn');
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    steps.forEach(function (step) { seen.observe(step); });
  } else if (skip) {
    skip.classList.add('is-drawn');
  }

  // the six steps at the top appear one after another
  var glance = document.querySelector('.svc-glance');
  if (glance && !reduced()) {
    Array.prototype.forEach.call(glance.querySelectorAll('li'), function (li, i) {
      li.style.setProperty('--i', String(i));
    });
    glance.classList.add('is-in');
  }

  // a step reached from a link on the page (the glance, "Go straight to step 3")
  // glows for a moment once the page has finished gliding to it
  function arrive(step) {
    var y = null;
    var calm = 0;
    var waited = 0;
    function check() {
      var now = window.pageYOffset;
      calm = now === y ? calm + 1 : 0;
      y = now;
      if ((calm < 6 && waited++ < 120)) { window.requestAnimationFrame(check); return; }
      step.classList.remove('is-arrived');
      void step.offsetWidth;
      step.classList.add('is-arrived');
      pulse(step.querySelector('.svc-step-dot'));
    }
    window.requestAnimationFrame(check);
  }
  steps.forEach(function (step) {
    step.addEventListener('animationend', function (e) {
      if (e.animationName === 'svc-arrive') step.classList.remove('is-arrived');
    });
  });
  function stepFor(hash) {
    var id = '';
    try { id = decodeURIComponent(String(hash || '').slice(1)); } catch (e) { return null; }
    var target = id && document.getElementById(id);
    return target && steps.indexOf(target) > -1 ? target : null;
  }
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    var step = link && stepFor(link.getAttribute('href'));
    if (step && !reduced()) arrive(step);
  });
  var linked = stepFor(window.location.hash);
  if (linked && !reduced()) arrive(linked);
})();

// Home page, "How it works": the motion (the look is in styles.css). As the
// visitor scrolls, the checklist's boxes tick one after another, each once its
// row has risen above a line 70% of the way down the window (scrolling back
// up unticks them), and a plane flies along a track from EDL towards ABROAD,
// landing when all six are ticked. The first time the section comes into view
// the text eases in and the card lands, its rows following one after another.
// With reduced motion none of it runs: the card stays as it is in the page,
// with the first two steps ticked.
(function () {
  'use strict';

  var section = document.querySelector('.how');
  var card = section && section.querySelector('.how-card');
  if (!card) return;
  var still = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  if (still && still.matches) return;

  var READING_LINE = 0.7; // of the window's height
  var TICK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var items = Array.prototype.slice.call(card.querySelectorAll('.how-item'));
  var boxes = items.map(function (item) { return item.querySelector('.how-box'); });
  if (!items.length || boxes.indexOf(null) > -1) return;

  // every box gets a tick to draw, and they all start empty (remembering
  // which were ticked in the page, for reduced motion later)
  var original = boxes.map(function (box) { return box.classList.contains('is-ticked'); });
  boxes.forEach(function (box) {
    if (!box.querySelector('svg')) box.innerHTML = TICK;
    box.classList.remove('is-ticked');
    box.addEventListener('animationend', function (e) {
      if (e.animationName === 'how-pulse') box.classList.remove('is-pulse');
    });
  });

  // the route: EDL, a track with the plane, ABROAD (in place of the arrow)
  var route = card.querySelector('.how-card-route');
  var fill = null;
  var plane = null;
  if (route) {
    var track = document.createElement('span');
    track.className = 'how-track';
    fill = document.createElement('span');
    fill.className = 'how-track-fill';
    plane = document.createElement('span');
    plane.className = 'how-plane';
    plane.innerHTML = '<svg viewBox="-0.5 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>';
    track.appendChild(fill);
    track.appendChild(plane);
    var arrow = route.querySelector('svg');
    if (arrow) route.insertBefore(track, arrow);
    else route.appendChild(track);
  }
  card.classList.add('is-live');

  var lastCount = null;
  var ticking = false;

  function update() {
    ticking = false;
    var line = window.innerHeight * READING_LINE;
    var count = 0;
    boxes.forEach(function (box, i) {
      var r = box.getBoundingClientRect();
      var on = r.top + r.height / 2 <= line;
      if (on) count = i + 1;
    });
    boxes.forEach(function (box, i) {
      var on = i < count;
      if (on === box.classList.contains('is-ticked')) return;
      box.classList.toggle('is-ticked', on);
      if (on && lastCount !== null && count > lastCount) {
        box.classList.remove('is-pulse');
        void box.offsetWidth;
        box.classList.add('is-pulse');
      }
    });
    if (fill) {
      var share = (count / boxes.length * 100) + '%';
      fill.style.width = share;
      plane.style.left = share;
    }
    lastCount = count;
  }

  function later() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }

  // the first view: the text, the card, then its rows
  if (window.IntersectionObserver) {
    Array.prototype.forEach.call(section.querySelectorAll('.how-intro > *'), function (el, i) {
      el.style.setProperty('--i', String(i));
    });
    items.forEach(function (item, i) { item.style.setProperty('--i', String(i)); });
    section.classList.add('is-waiting');
    // watched on the card, not the section: on a big screen the top of the
    // navy band already shows below the hero, and it shouldn't play unseen
    var seen = new IntersectionObserver(function (entries) {
      if (!entries[entries.length - 1].isIntersecting) return;
      seen.disconnect();
      section.classList.remove('is-waiting');
      section.classList.add('is-in');
    }, { rootMargin: '0px 0px -15% 0px' });
    seen.observe(card);
  }

  update();
  window.addEventListener('scroll', later, { passive: true });
  window.addEventListener('resize', later);
  // asked for reduced motion part way through: put the card back as it was
  if (still) {
    var restore = function () {
      if (!still.matches) return;
      window.removeEventListener('scroll', later);
      window.removeEventListener('resize', later);
      section.classList.remove('is-waiting', 'is-in');
      var count = 0;
      boxes.forEach(function (box, i) { box.classList.toggle('is-ticked', original[i]); if (original[i]) count++; });
      if (fill) { fill.style.width = (count / boxes.length * 100) + '%'; plane.style.left = fill.style.width; }
    };
    if (still.addEventListener) still.addEventListener('change', restore);
    else if (still.addListener) still.addListener(restore);
  }
})();

// Whether the office is open, worked out in Kenya time (UTC+3 all year)
// whatever the visitor's own time zone: the "Open now" badge by the hours in
// the footer, and the little door sign (OPEN / CLOSING / CLOSED) on Find Us.
// Knows the fixed public holidays and Easter. Days whose date moves each year
// (Eid) or one-off closures go in EXTRA_CLOSED_DAYS as 'YYYY-MM-DD'.
(function () {
  'use strict';

  var badges = document.querySelectorAll('[data-open-status]');
  var sign = document.querySelector('[data-door-sign]');
  if (!badges.length && !sign) return;

  var OPEN_HOUR = 8, CLOSE_HOUR = 17;
  var SOON_MINUTES = 60; // the sign turns to CLOSING for the last hour
  var EXTRA_CLOSED_DAYS = [];
  // Jan 1, Labour Day, Madaraka, Mazingira, Mashujaa, Jamhuri, Christmas, Boxing Day
  var FIXED_HOLIDAYS = ['01-01', '05-01', '06-01', '10-10', '10-20', '12-12', '12-25', '12-26'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var key = function (d) { return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); };
  var addDays = function (d, n) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n)); };

  var easterCache = {};
  function easter(year) { // Gregorian Easter Sunday (anonymous algorithm)
    if (easterCache[year]) return easterCache[year];
    var a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
    var f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return (easterCache[year] = new Date(Date.UTC(year, month - 1, day)));
  }

  function isHoliday(d) {
    var ymd = key(d), md = ymd.slice(5);
    if (FIXED_HOLIDAYS.indexOf(md) > -1 || EXTRA_CLOSED_DAYS.indexOf(ymd) > -1) return true;
    // a fixed holiday that falls on a Sunday is taken on the Monday
    if (d.getUTCDay() === 1 && FIXED_HOLIDAYS.indexOf(key(addDays(d, -1)).slice(5)) > -1) return true;
    var e = easter(d.getUTCFullYear());
    return ymd === key(addDays(e, -2)) || ymd === key(addDays(e, 1)); // Good Friday, Easter Monday
  }

  var isWorkday = function (d) { var w = d.getUTCDay(); return w > 0 && w < 6 && !isHoliday(d); };
  var hourLabel = function (h) { return (h > 12 ? h - 12 : h) + (h >= 12 ? 'pm' : 'am'); };

  function status() {
    var now = new Date(Date.now() + 3 * 3600 * 1000); // Kenya wall clock in the UTC fields
    var today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    var minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    var close = hourLabel(CLOSE_HOUR), open = hourLabel(OPEN_HOUR);
    if (isWorkday(today) && minutes >= OPEN_HOUR * 60 && minutes < CLOSE_HOUR * 60) {
      var soon = minutes >= CLOSE_HOUR * 60 - SOON_MINUTES;
      return {
        state: soon ? 'soon' : 'open',
        text: 'Open now \u00b7 closes ' + close,
        word: soon ? 'Closing' : 'Open',
        back: soon ? 'Closing at ' + close : 'Here until ' + close
      };
    }
    var when = null;
    if (isWorkday(today) && minutes < OPEN_HOUR * 60) when = 'today';
    for (var n = 1; !when && n < 14; n++) {
      var day = addDays(today, n);
      if (isWorkday(day)) when = n === 1 ? 'tomorrow' : DAYS[day.getUTCDay()];
    }
    if (!when) return null;
    return {
      state: 'closed',
      text: 'Closed \u00b7 opens ' + (when === 'today' ? open + ' today' : when + ' ' + open),
      word: 'Closed',
      back: 'Back ' + when + ' at ' + open
    };
  }

  var lastState = '';
  function render() {
    var s = status();
    Array.prototype.forEach.call(badges, function (badge) {
      if (!s) { badge.hidden = true; return; }
      badge.textContent = s.text;
      badge.classList.toggle('is-open', s.state !== 'closed');
      badge.classList.toggle('is-soon', s.state === 'soon');
      badge.hidden = false;
    });
    if (sign) {
      var plate = sign.querySelector('.door-sign-plate');
      var back = sign.querySelector('[data-door-back]');
      if (!s) { plate.hidden = true; back.hidden = true; return; }
      sign.classList.toggle('is-open', s.state === 'open');
      sign.classList.toggle('is-soon', s.state === 'soon');
      sign.querySelector('[data-door-word]').textContent = s.word.toUpperCase();
      // the plate is decoration; screen readers get "Open now." etc. here instead
      back.textContent = '';
      var said = document.createElement('span');
      said.className = 'sr-only';
      said.textContent = (s.state === 'closed' ? 'Closed now' : s.state === 'soon' ? 'Closing soon' : 'Open now') + '. ';
      back.appendChild(said);
      back.appendChild(document.createTextNode(s.back));
      plate.hidden = false;
      back.hidden = false;
      // a little swing when the sign flips over while the page is open
      if (lastState && lastState !== s.state) {
        sign.classList.remove('is-swinging');
        // eslint-disable-next-line no-unused-expressions
        sign.offsetWidth;
        sign.classList.add('is-swinging');
      }
    }
    lastState = s ? s.state : '';
  }

  render();
  window.setInterval(render, 60 * 1000);
})();

// FAQ answers have their own addresses (index.html#faq-visa and so on): a link
// to one opens that answer, and opening one puts its address in the address
// bar, with a "Copy link" button beside it, so staff can send the answer itself.
(function () {
  'use strict';

  var items = document.querySelectorAll('details.faq-item[id]');
  if (!items.length) return;

  function openFromHash(scroll) {
    var id = window.location.hash.slice(1);
    var item = id && document.getElementById(id);
    if (!item || !item.classList.contains('faq-item')) return;
    item.open = true;
    if (scroll) item.scrollIntoView({ block: 'center' });
  }

  Array.prototype.forEach.call(items, function (item) {
    var answer = item.querySelector('p');
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'faq-copy';
    button.textContent = 'Copy link';
    button.addEventListener('click', function () {
      var url = window.location.href.split('#')[0] + '#' + item.id;
      var done = function () {
        button.textContent = 'Link copied';
        window.setTimeout(function () { button.textContent = 'Copy link'; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link:', url); });
      } else {
        window.prompt('Copy this link:', url);
      }
    });
    (answer ? answer.parentNode : item).insertBefore(button, answer ? answer.nextSibling : null);

    // on the visitor's click only (the first answer starts open, and browsers
    // report that as a toggle too)
    item.querySelector('summary').addEventListener('click', function () {
      window.setTimeout(function () {
        if (item.open && window.history.replaceState) window.history.replaceState(null, '', '#' + item.id);
      }, 0);
    });
  });

  openFromHash(false);
  window.addEventListener('hashchange', function () { openFromHash(true); });

  // Arriving on a link to an answer: sections above the FAQ can still grow
  // after the jump (the testimonials load a moment later), which pushes the
  // answer down the page and out of sight. For a few seconds, while the
  // visitor hasn't scrolled or tapped, bring it back into view each time the
  // page changes height.
  var target = window.location.hash && document.getElementById(window.location.hash.slice(1));
  if (target && target.classList.contains('faq-item') && window.ResizeObserver) {
    var settle = function () { target.scrollIntoView({ block: 'start', behavior: 'auto' }); };
    var stop = function () {
      watcher.disconnect();
      ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (type) { window.removeEventListener(type, stop, true); });
    };
    var watcher = new ResizeObserver(settle);
    watcher.observe(document.body);
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (type) { window.addEventListener(type, stop, true); });
    window.setTimeout(stop, 10000);
  }
})();

// Find Us: "Copy address" puts the address on the clipboard; "Share location"
// opens the phone's own share sheet where there is one (and WhatsApp, its
// link, everywhere else).
(function () {
  'use strict';

  var box = document.querySelector('[data-loc-share]');
  if (!box) return;

  var copyBtn = box.querySelector('[data-copy-address]');
  if (copyBtn && navigator.clipboard && navigator.clipboard.writeText) {
    var label = copyBtn.querySelector('span');
    copyBtn.hidden = false;
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(copyBtn.getAttribute('data-copy-address')).then(function () {
        label.textContent = 'Address copied';
        window.setTimeout(function () { label.textContent = 'Copy address'; }, 2000);
      }, function () { /* clipboard refused: leave the button as it was */ });
    });
  }

  var shareLink = box.querySelector('[data-share-location]');
  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (shareLink && navigator.share && coarse) {
    shareLink.addEventListener('click', function (event) {
      event.preventDefault();
      navigator.share({ title: 'Studies and Awards Limited', text: box.getAttribute('data-share-text') })
        .catch(function () { /* closed the share sheet: nothing to do */ });
    });
  }
})();
