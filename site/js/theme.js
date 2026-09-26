// Theme switch: the sun and moon button in the header, on the main site and in
// the student portal. The page's theme is already set before it's drawn, by
// the small script in each page's <head> (data-theme on <html>). This keeps
// the button in step, saves the visitor's choice on this device, and follows
// the device's own light or dark setting for anyone who hasn't chosen.
// Choosing the same theme as the device's setting forgets the choice, so the
// page goes back to following the device.
(function () {
  'use strict';

  var root = document.documentElement;
  var buttons = document.querySelectorAll('.theme-toggle');
  var device = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function saved() {
    try { var t = localStorage.getItem('theme'); return t === 'light' || t === 'dark' ? t : null; } catch (e) { return null; }
  }
  function save(theme) {
    try { if (theme) localStorage.setItem('theme', theme); else localStorage.removeItem('theme'); } catch (e) { /* private window: this visit only */ }
  }
  function deviceTheme() { return device && device.matches ? 'dark' : 'light'; }
  function current() { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }

  function syncButtons() {
    var dark = current() === 'dark';
    Array.prototype.forEach.call(buttons, function (button) {
      button.setAttribute('aria-pressed', dark ? 'true' : 'false');
      button.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    });
  }

  function apply(theme) {
    if (theme === current()) return;
    // every colour changes at once (see .theme-switching in the stylesheet)
    root.classList.add('theme-switching');
    root.setAttribute('data-theme', theme);
    syncButtons();
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { root.classList.remove('theme-switching'); });
    });
  }

  if (!root.hasAttribute('data-theme')) root.setAttribute('data-theme', saved() || deviceTheme());
  syncButtons();

  Array.prototype.forEach.call(buttons, function (button) {
    button.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      save(next === deviceTheme() ? null : next);
      apply(next);
    });
  });

  // the device switches between light and dark (by hand, or at sunset)
  var onDeviceChange = function () { if (!saved()) apply(deviceTheme()); };
  if (device && device.addEventListener) device.addEventListener('change', onDeviceChange);
  else if (device && device.addListener) device.addListener(onDeviceChange);

  // a choice made in another tab of the site
  window.addEventListener('storage', function (event) {
    if (event.key === 'theme' || event.key === null) apply(saved() || deviceTheme());
  });
})();

