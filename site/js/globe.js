// The home page globe, drawn as a sphere. The land dots (js/globe-dots.js,
// made by tools/make-globe-dots.mjs) sit at their real latitude and longitude
// on a ball seen slightly from above, turning slowly: dots curve and crowd
// together towards the edge, fade there, and pass out of sight round the
// back. The routes from Eldoret rise off the surface in arcs to each
// destination, with a dot travelling along each, and Eldoret gives a gentle
// pulse.
//
// It is drawn on a canvas a little larger than the globe, so the arcs can
// rise above the horizon at the edge. The navy ball, its shine, the gold ring
// and the flags are the page's own (styles.css); this only adds the dots and
// routes on top of the ball. Without this script the flat map in the markup
// shows instead. It stops drawing while the globe is off screen or the tab is
// hidden, and for visitors who ask for reduced motion it is drawn once and
// left still.
(function () {
  'use strict';

  var data = window.GLOBE_DOTS;
  var globe = document.querySelector('.globe');
  var sphere = globe && globe.querySelector('.globe-sphere');
  if (!data || !sphere) return;

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;
  canvas.className = 'globe-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  globe.insertBefore(canvas, sphere.nextSibling);
  globe.classList.add('is-3d');

  var RAD = Math.PI / 180;
  var OVERSIZE = 1.3; // the canvas is 130% of the globe (styles.css .globe-canvas)
  var TILT = 18 * RAD; // seen from 18 degrees north, so the northern destinations show well
  var TURN_SECONDS = 60; // one turn a minute
  var START_LON = 20; // Africa and Europe facing at first
  var LIGHT = norm([-0.55, 0.6, 0.6]); // from the upper left, as the shine on the ball

  function norm(v) {
    var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
  }
  function vec(lon, lat) {
    var a = lon * RAD;
    var b = lat * RAD;
    return [Math.cos(b) * Math.sin(a), Math.sin(b), Math.cos(b) * Math.cos(a)];
  }
  function unpack(list) {
    var out = [];
    for (var i = 0; i < list.length; i += 2) out.push(vec(list[i] / 10, list[i + 1] / 10));
    return out;
  }
  var land = unpack(data.land);
  var gold = unpack(data.gold);
  var origin = vec(data.origin.lon, data.origin.lat);

  // each route: points along the great circle, lifted off the surface into an
  // arc (longer routes rise higher)
  var routes = data.routes.map(function (r, n) {
    var b = vec(r.lon, r.lat);
    var dot = origin[0] * b[0] + origin[1] * b[1] + origin[2] * b[2];
    var angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    var lift = 0.06 + 0.16 * (angle / Math.PI);
    var points = [];
    for (var i = 0; i <= 64; i++) {
      var t = i / 64;
      var s1 = Math.sin((1 - t) * angle) / Math.sin(angle);
      var s2 = Math.sin(t * angle) / Math.sin(angle);
      var h = 1 + lift * Math.sin(Math.PI * t);
      points.push([(s1 * origin[0] + s2 * b[0]) * h, (s1 * origin[1] + s2 * b[1]) * h, (s1 * origin[2] + s2 * b[2]) * h]);
    }
    return { end: b, points: points, phase: n / data.routes.length };
  });

  // ---- drawing ----
  var size = 0;
  var radius = 0;
  var centre = 0;
  var scale = 1;

  function fit() {
    var box = canvas.getBoundingClientRect();
    scale = window.devicePixelRatio || 1;
    var px = Math.max(1, Math.round(box.width * scale));
    if (px !== size) {
      size = px;
      canvas.width = canvas.height = size;
    }
    centre = size / 2;
    radius = size / OVERSIZE / 2;
  }

  // the view for a turn of `lon` degrees: [x, y, depth] on the screen, depth > 0 facing us
  function viewer(lon) {
    var a = lon * RAD;
    var ca = Math.cos(a);
    var sa = Math.sin(a);
    var ct = Math.cos(TILT);
    var st = Math.sin(TILT);
    return function (v) {
      var x = v[0] * ca - v[2] * sa;
      var z = v[0] * sa + v[2] * ca;
      return [x, v[1] * ct - z * st, v[1] * st + z * ct];
    };
  }

  function dots(list, view, colour, alpha, r) {
    ctx.fillStyle = colour;
    for (var i = 0; i < list.length; i++) {
      var p = view(list[i]);
      if (p[2] <= 0) continue;
      // fade and shrink towards the edge, where the dots are seen side on, and
      // dim away from the light (0.45 on the far side, 1 facing it)
      var edge = Math.min(1, p[2] / 0.35);
      ctx.globalAlpha = alpha * edge * (0.45 + 0.55 * Math.max(0, p[0] * LIGHT[0] + p[1] * LIGHT[1] + p[2] * LIGHT[2]));
      ctx.beginPath();
      ctx.arc(centre + p[0] * radius, centre - p[1] * radius, r * (0.55 + 0.45 * p[2]), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // a route is drawn only on the side facing us: near the edge its arc still
  // rises a little past the horizon, and once it turns away it slips out of
  // sight with the land rather than hanging loose beside the ball
  function onScreen(p) { return p[2] > 0; }

  function draw(seconds, moving) {
    ctx.clearRect(0, 0, size, size);
    var lon = START_LON - (moving ? (seconds / TURN_SECONDS) * 360 : 0);
    var view = viewer(lon);
    var r = Math.max(1, radius / 150); // dot size, in step with the globe

    dots(land, view, '#B9C3E0', 0.42, r * 1.05);
    dots(gold, view, '#FFB800', 0.95, r * 1.25);

    // routes: dashed gold arcs
    ctx.lineWidth = Math.max(1, r * 0.9);
    ctx.lineCap = 'round';
    ctx.setLineDash([r * 1.4, r * 3.6]);
    ctx.strokeStyle = 'rgba(255, 184, 0, 0.85)';
    routes.forEach(function (route) {
      var drawing = false;
      ctx.beginPath();
      route.points.forEach(function (v) {
        var p = view(v);
        var x = centre + p[0] * radius;
        var y = centre - p[1] * radius;
        if (onScreen(p)) {
          if (drawing) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
          drawing = true;
        } else {
          drawing = false;
        }
      });
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // each destination city, and a light travelling out to it
    routes.forEach(function (route) {
      var end = view(route.end);
      if (end[2] > 0) {
        ctx.fillStyle = '#FFB800';
        ctx.beginPath();
        ctx.arc(centre + end[0] * radius, centre - end[1] * radius, r * 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centre + end[0] * radius, centre - end[1] * radius, r * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!moving) return;
      var t = (seconds / 3.2 + route.phase) % 1;
      var at = route.points[Math.round(t * 64)];
      var p = view(at);
      if (!onScreen(p)) return;
      ctx.globalAlpha = Math.sin(Math.PI * t);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(255, 220, 120, 0.9)';
      ctx.shadowBlur = r * 6;
      ctx.beginPath();
      ctx.arc(centre + p[0] * radius, centre - p[1] * radius, r * 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

    // Eldoret, with a slow pulse
    var o = view(origin);
    if (o[2] > 0) {
      var ox = centre + o[0] * radius;
      var oy = centre - o[1] * radius;
      if (moving) {
        var k = (seconds % 2.4) / 2.4;
        ctx.strokeStyle = 'rgba(255, 184, 0, ' + (0.7 * (1 - k)) + ')';
        ctx.lineWidth = Math.max(1, r);
        ctx.beginPath();
        ctx.arc(ox, oy, r * (3 + 9 * k), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#FFB800';
      ctx.beginPath();
      ctx.arc(ox, oy, r * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ox, oy, r * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- running ----
  var still = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var visible = true;
  var frame = 0;
  var started = null;
  var elapsed = 0; // seconds turned so far, kept while paused

  function tick(now) {
    frame = 0;
    if (started === null) started = now - elapsed * 1000;
    elapsed = (now - started) / 1000;
    draw(elapsed, true);
    run();
  }
  function run() {
    var moving = !(still && still.matches) && visible && !document.hidden;
    if (moving && !frame) frame = window.requestAnimationFrame(tick);
    if (!moving) {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      started = null;
      draw(elapsed, !(still && still.matches));
    }
  }

  fit();
  draw(0, false);
  // a new size: redraw at once if still, else on the next frame
  if (window.ResizeObserver) new ResizeObserver(function () { fit(); if (!frame) run(); }).observe(canvas);
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      visible = entries[entries.length - 1].isIntersecting;
      run();
    }).observe(globe);
  }
  document.addEventListener('visibilitychange', run);
  if (still) {
    if (still.addEventListener) still.addEventListener('change', run);
    else if (still.addListener) still.addListener(run);
  }
  run();
})();
