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