// Pull cord: a second, playful way to switch the theme on laptops and desktops.
// A cord hangs at the right end of the page like a lamp's pull chain; pull the
// gold knob down past the click (or just click it) and the theme switches, mid
// pull like a real pull chain. The cord is a small rope simulation (Verlet
// integration) that stops working when it is still. It shows on mouse and
// trackpad screens 1024px and wider, where it takes the place of the header's
// sun and moon button (hidden there, see .pull-cord in styles.css; phones and
// tablets keep the button). So it is also a proper button for everyone else:
// the Tab key reaches it just after the header, screen readers hear "Dark
// mode, toggle button", and Enter or Space switches. It presses the hidden
// header button, so the choice is saved the same way. With "reduce motion"
// on, it hangs still and a click switches. Inspired by PullCord from FeralUI
// (feralui.dev/pullcord).
(function () {
  'use strict';

  var toggle = document.querySelector('.site-header .theme-toggle');
  if (!toggle || !window.matchMedia || !window.requestAnimationFrame) return;
  var root = document.documentElement;
  var shown = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');

  // the drawing area (CSS px; it scales with the page like everything else)
  var W = 120, H = 360;
  var AX = W - 30, AY = -4;      // where the cord hangs from, just above the top edge
  var LINKS = 12, LINK = 9.5;    // the cord is made of 12 links, about 114px long
  var GRAVITY = 0.45, DAMPING = 0.98, ITERATIONS = 16;
  var CLICK_AT = 34;             // pull the knob this far below where it rests to switch
  var MAX_STRETCH = 1.45;        // how far the cord gives before it stops
  var REST_Y = AY + LINKS * LINK;

  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    for (var key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  }
  var svg = el('svg', { 'class': 'pull-cord', viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'button', tabindex: 0, 'aria-label': 'Dark mode', 'aria-pressed': 'false' });
  var hit = el('path', { 'class': 'pull-cord-hit' }, svg);
  var line = el('path', { 'class': 'pull-cord-line' }, svg);
  var knob = el('g', { 'class': 'pull-cord-knob' }, svg);
  var tip = el('title', {}, knob);
  el('rect', { 'class': 'pull-cord-ring', x: -15, y: -7, width: 30, height: 38, rx: 15 }, knob);   // keyboard focus
  el('rect', { 'class': 'pull-cord-bead', x: -11, y: -3, width: 22, height: 30, rx: 11 }, knob);
  // the same moon and sun as the header button, at half size, in the middle of the knob
  var moon = el('g', { 'class': 'pull-cord-icon pull-cord-moon', transform: 'translate(-6 6) scale(0.5)' }, knob);
  el('path', { d: 'M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z' }, moon);
  var sun = el('g', { 'class': 'pull-cord-icon pull-cord-sun', transform: 'translate(-6 6) scale(0.5)' }, knob);
  el('circle', { cx: 12, cy: 12, r: 4 }, sun);
  el('path', { d: 'M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4' }, sun);
  // just after the header, so it comes next in the Tab order and for screen readers
  var header = document.querySelector('.site-header');
  header.parentNode.insertBefore(svg, header.nextSibling);

  // the cord's points: [x, y, previous x, previous y]; point 0 is fixed at the top
  var pts = [];
  var firstTime = true;
  try { firstTime = !sessionStorage.getItem('pull-cord-seen'); sessionStorage.setItem('pull-cord-seen', '1'); } catch (e) { /* storage blocked */ }
  for (var i = 0; i <= LINKS; i++) {
    var y = AY + i * LINK;
    // on the first page of a visit the cord drops in from the top; after that it just hangs there
    var sx = firstTime && !still.matches && i > 0 ? AX + (i % 2 ? 3 : -3) : AX;
    var sy = firstTime && !still.matches ? AY + i * 1.2 : y;
    pts.push([sx, sy, sx, sy]);
  }

  var dragging = false, target = null, grabDY = 0, pressX = 0, pressY = 0, moved = 0;
  var armed = true, switchedThisPull = false;
  var raf = null, calm = 0, last = 0, spare = 0;

  function draw() {
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 1; i < pts.length - 1; i++) {
      var mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += ' Q' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1) + ' ' + mx.toFixed(1) + ' ' + my.toFixed(1);
    }
    var end = pts[pts.length - 1], before = pts[pts.length - 2];
    d += ' L' + end[0].toFixed(1) + ' ' + end[1].toFixed(1);
    line.setAttribute('d', d);
    hit.setAttribute('d', d);
    // the knob hangs along the last link
    var angle = Math.atan2(end[0] - before[0], end[1] - before[1]) * -180 / Math.PI;
    knob.setAttribute('transform', 'translate(' + end[0].toFixed(1) + ' ' + end[1].toFixed(1) + ') rotate(' + angle.toFixed(1) + ')');
  }

  function step() {
    var n = pts.length - 1;
    for (var i = 1; i <= n; i++) {
      var p = pts[i];
      var vx = (p[0] - p[2]) * DAMPING, vy = (p[1] - p[3]) * DAMPING;
      p[2] = p[0]; p[3] = p[1];
      p[0] += vx; p[1] += vy + GRAVITY;
    }
    for (var k = 0; k < ITERATIONS; k++) {
      pts[0][0] = AX; pts[0][1] = AY;
      if (dragging) { pts[n][0] = target[0]; pts[n][1] = target[1]; }
      for (var j = 0; j < n; j++) {
        var a = pts[j], b = pts[j + 1];
        var dx = b[0] - a[0], dy = b[1] - a[1];
        var dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        var diff = (dist - LINK) / dist;
        var aFixed = j === 0, bFixed = dragging && j + 1 === n;
        if (aFixed && bFixed) continue;
        var wa = aFixed ? 0 : bFixed ? 1 : 0.5, wb = bFixed ? 0 : aFixed ? 1 : 0.5;
        a[0] += dx * diff * wa; a[1] += dy * diff * wa;
        b[0] -= dx * diff * wb; b[1] -= dy * diff * wb;
      }
    }
    // pulled far enough: switch, once per pull, like a pull chain's click
    var drop = pts[n][1] - REST_Y;
    if (dragging && armed && drop > CLICK_AT) { armed = false; switchedThisPull = true; flip(); }
    if (!armed && !dragging && drop < CLICK_AT * 0.4) armed = true;
  }

  function flip() {
    toggle.click();
    svg.classList.remove('is-clicked');
    void svg.getBoundingClientRect();
    svg.classList.add('is-clicked');
  }

  function frame(now) {
    raf = null;
    spare = Math.min(spare + (last ? now - last : 16.7), 50);
    last = now;
    var steps = 0;
    while (spare >= 16.7 && steps < 3) { step(); spare -= 16.7; steps++; }
    draw();
    // stop once the cord has settled: its points moving less than a third of a
    // pixel a frame between them, which can't be seen
    var motion = 0;
    for (var i = 1; i < pts.length; i++) motion += Math.abs(pts[i][0] - pts[i][2]) + Math.abs(pts[i][1] - pts[i][3]);
    calm = !dragging && motion < 0.3 ? calm + 1 : 0;
    if (calm > 20) { svg.classList.remove('is-moving'); last = 0; spare = 0; return; }
    svg.classList.add('is-moving');
    raf = window.requestAnimationFrame(frame);
  }
  function wake() { calm = 0; if (!raf && !still.matches) raf = window.requestAnimationFrame(frame); }

  // mouse position in the cord's own units (the page may be scaled on laptops)
  function local(event) {
    var box = svg.getBoundingClientRect();
    var scale = W / box.width;
    return [(event.clientX - box.left) * scale, (event.clientY - box.top) * scale];
  }
  function clamp(p) {
    var dx = p[0] - AX, dy = p[1] - AY, dist = Math.sqrt(dx * dx + dy * dy), max = LINKS * LINK * MAX_STRETCH;
    return dist > max ? [AX + dx / dist * max, AY + dy / dist * max] : p;
  }

  function onDown(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    pressX = event.clientX; pressY = event.clientY; moved = 0; switchedThisPull = false;
    if (still.matches) return;
    var p = local(event), end = pts[pts.length - 1];
    grabDY = p[1] - end[1];
    dragging = true;
    target = clamp([p[0], p[1] - grabDY]);
    svg.classList.add('is-dragging');
    try { event.target.setPointerCapture(event.pointerId); } catch (e) { /* older browsers */ }
    wake();
  }
  function onMove(event) {
    moved = Math.max(moved, Math.abs(event.clientX - pressX) + Math.abs(event.clientY - pressY));
    if (!dragging) return;
    var p = local(event);
    target = clamp([p[0], p[1] - grabDY]);
    wake();
  }
  function onUp() {
    var wasDragging = dragging;
    dragging = false;
    svg.classList.remove('is-dragging');
    if (moved < 5 && !switchedThisPull) {
      // a plain click: switch, and give the cord a little tug so it answers
      flip();
      if (!still.matches) { var end = pts[pts.length - 1]; end[3] = end[1] - 9; wake(); }
    } else if (wasDragging) {
      wake();
    }
  }
  // the keyboard: Enter or Space, like any button
  svg.addEventListener('keydown', function (event) {
    if ((event.key !== 'Enter' && event.key !== ' ') || event.repeat) return;
    event.preventDefault();
    flip();
    if (!still.matches) { var end = pts[pts.length - 1]; end[3] = end[1] - 9; wake(); }
  });
  [knob, hit].forEach(function (part) {
    part.addEventListener('pointerdown', onDown);
    part.addEventListener('pointermove', onMove);
    part.addEventListener('pointerup', onUp);
    part.addEventListener('pointercancel', function () { dragging = false; svg.classList.remove('is-dragging'); wake(); });
  });

  // its state and hover text follow the theme, however it was switched
  function label() {
    var dark = root.getAttribute('data-theme') === 'dark';
    svg.setAttribute('aria-pressed', dark ? 'true' : 'false');
    tip.textContent = dark ? 'Pull for light mode' : 'Pull for dark mode';
  }
  label();
  new MutationObserver(label).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  draw();
  if (shown.matches) wake();
  var onShown = function () { if (shown.matches) wake(); };
  if (shown.addEventListener) shown.addEventListener('change', onShown); else if (shown.addListener) shown.addListener(onShown);
})();
